"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

export default function InstanceOnboardingPage() {
  const [instanceName, setInstanceName] = useState("")
  const [syncMode, setSyncMode] = useState<"historico" | "novas">("novas")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [isGeneratingQr, setIsGeneratingQr] = useState(false)
  const [workspaceName, setWorkspaceName] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    const fetchWorkspace = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: workspace } = await supabase.from("workspace").select("nome").eq("id_user", user.id).single()

      if (workspace) {
        setWorkspaceName(workspace.nome)
      }
    }

    fetchWorkspace()
  }, [])

  const handleGenerateQrCode = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!instanceName.trim()) {
      setError("Por favor, preencha o nome da instância")
      return
    }

    setIsGeneratingQr(true)
    setError(null)

    try {
      const response = await fetch("/api/qrcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome_instancia: instanceName,
          sync_full_history: syncMode === "historico",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao gerar QR Code")
      }

      const data = await response.json()

      if (data.qrCode) {
        setQrCodeUrl(data.qrCode)
      } else {
        throw new Error("Nenhum QR Code retornado")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao gerar QR Code. Tente novamente.")
    } finally {
      setIsGeneratingQr(false)
    }
  }

  const handleCreateInstance = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { data: workspace } = await supabase.from("workspace").select("id").eq("id_user", user.id).single()

      if (!workspace) throw new Error("Workspace não encontrado")

      const { error: instanceError } = await supabase.from("instancia").insert({
        id_workspace: workspace.id,
        nome: instanceName,
        sync_mode: syncMode,
        status: "conectado",
        sync_status: "ativo",
      })

      if (instanceError) throw instanceError

      router.refresh()

      // Small delay to ensure refresh completes
      await new Promise((resolve) => setTimeout(resolve, 100))

      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao criar instância")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.refresh()

    // Small delay to ensure refresh completes
    setTimeout(() => {
      router.push("/dashboard")
    }, 100)
  }

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Conecte uma Instância do WhatsApp</CardTitle>
          <CardDescription>
            Conecte sua primeira instância do WhatsApp para começar a analisar conversas. Você pode pular esta etapa e
            configurar depois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGeneratingQr ? (
            <div className="flex flex-col items-center gap-6 py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Gerando QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Aguarde enquanto conectamos com o WhatsApp
                  <span className="inline-flex ml-1">
                    <span className="animate-pulse" style={{ animationDelay: "0ms" }}>
                      .
                    </span>
                    <span className="animate-pulse" style={{ animationDelay: "300ms" }}>
                      .
                    </span>
                    <span className="animate-pulse" style={{ animationDelay: "600ms" }}>
                      .
                    </span>
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">Isso pode levar alguns minutos</p>
              </div>
            </div>
          ) : qrCodeUrl ? (
            <div className="flex flex-col items-center gap-6">
              <h3 className="text-lg font-semibold">Escaneie com o WhatsApp</h3>
              <div className="relative">
                <img
                  src={qrCodeUrl || "/placeholder.svg"}
                  alt="QR Code do WhatsApp"
                  className="w-[280px] h-[280px] rounded-lg shadow-lg"
                  style={{ boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)" }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Abra o WhatsApp no seu celular, vá em Dispositivos Conectados e escaneie este QR Code
              </p>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col gap-2 w-full">
                <Button onClick={handleCreateInstance} disabled={isLoading} className="w-full">
                  {isLoading ? "Salvando..." : "Continuar"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={handleSkip}>
                  Pular por enquanto
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerateQrCode}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="instance-name">Nome da Instância</Label>
                  <Input
                    id="instance-name"
                    type="text"
                    placeholder="WhatsApp Vendas"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sync-mode">Modo de Sincronização</Label>
                  <Select value={syncMode} onValueChange={(value: "historico" | "novas") => setSyncMode(value)}>
                    <SelectTrigger id="sync-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novas">Apenas novas mensagens</SelectItem>
                      <SelectItem value="historico">Histórico completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col gap-2">
                  <Button type="submit" className="w-full" disabled={isGeneratingQr || !instanceName.trim()}>
                    Conectar Instância
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={handleSkip}>
                    Pular por enquanto
                  </Button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
