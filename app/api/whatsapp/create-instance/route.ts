import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { workspaceName } = await request.json()

    if (!workspaceName) {
      return NextResponse.json({ error: "workspaceName é obrigatório" }, { status: 400 })
    }

    const systemUserId = process.env.SYSTEM_USER_ID || "00000000-0000-0000-0000-000000000000"

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspace")
      .insert({
        nome: workspaceName,
        id_user: systemUserId,
      })
      .select()
      .single()

    if (workspaceError) {
      console.error("Erro ao criar workspace:", workspaceError)
      return NextResponse.json({ error: "Falha ao criar workspace no banco de dados" }, { status: 500 })
    }

    const instanceName = `${workspaceName.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`

    const { data: instancia, error: instanciaError } = await supabase
      .from("instancia")
      .insert({
        id_workspace: workspace.id,
        nome: instanceName,
        status: "aguardando_conexao",
        sync_mode: "novas",
      })
      .select()
      .single()

    if (instanciaError) {
      console.error("Erro ao criar instância no banco:", instanciaError)
      return NextResponse.json({ error: "Falha ao criar instância no banco de dados" }, { status: 500 })
    }

    console.log("[v0] Workspace and instance created, calling webhook...")

    try {
      const webhookResponse = await fetch("https://enablement-n8n-sales-ops-ai.uyk8ty.easypanel.host/webhook/qrcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome_instancia: instanceName,
          sync_full_history: false,
          id_instancia_supabase: instancia.id,
        }),
      })

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text()
        console.error("[v0] Webhook error response:", errorText)
        throw new Error(`Webhook retornou status ${webhookResponse.status}`)
      }

      const webhookData = await webhookResponse.json()
      console.log("[v0] Webhook response:", JSON.stringify(webhookData).substring(0, 200))

      const qrCodeData = webhookData.qrCode || webhookData.qrcode || webhookData.qr_code || webhookData.base64

      if (!qrCodeData) {
        console.error("[v0] QR Code not found in webhook response. Available fields:", Object.keys(webhookData))
        throw new Error("QR Code não foi retornado pelo webhook")
      }

      return NextResponse.json({
        success: true,
        workspaceId: workspace.id,
        instanciaId: instancia.id,
        instanceName,
        qrCode: qrCodeData,
      })
    } catch (webhookError: any) {
      console.error("[v0] Erro ao chamar webhook:", webhookError.message)
      return NextResponse.json({ error: "Falha ao gerar QR Code via webhook" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Erro ao criar workspace:", error)
    return NextResponse.json({ error: "Erro ao criar workspace" }, { status: 500 })
  }
}
