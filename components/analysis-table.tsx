"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles, Eye, FileText, ExternalLink, Loader2 } from "lucide-react"
import { useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

type Analysis = {
  id: string
  score: number | null
  tempo_resposta_inicial: string
  tempo_resposta_medio: string
  qtd_followups: number
  tonalidade: string
  resumo: string
  created_at: string
  message_count: number
  score_conexao_rapport: number | null
  score_diagnostico_descoberta: number | null
  score_oferta_personalizada: number | null
  score_clareza_didatica: number | null
  score_conducao_fechamento: number | null
  conversa: {
    id: string
    started_at: string
    cliente: { nome: string | null; telefone: string } | null
  } | null
}

type Evaluation = {
  resultado: any
  score_final: number
  modelo_avaliacao: {
    nome: string
    categoria: Array<{
      nome: string
      peso: number
      criterio: Array<{
        titulo: string
        descricao: string
        peso_relativo: number
      }>
    }>
  } | null
}

type AnalysisTableProps = {
  analyses: Analysis[]
  userId: string
}

function safeToLower(value: any): string {
  try {
    if (value === null || value === undefined) return ""
    return String(value).toLowerCase()
  } catch (e) {
    return ""
  }
}

export function AnalysisTable({ analyses, userId }: AnalysisTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [scoreFilter, setScoreFilter] = React.useState("all")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isGeneratingDiagnostic, setIsGeneratingDiagnostic] = useState(false)
  const [diagnosticLinks, setDiagnosticLinks] = useState<{
    pdfUrl?: string
    slidesUrl?: string
  } | null>(null)

  React.useEffect(() => {
    // No changes needed here
  }, [])

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    router.push("/analises")
  }

  const filteredAnalyses = useMemo(() => {
    if (!Array.isArray(analyses)) return []

    return analyses.filter((analysis) => {
      try {
        // Safe score filtering
        if (scoreFilter !== "all") {
          const score = Number(analysis.score) || 0
          if (scoreFilter === "high" && score < 8) return false
          if (scoreFilter === "medium" && (score < 6 || score >= 8)) return false
          if (scoreFilter === "low" && score >= 6) return false
        }

        // Safe search filtering with null checks
        if (searchTerm && searchTerm.trim()) {
          const search = String(searchTerm).toLowerCase()
          const clientName = String(analysis?.conversa?.cliente?.nome || "").toLowerCase()
          const clientPhone = String(analysis?.conversa?.cliente?.telefone || "").toLowerCase()

          return clientName.includes(search) || clientPhone.includes(search)
        }

        return true
      } catch (error) {
        console.error("[v0] Filter error:", error)
        return true
      }
    })
  }, [analyses, searchTerm, scoreFilter])

  const getScoreColor = (score: number | null) => {
    if (score != null && score >= 8) return "text-green-500"
    if (score != null && score >= 6) return "text-yellow-500"
    return "text-red-500"
  }

  const getScoreBadgeVariant = (score: number | null) => {
    if (score != null && score >= 8) return "default"
    if (score != null && score >= 6) return "secondary"
    return "destructive"
  }

  const handleRowClick = (id: string) => {
    router.push(`/analises?id=${id}`)
  }

  const handleGenerateDiagnostic = async () => {
    setIsGeneratingDiagnostic(true)
    try {
      console.log("[v0] Starting diagnostic generation with payload:", {
        workspaceId: "workspaceId", // Assuming workspaceId is defined somewhere, replace with actual value
        userId,
      })

      const response = await fetch(
        "https://enablement-n8n-sales-ops-ai.uyk8ty.easypanel.host/webhook/diagnosticoComercial",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspaceId: "workspaceId", // Assuming workspaceId is defined somewhere, replace with actual value
            userId,
          }),
        },
      )

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)

      if (response.ok) {
        const responseData = await response.json()
        console.log("[v0] Success response data:", responseData)

        // Store the links from the response
        if (responseData.pdfUrl || responseData.slidesUrl) {
          setDiagnosticLinks({
            pdfUrl: responseData.pdfUrl,
            slidesUrl: responseData.slidesUrl,
          })
        }

        toast({
          title: "Diagnóstico comercial gerado",
          description: "Os arquivos estão prontos para download e visualização.",
        })
      } else {
        const errorText = await response.text()
        console.error("[v0] Error response status:", response.status)
        console.error("[v0] Error response text:", errorText)

        try {
          const errorJson = JSON.parse(errorText)
          console.error("[v0] Error response JSON:", errorJson)
        } catch (e) {
          console.error("[v0] Error response is not JSON")
        }

        throw new Error(`Falha ao iniciar diagnóstico (status ${response.status})`)
      }
    } catch (error) {
      console.error("[v0] Error generating diagnostic:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível iniciar a geração do diagnóstico.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingDiagnostic(false)
    }
  }

  const handleExportReport = async () => {
    try {
      setIsGeneratingDiagnostic(true) // Reusing state for simplicity

      const response = await fetch(
        "https://enablement-n8n-sales-ops-ai.uyk8ty.easypanel.host/webhook/diagnosticoComercial",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspaceId: "workspaceId", // Assuming workspaceId is defined somewhere, replace with actual value
            userId,
          }),
        },
      )

      if (!response.ok) {
        throw new Error("Falha ao exportar relatório")
      }

      toast({
        title: "Exportação iniciada",
        description:
          "Os arquivos Google Slides e Docs estão sendo gerados. Você receberá uma notificação quando estiverem prontos.",
      })
    } catch (error) {
      console.error("[v0] Error exporting report:", error)
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível iniciar a exportação do relatório.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingDiagnostic(false)
    }
  }

  const handleViewConversation = (conversationId: string) => {
    router.push(`/conversas?id=${conversationId}`)
  }

  // Prepare radar chart data
  const radarData = React.useMemo(() => {
    // Assuming evaluation is defined somewhere, replace with actual value
    const evaluation = {
      resultado: {},
      score_final: 0,
      modelo_avaliacao: {
        nome: "",
        categoria: [],
      },
    }

    if (!evaluation?.resultado || !evaluation?.modelo_avaliacao?.categoria) {
      return []
    }

    return evaluation.modelo_avaliacao.categoria.map((cat) => ({
      category: cat.nome,
      value: evaluation.resultado[cat.nome] || 0,
      fullMark: 100,
    }))
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Relatórios de Análise</h2>
        <div className="flex gap-2">
          <Button onClick={handleGenerateDiagnostic} disabled={isGeneratingDiagnostic} variant="outline">
            {isGeneratingDiagnostic ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Diagnóstico Comercial
              </>
            )}
          </Button>
        </div>
      </div>

      {diagnosticLinks && (diagnosticLinks.pdfUrl || diagnosticLinks.slidesUrl) && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Arquivos Gerados</h3>
          <div className="flex gap-3">
            {diagnosticLinks.pdfUrl && (
              <Button asChild variant="outline" size="sm">
                <a href={diagnosticLinks.pdfUrl} download target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  Baixar PDF
                </a>
              </Button>
            )}
            {diagnosticLinks.slidesUrl && (
              <Button asChild variant="outline" size="sm">
                <a href={diagnosticLinks.slidesUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Acessar Google Slides
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {filteredAnalyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {searchTerm || scoreFilter !== "all" ? "Nenhuma análise encontrada" : "Nenhuma análise disponível"}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Mensagens</TableHead>
              <TableHead>Tempo Resposta</TableHead>
              <TableHead>Follow-ups</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAnalyses.map((analysis) => (
              <TableRow key={analysis.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  {analysis.conversa?.cliente?.nome || analysis.conversa?.cliente?.telefone || "Cliente"}
                </TableCell>
                <TableCell>{format(new Date(analysis.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                <TableCell>
                  {analysis.score != null ? (
                    <Badge variant={getScoreBadgeVariant(analysis.score) as any} className={cn("font-bold")}>
                      {analysis.score.toFixed(1)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">N/A</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{analysis.message_count}</Badge>
                </TableCell>
                <TableCell>{analysis.tempo_resposta_medio}</TableCell>
                <TableCell>{analysis.qtd_followups}</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => handleRowClick(analysis.id)} className="h-8 px-2">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
