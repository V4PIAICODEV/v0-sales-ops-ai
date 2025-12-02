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
    const { workspaceId, instances } = body

    if (!workspaceId || !instances || instances.length === 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const webhookUrl = "https://enablement-n8n-sales-ops-ai.uyk8ty.easypanel.host/webhook/extração"

    // Prepare payload with workspace and instances data
    const payload = {
      workspaceId,
      instances: instances.map((instance: any) => ({
        id: instance.id,
        nome: instance.nome,
        token_evolution: instance.token_evolution,
        status: instance.status,
      })),
      timestamp: new Date().toISOString(),
      userId: user.id,
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
      instances: instances.length,
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
