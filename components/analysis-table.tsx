"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Search, TrendingUp, Clock, MessageCircle, Smile } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type Analysis = {
  id: string
  score: number | null
  tempo_resposta_inicial: string
  tempo_resposta_medio: string
  qtd_followups: number
  tonalidade: string
  resumo: string
  created_at: string
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

export function AnalysisTable({
  analyses,
  selectedId,
  selectedAnalysis,
  evaluation,
}: {
  analyses: Analysis[]
  selectedId?: string
  selectedAnalysis: Analysis | null
  evaluation: Evaluation | null
}) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [scoreFilter, setScoreFilter] = React.useState("all")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  React.useEffect(() => {
    if (selectedId && selectedAnalysis) {
      setIsDialogOpen(true)
    }
  }, [selectedId, selectedAnalysis])

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    router.push("/analises")
  }

  const filteredAnalyses = analyses.filter((analysis) => {
    const clientName = analysis.conversa?.cliente?.nome || analysis.conversa?.cliente?.telefone || ""
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesScore =
      scoreFilter === "all" ||
      (scoreFilter === "high" && analysis.score != null && analysis.score >= 8) ||
      (scoreFilter === "medium" && analysis.score != null && analysis.score >= 6 && analysis.score < 8) ||
      (scoreFilter === "low" && analysis.score != null && analysis.score < 6)

    return matchesSearch && matchesScore
  })

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

  // Prepare radar chart data
  const radarData = React.useMemo(() => {
    if (!evaluation?.resultado || !evaluation?.modelo_avaliacao?.categoria) {
      return []
    }

    return evaluation.modelo_avaliacao.categoria.map((cat) => ({
      category: cat.nome,
      value: evaluation.resultado[cat.nome] || 0,
      fullMark: 100,
    }))
  }, [evaluation])

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Relatórios de Análise</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full md:w-[200px]"
                />
              </div>
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Filtrar score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="high">Alto (8+)</SelectItem>
                  <SelectItem value="medium">Médio (6-8)</SelectItem>
                  <SelectItem value="low">Baixo (&lt;6)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAnalyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma análise encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Tonalidade</TableHead>
                  <TableHead>Tempo Resposta</TableHead>
                  <TableHead>Follow-ups</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnalyses.map((analysis) => (
                  <TableRow
                    key={analysis.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(analysis.id)}
                  >
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
                    <TableCell>{analysis.tonalidade}</TableCell>
                    <TableCell>{analysis.tempo_resposta_medio}</TableCell>
                    <TableCell>{analysis.qtd_followups}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Analysis Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Análise</DialogTitle>
          </DialogHeader>

          {selectedAnalysis && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Score Final</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={cn(
                        "text-2xl font-bold",
                        selectedAnalysis.score != null
                          ? getScoreColor(selectedAnalysis.score)
                          : "text-muted-foreground",
                      )}
                    >
                      {selectedAnalysis.score != null ? selectedAnalysis.score.toFixed(1) : "N/A"}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tempo Resposta</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedAnalysis.tempo_resposta_medio}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedAnalysis.qtd_followups}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tonalidade</CardTitle>
                    <Smile className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedAnalysis.tonalidade}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Radar Chart */}
              {radarData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Avaliação por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        value: {
                          label: "Pontuação",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis
                            dataKey="category"
                            tick={{
                              fill: "hsl(var(--foreground))",
                              fontSize: 12,
                            }}
                          />
                          <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{
                              fill: "hsl(var(--muted-foreground))",
                              fontSize: 10,
                            }}
                          />
                          <Radar
                            name="Pontuação"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.6}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo da Análise</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selectedAnalysis.resumo}</p>
                </CardContent>
              </Card>

              {/* Criteria Details */}
              {evaluation?.modelo_avaliacao?.categoria && (
                <Card>
                  <CardHeader>
                    <CardTitle>Critérios Avaliados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {evaluation.modelo_avaliacao.categoria.map((cat) => (
                        <div key={cat.nome} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{cat.nome}</h4>
                            <Badge variant="outline">Peso: {(cat.peso * 100).toFixed(0)}%</Badge>
                          </div>
                          <div className="pl-4 space-y-2">
                            {cat.criterio.map((crit, idx) => (
                              <div key={idx} className="text-sm border-l-2 border-muted pl-3">
                                <p className="font-medium">{crit.titulo}</p>
                                <p className="text-muted-foreground text-xs">{crit.descricao}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
