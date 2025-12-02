"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Loader2, MessageSquare, QrCode } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type ConnectionStatus = "idle" | "loading" | "showing-qr" | "checking-connection" | "connected" | "error"

export default function WorkspaceSetup() {
  const [workspaceName, setWorkspaceName] = useState("")
  const [status, setStatus] = useState<ConnectionStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [instanceName, setInstanceName] = useState<string>("")

  useEffect(() => {
    if (status !== "checking-connection" || !instanceName) return

    const checkConnection = async () => {
      try {
        const response = await fetch(`/api/whatsapp/check-connection?instance=${instanceName}`)
        const data = await response.json()

        if (data.connected) {
          setStatus("connected")
          localStorage.setItem("workspace", workspaceName)
          localStorage.setItem("instanceName", instanceName)
        }
      } catch (err) {
        console.error("Error checking connection:", err)
      }
    }

    const interval = setInterval(checkConnection, 3000)
    return () => clearInterval(interval)
  }, [status, instanceName, workspaceName])

  const handleGenerateQR = async () => {
    if (!workspaceName.trim()) {
      setError("Por favor, insira o nome da empresa")
      return
    }

    setStatus("loading")
    setError(null)

    try {
      const response = await fetch("/api/whatsapp/create-instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceName: workspaceName.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha ao criar workspace")
      }

      const data = await response.json()

      if (data.qrCode) {
        setQrCode(data.qrCode)
        setInstanceName(data.instanceName)
        setStatus("showing-qr")

        setTimeout(() => {
          setStatus("checking-connection")
        }, 2000)
      } else {
        throw new Error("QR Code não foi recebido do webhook")
      }
    } catch (err: any) {
      setError(err.message || "Erro ao gerar QR Code. Tente novamente.")
      setStatus("error")
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-2 border-black bg-white">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-black rounded-full">
              <MessageSquare className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-balance text-black">Configuração do Workspace</CardTitle>
          <CardDescription className="text-base text-pretty text-gray-600">
            Configure sua empresa e conecte o WhatsApp em poucos passos
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {(status === "idle" || status === "error") && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace" className="text-sm font-medium text-black">
                  Nome da Empresa
                </Label>
                <Input
                  id="workspace"
                  placeholder="Digite o nome da sua empresa"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="h-12 text-base border-2 border-gray-300 focus:border-black"
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateQR()}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start gap-3">
                  <QrCode className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-black">Como conectar:</p>
                    <p className="text-gray-700">
                      Abra o WhatsApp → Mais opções → Aparelhos conectados → Conectar um aparelho
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerateQR}
                disabled={!workspaceName.trim()}
                className="w-full h-12 text-base font-semibold bg-black text-white hover:bg-gray-800 disabled:bg-gray-400"
                size="lg"
              >
                <QrCode className="mr-2 h-5 w-5" />
                Gerar QR Code
              </Button>

              <p className="text-xs text-gray-500 text-center text-pretty">
                Ao continuar, você terá acesso direto ao sistema sem necessidade de login
              </p>
            </div>
          )}

          {status === "loading" && (
            <div className="space-y-6 text-center py-8">
              <Loader2 className="w-16 h-16 animate-spin mx-auto text-black" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-black">Gerando QR Code...</h3>
                <p className="text-gray-600 text-balance">Aguarde enquanto preparamos tudo para você</p>
              </div>
            </div>
          )}

          {(status === "showing-qr" || status === "checking-connection") && qrCode && (
            <div className="space-y-6">
              <div className="p-4 border-4 border-black rounded-xl bg-white flex items-center justify-center">
                <img
                  src={qrCode || "/placeholder.svg"}
                  alt="QR Code do WhatsApp"
                  className="w-full h-auto max-w-[300px]"
                />
              </div>

              <div className="text-center space-y-1">
                <p className="font-semibold text-black text-lg">{instanceName}</p>
                <p className="text-sm text-gray-600 text-balance">Escaneie o QR Code com o WhatsApp do seu celular</p>
              </div>

              {status === "checking-connection" && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Aguardando conexão...</span>
                </div>
              )}
            </div>
          )}

          {status === "connected" && (
            <div className="space-y-6 text-center py-8">
              <div className="flex justify-center">
                <div className="p-6 bg-black rounded-full">
                  <CheckCircle2 className="w-20 h-20 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-black">WhatsApp Conectado!</h3>
                <p className="text-gray-600 text-balance">Sua instância está ativa e pronta para receber mensagens</p>
              </div>

              <div className="border-2 border-black rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium text-black mb-1">Workspace: {workspaceName}</p>
                <p className="text-sm text-gray-600">Instância: {instanceName}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
