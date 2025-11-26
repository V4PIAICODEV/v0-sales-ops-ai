"use client"

import * as React from "react"
import { Download, Calendar, TrendingUp, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

interface DiagnosisHistoryProps {
  workspaceId?: string
  diagnoses?: Diagnosis[]
  fullPage?: boolean
}

export function DiagnosisHistory({
  workspaceId,
  diagnoses: initialDiagnoses,
  fullPage = false,
}: DiagnosisHistoryProps) {
  const [diagnoses, setDiagnoses] = React.useState<Diagnosis[]>(initialDiagnoses || [])
  const [isLoading, setIsLoading] = React.useState(!initialDiagnoses && !!workspaceId)

  const fetchDiagnoses = React.useCallback(async () => {
    if (!workspaceId) return

    try {
      const response = await fetch(`/api/diagnoses?workspace_id=${workspaceId}`)
      if (!response.ok) throw new Error("Failed to fetch diagnoses")
      const data = await response.json()
      setDiagnoses(data)
    } catch (error) {
      console.error("[v0] Error fetching diagnoses:", error)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  React.useEffect(() => {
    if (!initialDiagnoses && workspaceId) {
      fetchDiagnoses()
    }
  }, [fetchDiagnoses, initialDiagnoses, workspaceId])

  const handleDownload = async (diagnosisId: string, url: string | null) => {
    if (!url) {
      alert("Download não disponível para este diagnóstico")
      return
    }

    window.open(url, "_blank")
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Diagnósticos Gerados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando histórico...</p>
        </CardContent>
      </Card>
    )
  }

  if (diagnoses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Diagnósticos Gerados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum diagnóstico gerado ainda.{" "}
            {fullPage
              ? "Use o Dashboard para gerar seu primeiro diagnóstico."
              : "Clique no botão acima para gerar seu primeiro diagnóstico."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Diagnósticos Gerados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {diagnoses.map((diagnosis) => (
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
                Download
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
