import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "your-api-key"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const instanceName = searchParams.get("instance")

    console.log("[v0] Verificando conexão para instância:", instanceName)

    if (!instanceName) {
      return NextResponse.json({ error: "instanceName é obrigatório" }, { status: 400 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: instanciaData, error: dbError } = await supabase
      .from("instancia")
      .select("status")
      .eq("nome", instanceName)
      .single()

    console.log("[v0] Status no banco de dados:", instanciaData?.status)

    // Se já está conectado no banco, retorna sucesso
    if (instanciaData?.status === "conectado") {
      console.log("[v0] Instância já conectada no banco de dados")
      return NextResponse.json({
        connected: true,
        state: "open",
        instanceName,
      })
    }

    // Verifica o status da conexão na Evolution API
    console.log("[v0] Verificando na Evolution API:", `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`)

    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      headers: {
        apikey: EVOLUTION_API_KEY,
      },
    })

    if (!response.ok) {
      console.log("[v0] Resposta da Evolution API não OK:", response.status)
      throw new Error("Falha ao verificar conexão")
    }

    const data = await response.json()
    console.log("[v0] Resposta da Evolution API:", JSON.stringify(data))

    const isConnected = data.state === "open"
    console.log("[v0] Está conectado?", isConnected)

    if (isConnected) {
      // Atualiza o status da instância no banco
      const { error: updateError } = await supabase
        .from("instancia")
        .update({ status: "conectado" })
        .eq("nome", instanceName)

      if (updateError) {
        console.error("[v0] Erro ao atualizar status da instância:", updateError)
      } else {
        console.log("[v0] Status atualizado no banco de dados para 'conectado'")
      }
    }

    return NextResponse.json({
      connected: isConnected,
      state: data.state,
      instanceName,
    })
  } catch (error) {
    console.error("[v0] Erro ao verificar conexão:", error)
    return NextResponse.json({ error: "Erro ao verificar conexão", connected: false }, { status: 500 })
  }
}
