import { createClient } from "@/lib/supabase/server"
import { AnalysisTable } from "@/components/analysis-table"
import { redirect } from 'next/navigation'

export default async function AnalisesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const params = await searchParams
  const selectedAnalysisId = params.id

  // Get current workspace
  const { data: workspaces } = await supabase.from("workspace").select("id").eq("id_user", user.id).limit(1)

  const workspaceId = workspaces?.[0]?.id

  if (!workspaceId) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análises</h1>
          <p className="text-muted-foreground">Crie um workspace para começar</p>
        </div>
      </div>
    )
  }

  // Fetch analyses with related data
  const { data: analyses } = await supabase
    .from("analise")
    .select(
      `
      id,
      score,
      tempo_resposta_inicial,
      tempo_resposta_medio,
      qtd_followups,
      tonalidade,
      resumo,
      created_at,
      id_conversa,
      conversa:conversa(
        id,
        started_at,
        cliente:cliente(nome, telefone),
        instancia:instancia!inner(id_workspace)
      )
    `,
    )
    .eq("conversa.instancia.id_workspace", workspaceId)
    .order("created_at", { ascending: false })

  const analysesWithMessageCount = await Promise.all(
    (analyses || []).map(async (analysis) => {
      const { count } = await supabase
        .from("mensagem")
        .select("*", { count: "exact", head: true })
        .eq("id_conversa", analysis.id_conversa)

      return {
        ...analysis,
        message_count: count || 0,
      }
    })
  )

  // Fetch detailed analysis if selected
  let selectedAnalysis = null
  let evaluation = null

  if (selectedAnalysisId) {
    selectedAnalysis = analysesWithMessageCount?.find((a) => a.id === selectedAnalysisId)

    const { data: evaluationData } = await supabase
      .from("avaliacao")
      .select(
        `
        *,
        modelo_avaliacao:modelo_avaliacao(
          nome,
          categoria:categoria(
            nome,
            peso,
            criterio:criterio(titulo, descricao, peso_relativo)
          )
        )
      `,
      )
      .eq("id_analise", selectedAnalysisId)
      .single()

    evaluation = evaluationData
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Análises</h1>
        <p className="text-muted-foreground">Relatórios detalhados das conversas analisadas</p>
      </div>

      <AnalysisTable
        analyses={analysesWithMessageCount || []}
        selectedId={selectedAnalysisId}
        selectedAnalysis={selectedAnalysis}
        evaluation={evaluation}
      />
    </div>
  )
}
