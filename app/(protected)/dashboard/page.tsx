import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, TrendingUp, MessageCircle, Activity, Timer } from "lucide-react"
import { MetricsRadarChart } from "@/components/metrics-radar-chart"
import { DeviceDistributionChart } from "@/components/device-distribution-chart"
import { getCurrentWorkspaceId } from "@/lib/workspace"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const workspaceId = await getCurrentWorkspaceId()

  if (!workspaceId) return null

  // Fetch metrics
  const { data: analyses } = await supabase
    .from("analise")
    .select(
      `
      score,
      tempo_resposta_inicial,
      tempo_resposta_medio,
      qtd_followups,
      conversa!inner(
        instancia!inner(
          id_workspace
        )
      )
    `,
    )
    .eq("conversa.instancia.id_workspace", workspaceId)

  const { data: clientDevices } = await supabase
    .from("cliente")
    .select(
      `
      device,
      conversa!inner(
        instancia!inner(
          id_workspace
        )
      )
    `,
    )
    .eq("conversa.instancia.id_workspace", workspaceId)

  const { data: conversations } = await supabase
    .from("conversa")
    .select(
      `
      id,
      mensagem (
        autor,
        timestamp
      ),
      instancia!inner(
        id_workspace
      )
    `,
    )
    .eq("instancia.id_workspace", workspaceId)
    .order("timestamp", { foreignTable: "mensagem", ascending: true })

  let totalInitialResponseTime = 0
  let initialResponseCount = 0
  let totalAllResponseTime = 0
  let allResponseCount = 0

  if (conversations && conversations.length > 0) {
    for (const conv of conversations) {
      const messages = conv.mensagem || []
      let isFirstResponse = true

      for (let i = 0; i < messages.length - 1; i++) {
        const currentMsg = messages[i]
        const nextMsg = messages[i + 1]

        // If current message is from client and next is from seller
        if (currentMsg.autor === "cliente" && nextMsg.autor === "vendedor") {
          const clientTime = new Date(currentMsg.timestamp).getTime()
          const sellerTime = new Date(nextMsg.timestamp).getTime()
          const diffMinutes = (sellerTime - clientTime) / 1000 / 60

          if (diffMinutes > 0 && diffMinutes < 1440) {
            // Ignore responses > 24 hours
            // Track initial response (first seller response to first client message)
            if (isFirstResponse) {
              totalInitialResponseTime += diffMinutes
              initialResponseCount++
              isFirstResponse = false
            }

            // Track all responses for average
            totalAllResponseTime += diffMinutes
            allResponseCount++
          }
        }
      }
    }
  }

  const avgInitialResponseTime =
    initialResponseCount > 0 ? Math.round(totalInitialResponseTime / initialResponseCount) : 0
  const avgResponseTime = allResponseCount > 0 ? Math.round(totalAllResponseTime / allResponseCount) : 0

  // Calculate metrics
  const avgScore =
    analyses && analyses.length > 0
      ? (analyses.reduce((sum, a) => sum + (Number(a.score) || 0), 0) / analyses.length).toFixed(1)
      : "0.0"

  const totalFollowups = analyses?.reduce((sum, a) => sum + (a.qtd_followups || 0), 0) || 0
  const totalConversations = conversations?.length || 0
  const avgFollowups = totalConversations > 0 ? (totalFollowups / totalConversations).toFixed(2) : "0.00"

  const { count: activeInstancesCount } = await supabase
    .from("instancia")
    .select("*", { count: "exact", head: true })
    .eq("id_workspace", workspaceId)
    .eq("status", "conectado")

  const { count: totalInstancesCount } = await supabase
    .from("instancia")
    .select("*", { count: "exact", head: true })
    .eq("id_workspace", workspaceId)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral das suas análises de WhatsApp</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore}</div>
            <p className="text-xs text-muted-foreground">de {totalConversations} conversas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resposta Inicial</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgInitialResponseTime}min</div>
            <p className="text-xs text-muted-foreground">primeiro contato</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resposta Média</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}min</div>
            <p className="text-xs text-muted-foreground">todas as respostas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Follow-ups</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgFollowups}</div>
            <p className="text-xs text-muted-foreground">follow-ups por conversa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instâncias</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInstancesCount || 0}</div>
            <p className="text-xs text-muted-foreground">{activeInstancesCount || 0} ativas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Categorias de Avaliação</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsRadarChart workspaceId={workspaceId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispositivos dos Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <DeviceDistributionChart devices={clientDevices || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
