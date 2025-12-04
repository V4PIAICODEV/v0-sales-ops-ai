import { createClient } from "@/lib/supabase/server"
import { AnalysisTable } from "@/components/analysis-table"
import { redirect } from "next/navigation"
import { getCurrentWorkspaceId } from "@/lib/workspace"

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

  const workspaceId = await getCurrentWorkspaceId()

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
      quantidade_mensagens,
      score_conexao_rapport,
      score_diagnostico_descoberta,
      score_oferta_personalizada,
      score_clareza_didatica,
      score_conducao_fechamento,
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
      if (analysis.quantidade_mensagens != null) {
        return {
          ...analysis,
          message_count: analysis.quantidade_mensagens,
        }
      }

      const { count } = await supabase
        .from("mensagem")
        .select("*", { count: "exact", head: true })
        .eq("id_conversa", analysis.id_conversa)

      return {
        ...analysis,
        message_count: count || 0,
      }
    }),
  )

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
      .maybeSingle()

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
        workspaceId={workspaceId}
        userId={user.id}
      />
    </div>
  )
}
