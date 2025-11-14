import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, TrendingUp, MessageCircle, Activity } from 'lucide-react'
import { MetricsRadarChart } from "@/components/metrics-radar-chart"
import { InstanceStatus } from "@/components/instance-status"
import { DeviceDistributionChart } from "@/components/device-distribution-chart"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get current workspace from cookie or first workspace
  const { data: workspaces } = await supabase.from("workspace").select("id").eq("id_user", user.id).limit(1)

  const workspaceId = workspaces?.[0]?.id

  // Fetch metrics
  const { data: instances } = await supabase
    .from("instancia")
    .select("id, nome, status, sync_status")
    .eq("id_workspace", workspaceId || "")

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
    .eq("conversa.instancia.id_workspace", workspaceId || "")

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
    .eq("conversa.instancia.id_workspace", workspaceId || "")

  // Calculate metrics
  const avgScore =
    analyses && analyses.length > 0
      ? (analyses.reduce((sum, a) => sum + (Number(a.score) || 0), 0) / analyses.length).toFixed(1)
      : "0.0"

  const avgResponseTime =
    analyses && analyses.length > 0
      ? Math.round(
          analyses.reduce((sum, a) => {
            // Parse interval format (e.g., "00:05:30" to minutes)
            const time = a.tempo_resposta_medio || "00:00:00"
            const parts = time.toString().split(":")
            return sum + Number.parseInt(parts[0]) * 60 + Number.parseInt(parts[1])
          }, 0) / analyses.length,
        )
      : 0

  const totalFollowups = analyses?.reduce((sum, a) => sum + (a.qtd_followups || 0), 0) || 0

  const totalConversations = analyses?.length || 0

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
            <div className="text-2xl font-bold">{avgResponseTime}min</div>
            <p className="text-xs text-muted-foreground">tempo médio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFollowups}</div>
            <p className="text-xs text-muted-foreground">total de acompanhamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instâncias</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instances?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {instances?.filter((i) => i.status === "conectado").length || 0} ativas
            </p>
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

      <Card>
        <CardHeader>
          <CardTitle>Status das Instâncias</CardTitle>
        </CardHeader>
        <CardContent>
          <InstanceStatus instances={instances || []} />
        </CardContent>
      </Card>
    </div>
  )
}
