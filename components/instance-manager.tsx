"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

type Instance = {
  id: string
  nome: string
  numero: string | null
  status: string
  sync_mode: string
  sync_status: string
  token_evolution: string | null
  connected_at: string | null
  created_at: string
}

export function InstanceManager({
  instances,
  workspaceId,
  workspaceName,
}: {
  instances: Instance[]
  workspaceId: string
  workspaceName: string
}) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingInstance, setEditingInstance] = React.useState<Instance | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const [qrCodeUrl, setQrCodeUrl] = React.useState<string | null>(null)
  const [isGeneratingQr, setIsGeneratingQr] = React.useState(false)
  const [qrError, setQrError] = React.useState<string | null>(null)

  // Form states
  const [instanceName, setInstanceName] = React.useState("")
  const [syncMode, setSyncMode] = React.useState<"historico" | "novas">("novas")

  const handleOpenDialog = (instance?: Instance) => {
    if (instance) {
      setEditingInstance(instance)
      setInstanceName(instance.nome)
      setSyncMode(instance.sync_mode as "historico" | "novas")
    } else {
      setEditingInstance(null)
      setInstanceName("")
      setSyncMode("novas")
    }
    setQrCodeUrl(null)
    setQrError(null)
    setIsDialogOpen(true)
  }

  const handleGenerateQrCode = async () => {
    if (!instanceName.trim()) {
      setQrError("Por favor, preencha o nome da instância")
      return
    }

    setIsGeneratingQr(true)
    setQrError(null)

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
      setQrError(error instanceof Error ? error.message : "Erro ao gerar QR Code. Tente novamente.")
    } finally {
      setIsGeneratingQr(false)
    }
  }

  const handleSaveInstance = async () => {
    if (!instanceName.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    if (editingInstance) {
      // Update existing instance
      const { error } = await supabase
        .from("instancia")
        .update({
          nome: instanceName,
          sync_mode: syncMode,
        })
        .eq("id", editingInstance.id)

      if (!error) {
        setIsDialogOpen(false)
        router.refresh()
      }
    } else {
      // Create new instance
      const { error } = await supabase.from("instancia").insert({
        nome: instanceName,
        sync_mode: syncMode,
        id_workspace: workspaceId,
        status: "conectado",
        sync_status: "ativo",
      })

      if (!error) {
        setIsDialogOpen(false)
        router.refresh()
      }
    }

    setIsLoading(false)
  }

  const handleDeleteInstance = async (instanceId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta instância?")) return

    setIsLoading(true)
    const supabase = createClient()

    await supabase.from("instancia").delete().eq("id", instanceId)

    router.refresh()
    setIsLoading(false)
  }

  const getStatusIcon = (status: string, syncStatus: string) => {
    if (status === "conectado" && syncStatus === "ativo") {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    }
    if (syncStatus === "sincronizando") {
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
    }
    if (syncStatus === "erro" || status === "desconectado") {
      return <XCircle className="h-5 w-5 text-destructive" />
    }
    return <AlertCircle className="h-5 w-5 text-yellow-500" />
  }

  const getStatusText = (status: string, syncStatus: string) => {
    if (status === "conectado" && syncStatus === "ativo") {
      return "Ativo"
    }
    if (syncStatus === "sincronizando") {
      return "Sincronizando"
    }
    if (syncStatus === "erro") {
      return "Erro"
    }
    if (status === "desconectado") {
      return "Desconectado"
    }
    return "Pendente"
  }

  const getStatusVariant = (status: string, syncStatus: string) => {
    if (status === "conectado" && syncStatus === "ativo") {
      return "default"
    }
    if (syncStatus === "sincronizando") {
      return "secondary"
    }
    if (syncStatus === "erro" || status === "desconectado") {
      return "destructive"
    }
    return "outline"
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Instâncias do WhatsApp</CardTitle>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Instância
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Nenhuma instância configurada</p>
              <p className="text-xs text-muted-foreground mt-1">Clique em "Nova Instância" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {instances.map((instance) => (
                <div key={instance.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-4 flex-1">
                    {getStatusIcon(instance.status, instance.sync_status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{instance.nome}</p>
                        <Badge variant={getStatusVariant(instance.status, instance.sync_status) as any}>
                          {getStatusText(instance.status, instance.sync_status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          Modo: {instance.sync_mode === "historico" ? "Histórico completo" : "Apenas novas mensagens"}
                        </span>
                        {instance.token_evolution && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Token configurado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenDialog(instance)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteInstance(instance.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instance Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingInstance ? "Editar Instância" : "Nova Instância"}</DialogTitle>
            <DialogDescription>Configure sua instância do WhatsApp via Evolution API</DialogDescription>
          </DialogHeader>

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
            <div className="flex flex-col items-center gap-4 py-8">
              <h3 className="text-lg font-semibold">Escaneie com o WhatsApp</h3>
              <div className="relative">
                <img
                  src={qrCodeUrl || "/placeholder.svg"}
                  alt="QR Code do WhatsApp"
                  className="w-[280px] h-[280px] rounded-lg shadow-lg"
                  style={{ boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)" }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Abra o WhatsApp no seu celular, vá em Dispositivos Conectados e escaneie este QR Code
              </p>
              <Button onClick={handleSaveInstance} disabled={isLoading} className="w-full max-w-xs">
                {isLoading ? "Salvando..." : "Continuar"}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="instance-name">Nome da Instância</Label>
                  <Input
                    id="instance-name"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                    placeholder="Minha Instância"
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
                  {syncMode === "historico" && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        A sincronização do histórico completo pode levar algumas horas dependendo da quantidade de
                        conversas.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {qrError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{qrError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                {editingInstance ? (
                  <Button onClick={handleSaveInstance} disabled={isLoading}>
                    {isLoading ? "Salvando..." : "Salvar"}
                  </Button>
                ) : (
                  <Button onClick={handleGenerateQrCode} disabled={isGeneratingQr || !instanceName.trim()}>
                    Gerar QR Code
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
