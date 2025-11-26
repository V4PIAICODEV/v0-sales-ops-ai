"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface DashboardDiagnosisButtonProps {
  workspaceId: string
  onDiagnosisGenerated?: () => void
}

export function DashboardDiagnosisButton({ workspaceId, onDiagnosisGenerated }: DashboardDiagnosisButtonProps) {
  const [isGenerating, setIsGenerating] = React.useState(false)

  const handleGenerateDiagnosis = async () => {
    setIsGenerating(true)
    try {
      const analysesResponse = await fetch(`/api/analyses?workspace_id=${workspaceId}`)
      if (!analysesResponse.ok) {
        throw new Error("Failed to fetch analyses")
      }
      const analyses = await analysesResponse.json()

      if (analyses.length === 0) {
        alert("Não há análises disponíveis para gerar o diagnóstico.")
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
      console.log("[v0] Diagnosis generated:", data)

      alert("Diagnóstico comercial gerado com sucesso!")

      if (onDiagnosisGenerated) {
        onDiagnosisGenerated()
      }
    } catch (error) {
      console.error("[v0] Error generating diagnosis:", error)
      alert(`Erro ao gerar diagnóstico: ${error instanceof Error ? error.message : "Tente novamente."}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={handleGenerateDiagnosis} disabled={isGenerating} size="lg" className="w-full md:w-auto">
      <Sparkles className="mr-2 h-4 w-4" />
      {isGenerating ? "Gerando diagnóstico..." : "Gerar diagnóstico comercial"}
    </Button>
  )
}
