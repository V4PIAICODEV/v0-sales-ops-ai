"use client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { MessageSquare, User, Bot, Smartphone, Search, MessageCircle, Star, Filter, X, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import * as React from "react"
import { useToast } from "@/hooks/use-toast"

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

type Instance = {
  id: string
  nome: string
  token_evolution: string
  status?: string
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
  workspaceId,
  instances,
}: {
  conversations: Conversation[]
  selectedId?: string
  messages: Message[] | null
  selectedConversation: Conversation | null
  analysis: Analysis | null
  workspaceId: string
  instances: Instance[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isExtracting, setIsExtracting] = React.useState(false)

  const [scoreMin, setScoreMin] = React.useState<number>(0)
  const [scoreMax, setScoreMax] = React.useState<number>(10)
  const [messageMin, setMessageMin] = React.useState<number>(0)
  const [messageMax, setMessageMax] = React.useState<number>(1000)
  const [filtersActive, setFiltersActive] = React.useState(false)

  const handleSelectConversation = (id: string) => {
    router.push(`/conversas?id=${id}`)
  }

  const hasActiveFilters = React.useMemo(() => {
    return scoreMin > 0 || scoreMax < 10 || messageMin > 0 || messageMax < 1000
  }, [scoreMin, scoreMax, messageMin, messageMax])

  const resetFilters = () => {
    setScoreMin(0)
    setScoreMax(10)
    setMessageMin(0)
    setMessageMax(1000)
    setFiltersActive(false)
  }

  const safeConversations = Array.isArray(conversations) ? conversations : []

  const filteredConversations = safeConversations.filter((conversation) => {
    if (!conversation) return false

    try {
      const cliente = conversation.cliente
      const clientName = safeToLower(cliente?.nome)
      const clientPhone = safeToLower(cliente?.telefone)
      const search = safeToLower(searchTerm)

      // Text search filter
      const matchesSearch = clientName.includes(search) || clientPhone.includes(search)

      // Score filter
      const score = conversation.analise?.[0]?.score || 0
      const matchesScore = score >= scoreMin && score <= scoreMax

      // Message volume filter
      const messageCount = conversation.message_count || 0
      const matchesMessageVolume = messageCount >= messageMin && messageCount <= messageMax

      return matchesSearch && matchesScore && matchesMessageVolume
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

  const handleExtractConversations = async () => {
    if (instances.length === 0) {
      toast({
        title: "Nenhuma instância conectada",
        description: "Conecte uma instância do WhatsApp primeiro.",
        variant: "destructive",
      })
      return
    }

    setIsExtracting(true)

    try {
      const response = await fetch("/api/extract-conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          instances: instances.map((inst) => ({
            id: inst.id,
            nome: inst.nome,
            token_evolution: inst.token_evolution,
            status: inst.status,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao extrair conversas")
      }

      toast({
        title: "Extração iniciada",
        description: "As conversas estão sendo extraídas. Isso pode levar alguns minutos.",
      })

      // Refresh page after 2 seconds
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error("[v0] Error extracting conversations:", error)
      toast({
        title: "Erro ao extrair conversas",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div className="flex w-full">
      {/* Conversations List */}
      <div className="w-80 border-r">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Conversas</h2>
              <p className="text-sm text-muted-foreground">{filteredConversations.length} conversas</p>
            </div>
            <Button
              onClick={handleExtractConversations}
              disabled={isExtracting || instances.length === 0}
              size="sm"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExtracting ? "Extraindo..." : "Extrair"}
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant={hasActiveFilters ? "default" : "outline"} size="icon" className="relative">
                  <Filter className="h-4 w-4" />
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Filtros</h4>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={resetFilters}>
                        Limpar
                      </Button>
                    )}
                  </div>

                  {/* Score filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Faixa de Score</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label htmlFor="score-min" className="text-xs text-muted-foreground">
                          Mínimo
                        </Label>
                        <Input
                          id="score-min"
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={scoreMin}
                          onChange={(e) => setScoreMin(Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <span className="text-muted-foreground mt-5">-</span>
                      <div className="flex-1">
                        <Label htmlFor="score-max" className="text-xs text-muted-foreground">
                          Máximo
                        </Label>
                        <Input
                          id="score-max"
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={scoreMax}
                          onChange={(e) => setScoreMax(Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message volume filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Volume de Mensagens</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label htmlFor="msg-min" className="text-xs text-muted-foreground">
                          Mínimo
                        </Label>
                        <Input
                          id="msg-min"
                          type="number"
                          min={0}
                          value={messageMin}
                          onChange={(e) => setMessageMin(Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <span className="text-muted-foreground mt-5">-</span>
                      <div className="flex-1">
                        <Label htmlFor="msg-max" className="text-xs text-muted-foreground">
                          Máximo
                        </Label>
                        <Input
                          id="msg-max"
                          type="number"
                          min={0}
                          value={messageMax}
                          onChange={(e) => setMessageMax(Number(e.target.value))}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {(scoreMin > 0 || scoreMax < 10) && (
                <Badge variant="secondary" className="gap-1">
                  Score: {scoreMin.toFixed(1)} - {scoreMax.toFixed(1)}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      setScoreMin(0)
                      setScoreMax(10)
                    }}
                  />
                </Badge>
              )}
              {(messageMin > 0 || messageMax < 1000) && (
                <Badge variant="secondary" className="gap-1">
                  Msgs: {messageMin} - {messageMax}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      setMessageMin(0)
                      setMessageMax(1000)
                    }}
                  />
                </Badge>
              )}
            </div>
          )}
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
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{clientName}</p>
                          {deviceBadge && (
                            <Badge variant={deviceBadge.variant} className="text-xs shrink-0">
                              <Smartphone className="h-3 w-3 mr-1" />
                              {deviceBadge.label}
                            </Badge>
                          )}
                        </div>
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
