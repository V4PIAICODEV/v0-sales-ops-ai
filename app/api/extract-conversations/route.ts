import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId } = body

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId é obrigatório" }, { status: 400 })
    }

    const webhookUrl = "https://enablement-n8n-sales-ops-ai.uyk8ty.easypanel.host/webhook/extração"

    const payload = {
      workspaceId,
      userId: user.id,
      timestamp: new Date().toISOString(),
    }

    // Send webhook to n8n
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.statusText}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      workspaceId,
      message: "Extração de conversas iniciada com sucesso",
      webhookResponse: result,
    })
  } catch (error) {
    console.error("[v0] Error in extract-conversations API:", error)
    return NextResponse.json(
      {
        error: "Erro ao extrair conversas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
