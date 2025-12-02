"use client"

import * as React from "react"
import { Download, Calendar, TrendingUp, MessageSquare, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Diagnosis {
  id: string
  data_geracao: string
  score_medio: number
  volume_mensagens: number
  url_download: string | null
  status: string
}

interface DiagnosisHistoryWithFilterProps {
  diagnoses: Diagnosis[]
}

export function DiagnosisHistoryWithFilter({ diagnoses }: DiagnosisHistoryWithFilterProps) {
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")

  const filteredDiagnoses = React.useMemo(() => {
    if (!startDate && !endDate) return diagnoses

    return diagnoses.filter((diagnosis) => {
      const diagnosisDate = new Date(diagnosis.data_geracao)
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null

      if (start && end) {
        // Set end date to end of day for inclusive filtering
        end.setHours(23, 59, 59, 999)
        return diagnosisDate >= start && diagnosisDate <= end
      }

      if (start) {
        return diagnosisDate >= start
      }

      if (end) {
        // Set end date to end of day for inclusive filtering
        end.setHours(23, 59, 59, 999)
        return diagnosisDate <= end
      }

      return true
    })
  }, [diagnoses, startDate, endDate])

  const handleDownload = async (diagnosisId: string, url: string | null) => {
    if (!url) {
      alert("Download não disponível ainda. O diagnóstico pode estar sendo processado.")
      return
    }

    window.open(url, "_blank")
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
  }

  const hasActiveFilters = startDate || endDate

  return (
    <div className="space-y-6">
      {/* Date Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrar por Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
              />
            </div>

            <div className="flex-1 space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>

            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <p className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredDiagnoses.length} de {diagnoses.length} diagnóstico(s)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Diagnoses List Card */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Diagnósticos Gerados</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDiagnoses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "Nenhum diagnóstico encontrado no período selecionado."
                : "Nenhum diagnóstico gerado ainda. Use o Dashboard para gerar seu primeiro diagnóstico."}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredDiagnoses.map((diagnosis) => (
                <div
                  key={diagnosis.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-medium text-foreground">
                          {new Date(diagnosis.data_geracao).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="text-xs">
                          {formatDistanceToNow(new Date(diagnosis.data_geracao), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Score: {diagnosis.score_medio.toFixed(1)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{diagnosis.volume_mensagens} conversas</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(diagnosis.id, diagnosis.url_download)}
                    disabled={!diagnosis.url_download}
                    className="w-full md:w-auto"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {diagnosis.url_download ? "Download" : "Processando..."}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
