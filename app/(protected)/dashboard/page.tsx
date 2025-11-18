import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Users, BarChart3, TrendingUp } from 'lucide-react'

async function getDashboardStats(workspaceId: string) {
  const supabase = await createClient()

  const [conversasResult, clientesResult, analisesResult, conversasRecentes] = await Promise.all([
    supabase.from("conversa").select("id", { count: "exact", head: true }).eq("id_workspace", workspaceId),
    supabase.from("cliente").select("id", { count: "exact", head: true }).eq("id_workspace", workspaceId),
    supabase
      .from("analise")
      .select("score")
      .eq("id_workspace", workspaceId)
      .not("score", "is", null),
    supabase
      .from("conversa")
      .select("*, cliente(nome, telefone), instancia(nome)")
      .eq("id_workspace", workspaceId)
      .order("started_at", { ascending: false })
      .limit(5),
  ])

  const avgScore =
    analisesResult.data && analisesResult.data.length > 0
      ? analisesResult.data.reduce((sum, a) => sum + (a.score || 0), 0) / analisesResult.data.length
      : 0

  return {
    totalConversas: conversasResult.count || 0,
    totalClientes: clientesResult.count || 0,
    totalAnalises: analisesResult.data?.length || 0,
    avgScore: avgScore,
    conversasRecentes: conversasRecentes.data || [],
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: workspaces } = await supabase
    .from("workspace")
    .select("id")
    .eq("id_user", user.id)
    .limit(1)

  if (!workspaces || workspaces.length === 0) {
    redirect("/onboarding/workspace")
  }

  const stats = await getDashboardStats(workspaces[0].id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral das suas análises de vendas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversas}</div>
            <p className="text-xs text-muted-foreground">Conversas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
            <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Análises</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnalises}</div>
            <p className="text-xs text-muted-foreground">Análises realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}/10</div>
            <p className="text-xs text-muted-foreground">Desempenho geral</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversas Recentes</CardTitle>
          <CardDescription>Últimas 5 conversas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.conversasRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma conversa registrada ainda</p>
            ) : (
              stats.conversasRecentes.map((conversa: any) => (
                <div key={conversa.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{conversa.cliente?.nome || "Cliente sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{conversa.instancia?.nome || "Sem instância"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(conversa.started_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
