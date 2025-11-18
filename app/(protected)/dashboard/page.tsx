import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, TrendingUp, MessageCircle, Activity } from 'lucide-react'
import { MetricsRadarChart } from "@/components/metrics-radar-chart"
import { InstanceStatus } from "@/components/instance-status"
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
  const { data: instances } = await supabase
    .from("instancia")
    .select("id, nome, status, sync_status")
    .eq("id_workspace", workspaceId)

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

  // Calculate average response time by analyzing message sequences
  let totalResponseTime = 0
  let responseCount = 0

  if (conversations && conversations.length > 0) {
    for (const conv of conversations) {
      const messages = conv.mensagem || []
      
      for (let i = 0; i < messages.length - 1; i++) {
        const currentMsg = messages[i]
        const nextMsg = messages[i + 1]
        
        // If current message is from client and next is from seller
        if (currentMsg.autor === 'cliente' && nextMsg.autor === 'vendedor') {
          const clientTime = new Date(currentMsg.timestamp).getTime()
          const sellerTime = new Date(nextMsg.timestamp).getTime()
          const diffMinutes = (sellerTime - clientTime) / 1000 / 60
          
          if (diffMinutes > 0 && diffMinutes < 1440) { // Ignore responses > 24 hours
            totalResponseTime += diffMinutes
            responseCount++
          }
        }
      }
    }
  }

  const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0

  // Calculate metrics
  const avgScore =
    analyses && analyses.length > 0
      ? (analyses.reduce((sum, a) => sum + (Number(a.score) || 0), 0) / analyses.length).toFixed(1)
      : "0.0"

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
