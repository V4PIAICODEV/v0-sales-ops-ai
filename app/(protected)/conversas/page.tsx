import { createClient } from "@/lib/supabase/server"
import { ConversationsList } from "@/components/conversations-list"
import { redirect } from "next/navigation"
import { getCurrentWorkspaceId } from "@/lib/workspace"

export default async function ConversasPage({
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
  const selectedConversationId = params.id

  const workspaceId = await getCurrentWorkspaceId()

  if (!workspaceId) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversas</h1>
          <p className="text-muted-foreground">Crie um workspace para começar</p>
        </div>
      </div>
    )
  }

  const { data: instances } = await supabase
    .from("instancia")
    .select("id, nome, token_evolution, status")
    .eq("id_workspace", workspaceId)
    .eq("status", "open")

  // Fetch conversations with related data
  const { data: conversations } = await supabase
    .from("conversa")
    .select(
      `
      id,
      started_at,
      ended_at,
      cliente:cliente(nome, telefone, device),
      instancia:instancia!inner(id_workspace),
      analise:analise(score, resumo, tonalidade, tempo_resposta_inicial),
      mensagem(id)
    `,
    )
    .eq("instancia.id_workspace", workspaceId)
    .not("started_at", "is", null)
    .order("started_at", { ascending: false })

  const conversationsWithMessageCount = conversations?.map((conv) => {
    const messageCount = conv.mensagem && Array.isArray(conv.mensagem) ? conv.mensagem.length : 0
    const { mensagem, ...rest } = conv
    return {
      ...rest,
      message_count: messageCount,
    }
  })

  // Filter conversations that have at least one message
  const filteredConversations = conversationsWithMessageCount?.filter((conv) => conv.message_count > 0)

  // Fetch messages for selected conversation
  let messages = null
  let selectedConversation = null
  let analysis = null

  if (selectedConversationId) {
    selectedConversation = filteredConversations?.find((c) => c.id === selectedConversationId)

    const { data: messagesData } = await supabase
      .from("mensagem")
      .select("*")
      .eq("id_conversa", selectedConversationId)
      .order("timestamp", { ascending: true })

    messages = messagesData

    const { data: analysisData } = await supabase
      .from("analise")
      .select("score, resumo, tonalidade, qtd_followups, tempo_resposta_inicial, tempo_resposta_medio")
      .eq("id_conversa", selectedConversationId)
      .maybeSingle()

    analysis = analysisData
  }

  return (
    <div className="flex h-screen">
      <ConversationsList
        conversations={filteredConversations || []}
        selectedId={selectedConversationId}
        messages={messages}
        selectedConversation={selectedConversation}
        analysis={analysis}
        workspaceId={workspaceId}
        instances={instances || []}
      />
    </div>
  )
}
