"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, CheckCircle2, Download } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DashboardDiagnosisButtonProps {
  workspaceId: string
  onDiagnosisGenerated?: () => void
}

export function DashboardDiagnosisButton({ workspaceId, onDiagnosisGenerated }: DashboardDiagnosisButtonProps) {
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [showModal, setShowModal] = React.useState(false)
  const [diagnosisId, setDiagnosisId] = React.useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null)
  const [pollingError, setPollingError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!diagnosisId || downloadUrl) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/diagnoses/${diagnosisId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch diagnosis status")
        }

        const data = await response.json()

        if (data.url_download) {
          setDownloadUrl(data.url_download)
          setIsGenerating(false)
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error("[v0] Error polling diagnosis:", error)
        setPollingError(error instanceof Error ? error.message : "Erro ao verificar status")
        clearInterval(pollInterval)
        setIsGenerating(false)
      }
    }, 2000) // Poll every 2 seconds

    // Timeout after 2 minutes
    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
      setPollingError("Tempo limite excedido. O diagnóstico pode estar processando ainda.")
      setIsGenerating(false)
    }, 120000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [diagnosisId, downloadUrl])

  const handleGenerateDiagnosis = async () => {
    setIsGenerating(true)
    setShowModal(true)
    setDiagnosisId(null)
    setDownloadUrl(null)
    setPollingError(null)

    try {
      const analysesResponse = await fetch(`/api/analyses?workspace_id=${workspaceId}`)
      if (!analysesResponse.ok) {
        throw new Error("Failed to fetch analyses")
      }
      const analyses = await analysesResponse.json()

      if (analyses.length === 0) {
        setPollingError("Não há análises disponíveis para gerar o diagnóstico.")
        setIsGenerating(false)
        return
      }

      const response = await fetch("/api/generate-diagnosis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analyses,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate diagnosis")
      }

      const data = await response.json()
      console.log("[v0] Diagnosis created:", data)

      if (data.diagnosis_id) {
        setDiagnosisId(data.diagnosis_id)
      } else if (data.url_download) {
        // If URL is already available
        setDownloadUrl(data.url_download)
        setIsGenerating(false)
      }

      if (onDiagnosisGenerated) {
        onDiagnosisGenerated()
      }
    } catch (error) {
      console.error("[v0] Error generating diagnosis:", error)
      setPollingError(error instanceof Error ? error.message : "Erro ao gerar diagnóstico")
      setIsGenerating(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setDiagnosisId(null)
    setDownloadUrl(null)
    setPollingError(null)
  }

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank")
      handleCloseModal()
    }
  }

  return (
    <>
      <Button onClick={handleGenerateDiagnosis} disabled={isGenerating} size="lg" className="w-full md:w-auto">
        <Sparkles className="mr-2 h-4 w-4" />
        Gerar diagnóstico comercial
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pollingError ? "Erro" : downloadUrl ? "Diagnóstico Pronto!" : "Gerando Diagnóstico Comercial"}
            </DialogTitle>
            <DialogDescription>
              {pollingError
                ? pollingError
                : downloadUrl
                  ? "Seu diagnóstico foi gerado com sucesso e está pronto para download."
                  : "Aguarde enquanto processamos suas análises e geramos o relatório completo..."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            {pollingError ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">Verifique a aba de Diagnósticos em alguns minutos.</p>
                <Button onClick={handleCloseModal} variant="outline">
                  Fechar
                </Button>
              </div>
            ) : downloadUrl ? (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <Button onClick={handleDownload} size="lg" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Diagnóstico
                </Button>
                <Button onClick={handleCloseModal} variant="ghost" className="mt-2">
                  Fechar
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground text-center">Isso pode levar alguns minutos...</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
