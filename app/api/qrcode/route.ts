import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome_instancia, sync_full_history } = body

    if (!nome_instancia) {
      return NextResponse.json({ error: "nome_instancia é obrigatório" }, { status: 400 })
    }

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 180000) // 3 minutes

    try {
      // Make request to webhook with body (even though it's unusual for GET)
      const response = await fetch("https://enablement-n8n-sales-ops-ai.uyk8ty.easypanel.host/webhook/qrcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome_instancia,
          sync_full_history: sync_full_history ?? false,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return NextResponse.json({ error: `Webhook retornou erro: ${response.status}` }, { status: response.status })
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === "AbortError") {
        return NextResponse.json({ error: "Timeout: A requisição demorou mais de 3 minutos" }, { status: 408 })
      }

      throw error
    }
  } catch (error) {
    console.error("[v0] Erro ao gerar QR code:", error)
    return NextResponse.json({ error: "Erro ao gerar QR code. Tente novamente." }, { status: 500 })
  }
}
