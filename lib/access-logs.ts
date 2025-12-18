import { createClient } from "@/lib/supabase/client"

interface LogAccessParams {
  evento: "login" | "logout" | "session_refresh"
  sucesso?: boolean
  erro?: string
  metadata?: Record<string, unknown>
}

export async function logUserAccess(params: LogAccessParams) {
  try {
    const supabase = createClient()

    // Obter informações do navegador
    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "unknown"

    // Obter IP (será null no client, mas podemos adicionar via API route se necessário)
    const ip_address = null

    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user?.id) {
      console.error("[v0] Cannot log access: user not authenticated")
      return
    }

    const { error } = await supabase.from("log_acesso").insert({
      id_user: userData.user.id,
      evento: params.evento,
      ip_address,
      user_agent: userAgent,
      sucesso: params.sucesso ?? true,
      erro: params.erro,
      metadata: params.metadata,
    })

    if (error) {
      console.error("[v0] Error logging access:", error)
    }
  } catch (error) {
    console.error("[v0] Failed to log access:", error)
  }
}
