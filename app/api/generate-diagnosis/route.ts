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

    const supabase = await createClient()
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspace")
      .select("nome")
      .eq("id", workspaceId)
      .single()

    if (workspaceError || !workspace) {
      console.error("[v0] Error fetching workspace:", workspaceError)
      return NextResponse.json({ error: "Workspace not found" }, { status: 400 })
    }

    const avgScore =
      analyses.length > 0
        ? analyses.reduce((sum: number, a: any) => sum + (Number(a.score) || 0), 0) / analyses.length
        : 0
    const volumeMensagens = analyses.length

    const { data: diagnosisEntry, error: dbError } = await supabase
      .from("diagnostico")
      .insert({
        id_workspace: workspaceId,
        score_medio: avgScore,
        volume_mensagens: volumeMensagens,
        url_download: null,
        status: "processing",
      })
      .select()
      .single()

    if (dbError || !diagnosisEntry) {
      console.error("[v0] Error creating diagnosis entry:", dbError)
      return NextResponse.json({ error: "Failed to create diagnosis entry" }, { status: 500 })
    }

    console.log("[v0] Diagnosis entry created with ID:", diagnosisEntry.id)
    console.log("[v0] Proxying diagnosis request to n8n webhook")

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
            body: JSON.stringify({
              ...body,
              workspace_name: workspace.nome,
              diagnosis_id: diagnosisEntry.id,
            }),
          },
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[v0] Webhook error (attempt ${attempt}/${maxRetries}):`, errorText)

          if (errorText.includes("Unused Respond to Webhook") && attempt < maxRetries) {
            console.log(`[v0] Retrying in 1 second...`)
            await new Promise((resolve) => setTimeout(resolve, 1000))
            continue
          }

          await supabase.from("diagnostico").update({ status: "failed" }).eq("id", diagnosisEntry.id)

          return NextResponse.json(
            { error: "Failed to generate diagnosis", details: errorText },
            { status: response.status },
          )
        }

        const data = await response.json()
        console.log("[v0] Diagnosis webhook called successfully")

        if (data.url_download) {
          await supabase
            .from("diagnostico")
            .update({
              url_download: data.url_download,
              status: "completed",
            })
            .eq("id", diagnosisEntry.id)
        }

        return NextResponse.json({
          diagnosis_id: diagnosisEntry.id,
          url_download: data.url_download || null,
          status: data.url_download ? "completed" : "processing",
        })
      } catch (fetchError) {
        lastError = fetchError
        if (attempt < maxRetries) {
          console.log(`[v0] Request failed (attempt ${attempt}/${maxRetries}), retrying...`)
          await new Promise((resolve) => setTimeout(resolve, 1000))
          continue
        }
      }
    }

    await supabase.from("diagnostico").update({ status: "failed" }).eq("id", diagnosisEntry.id)
    throw lastError || new Error("All retry attempts failed")
  } catch (error) {
    console.error("[v0] Error proxying diagnosis request:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
