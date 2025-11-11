import { createClient } from "@/lib/supabase/server"
import { ConversationsList } from "@/components/conversations-list"
import { redirect } from "next/navigation"

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

  // Get current workspace
  const { data: workspaces } = await supabase.from("workspace").select("id").eq("id_user", user.id).limit(1)

  const workspaceId = workspaces?.[0]?.id

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

  // Fetch conversations with related data
  const { data: conversations } = await supabase
    .from("conversa")
    .select(
      `
      id,
      started_at,
      ended_at,
      cliente:cliente(nome, telefone),
      instancia:instancia!inner(id_workspace),
      analise:analise(score, resumo, tonalidade),
      mensagem(id)
    `,
    )
    .eq("instancia.id_workspace", workspaceId)
    .not("started_at", "is", null)
    .order("started_at", { ascending: false })

  // Filter conversations that have at least one message
  const filteredConversations = conversations?.filter(
    (conv) => conv.mensagem && Array.isArray(conv.mensagem) && conv.mensagem.length > 0,
  )

  // Remove the mensagem field from the response as it was only used for filtering
  const cleanedConversations = filteredConversations?.map(({ mensagem, ...rest }) => rest)

  // Fetch messages for selected conversation
  let messages = null
  let selectedConversation = null
  let analysis = null

  if (selectedConversationId) {
    selectedConversation = cleanedConversations?.find((c) => c.id === selectedConversationId)

    const { data: messagesData } = await supabase
      .from("mensagem")
      .select("*")
      .eq("id_conversa", selectedConversationId)
      .order("timestamp", { ascending: true })

    messages = messagesData

    const { data: analysisData } = await supabase
      .from("analise")
      .select("*")
      .eq("id_conversa", selectedConversationId)
      .single()

    analysis = analysisData
  }

  return (
    <div className="flex h-screen">
      <ConversationsList
        conversations={cleanedConversations || []}
        selectedId={selectedConversationId}
        messages={messages}
        selectedConversation={selectedConversation}
        analysis={analysis}
      />
    </div>
  )
}
