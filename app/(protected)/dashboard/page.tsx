import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, TrendingUp, MessageCircle, Activity } from "lucide-react"
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

  const { data: analyses } = await supabase
    .from("analise")
    .select(
      `
      score,
      qtd_followups,
      tempo_resposta_inicial,
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

  let avgResponseMinutes = 0
  if (analyses && analyses.length > 0) {
    const validResponseTimes = analyses.filter((a) => a.tempo_resposta_inicial)
    if (validResponseTimes.length > 0) {
      // PostgreSQL interval comes as a string like "00:05:30" (HH:MM:SS)
      const totalMinutes = validResponseTimes.reduce((sum, a) => {
        const interval = a.tempo_resposta_inicial
        if (typeof interval === "string") {
          // Parse interval string to minutes
          const parts = interval.split(":")
          const hours = Number.parseInt(parts[0] || "0")
          const minutes = Number.parseInt(parts[1] || "0")
          return sum + hours * 60 + minutes
        }
        return sum
      }, 0)
      avgResponseMinutes = Math.round(totalMinutes / validResponseTimes.length)
    }
  }

  // Calculate metrics
  const avgScore =
    analyses && analyses.length > 0
      ? (analyses.reduce((sum, a) => sum + (Number(a.score) || 0), 0) / analyses.length).toFixed(1)
      : "0.0"

  const totalFollowups = analyses?.reduce((sum, a) => sum + (a.qtd_followups || 0), 0) || 0
  const totalConversations = analyses?.length || 0
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseMinutes}min</div>
            <p className="text-xs text-muted-foreground">tempo médio</p>
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
