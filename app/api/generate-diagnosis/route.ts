import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentWorkspaceId } from "@/lib/workspace"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { analyses, timestamp } = body

    const workspaceId = await getCurrentWorkspaceId()
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 400 })
    }

    const avgScore =
      analyses.length > 0
        ? analyses.reduce((sum: number, a: any) => sum + (Number(a.score) || 0), 0) / analyses.length
        : 0
    const volumeMensagens = analyses.length

    console.log("[v0] Proxying diagnosis request to n8n webhook")

    // Retry logic: try up to 3 times with 1 second delay between attempts
    let lastError: any
    const maxRetries = 3

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(
          "https://enablement-n8n-sales-ops-ai.uyk8ty.easypanel.host/webhook/diagnosticoComercial",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          },
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[v0] Webhook error (attempt ${attempt}/${maxRetries}):`, errorText)

          // If it's the "Unused Respond to Webhook" error, retry
          if (errorText.includes("Unused Respond to Webhook") && attempt < maxRetries) {
            console.log(`[v0] Retrying in 1 second...`)
            await new Promise((resolve) => setTimeout(resolve, 1000))
            continue
          }

          return NextResponse.json(
            { error: "Failed to generate diagnosis", details: errorText },
            { status: response.status },
          )
        }

        const data = await response.json()
        console.log("[v0] Diagnosis generated successfully")

        const supabase = await createClient()
        const { error: dbError } = await supabase.from("diagnostico").insert({
          id_workspace: workspaceId,
          score_medio: avgScore,
          volume_mensagens: volumeMensagens,
          url_download: data.url_download || null,
          status: "completed",
        })

        if (dbError) {
          console.error("[v0] Error saving diagnosis to database:", dbError)
          // Don't fail the request, just log the error
        }

        return NextResponse.json(data)
      } catch (fetchError) {
        lastError = fetchError
        if (attempt < maxRetries) {
          console.log(`[v0] Request failed (attempt ${attempt}/${maxRetries}), retrying...`)
          await new Promise((resolve) => setTimeout(resolve, 1000))
          continue
        }
      }
    }

    // If all retries failed
    throw lastError || new Error("All retry attempts failed")
  } catch (error) {
    console.error("[v0] Error proxying diagnosis request:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
