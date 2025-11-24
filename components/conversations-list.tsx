"use client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { MessageSquare, User, Bot, Smartphone, Search, MessageCircle, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import * as React from "react"

type Conversation = {
  id: string
  started_at: string
  ended_at: string | null
  cliente: { nome: string | null; telefone: string; device?: string | null } | null
  analise: { score: number; resumo: string; tonalidade: string }[] | null
  message_count?: number // Added message_count field
}

type Message = {
  id: string
  autor: "vendedor" | "cliente"
  conteudo: string
  timestamp: string
}

type Analysis = {
  score: number
  tempo_resposta_inicial: string
  tempo_resposta_medio: string
  qtd_followups: number
  tonalidade: string
  resumo: string
}

function safeFormatDate(
  dateValue: string | null | undefined,
  formatString: string,
  fallback = "Data inválida",
): string {
  if (!dateValue) return fallback

  try {
    let date: Date

    // Check if it's a Unix timestamp (numeric string with 10 digits)
    if (/^\d{10}$/.test(dateValue)) {
      // Convert Unix timestamp (seconds) to milliseconds
      date = new Date(Number.parseInt(dateValue) * 1000)
    } else {
      // Try to parse as regular date string
      date = new Date(dateValue)
    }

    // Check if date is valid
    if (isNaN(date.getTime())) return fallback

    return format(date, formatString, { locale: ptBR })
  } catch (error) {
    console.error("[v0] Error formatting date:", error, "Value:", dateValue)
    return fallback
  }
}

function safeToLower(value: any): string {
  try {
    if (value === null || value === undefined) return ""
    return String(value).toLowerCase()
  } catch (e) {
    return ""
  }
}

export function ConversationsList({
  conversations,
  selectedId,
  messages,
  selectedConversation,
  analysis,
}: {
  conversations: Conversation[]
  selectedId?: string
  messages: Message[] | null
  selectedConversation: Conversation | null
  analysis: Analysis | null
}) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = React.useState("")

  const handleSelectConversation = (id: string) => {
    router.push(`/conversas?id=${id}`)
  }

  const safeConversations = Array.isArray(conversations) ? conversations : []

  const filteredConversations = safeConversations.filter((conversation) => {
    if (!conversation) return false

    try {
      const cliente = conversation.cliente
      const clientName = safeToLower(cliente?.nome)
      const clientPhone = safeToLower(cliente?.telefone)
      const search = safeToLower(searchTerm)

      return clientName.includes(search) || clientPhone.includes(search)
    } catch (error) {
      console.error("[v0] Error filtering conversation:", error)
      return false
    }
  })

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500"
    if (score >= 6) return "text-yellow-500"
    return "text-red-500"
  }

  const getDeviceBadge = (device: string | null | undefined) => {
    try {
      const deviceStr = String(device || "")
      if (deviceStr.length === 0) return null

      const deviceLower = safeToLower(deviceStr)

      if (deviceLower.includes("ios") || deviceLower.includes("iphone")) {
        return { label: "iOS", variant: "default" as const }
      }
      if (deviceLower.includes("android")) {
        return { label: "Android", variant: "secondary" as const }
      }
      return { label: deviceStr, variant: "outline" as const }
    } catch (error) {
      console.error("[v0] Error processing device badge:", error, "device:", device)
      return null
    }
  }

  return (
    <div className="flex w-full">
      {/* Conversations List */}
      <div className="w-80 border-r">
        <div className="p-4 border-b space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Conversas</h2>
            <p className="text-sm text-muted-foreground">{filteredConversations.length} conversas</p>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="p-2 space-y-2">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "Nenhuma conversa encontrada" : "Nenhuma conversa disponível"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const score = conversation.analise?.[0]?.score || 0
                const messageCount = conversation.message_count || 0 // Use message_count instead of quantidade_mensagens
                const clientName = conversation.cliente?.nome || conversation.cliente?.telefone || "Cliente"
                const deviceBadge = getDeviceBadge(conversation.cliente?.device)

                return (
                  <Card
                    key={conversation.id}
                    className={cn(
                      "p-3 cursor-pointer hover:bg-accent transition-colors",
                      selectedId === conversation.id && "bg-accent",
                    )}
                    onClick={() => handleSelectConversation(conversation.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {safeFormatDate(conversation.started_at, "dd/MM/yyyy HH:mm", "Data não disponível")}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {messageCount > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageCircle className="h-3 w-3" />
                              <span>{messageCount}</span>
                            </div>
                          )}
                          {score > 0 && (
                            <div className={cn("flex items-center gap-1 text-xs font-semibold", getScoreColor(score))}>
                              <Star className="h-3 w-3" />
                              <span>{score.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {deviceBadge && (
                          <Badge variant={deviceBadge.variant} className="text-xs">
                            <Smartphone className="h-3 w-3 mr-1" />
                            {deviceBadge.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Viewer */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && messages ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {selectedConversation.cliente?.nome || selectedConversation.cliente?.telefone || "Cliente"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{selectedConversation.cliente?.telefone}</p>
                    {selectedConversation.cliente?.device && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Smartphone className="h-3 w-3" />
                          {selectedConversation.cliente.device}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {analysis && (
                  <Badge variant="outline" className={cn("text-lg font-bold", getScoreColor(analysis.score))}>
                    Score: {analysis.score.toFixed(1)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex gap-3", message.autor === "vendedor" && "flex-row-reverse")}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.autor === "vendedor" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn("flex flex-col gap-1 max-w-[70%]", message.autor === "vendedor" && "items-end")}>
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2",
                          message.autor === "vendedor" ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        <p className="text-sm">{message.conteudo}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {safeFormatDate(message.timestamp, "HH:mm", "--:--")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Analysis Panel */}
            {analysis && (
              <div className="p-4 border-t bg-muted/50">
                <h3 className="font-semibold mb-2">Análise da IA</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tonalidade</p>
                      <p className="font-medium">{analysis.tonalidade}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Resposta Inicial</p>
                      <p className="font-medium">{analysis.tempo_resposta_inicial || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Resposta Média</p>
                      <p className="font-medium">{analysis.tempo_resposta_medio || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Follow-ups</p>
                      <p className="font-medium">{analysis.qtd_followups}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Resumo</p>
                    <p className="text-sm mt-1">{analysis.resumo}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Selecione uma conversa para visualizar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
