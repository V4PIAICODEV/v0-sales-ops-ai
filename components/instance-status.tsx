"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Loader2, XCircle } from "lucide-react"

type Instance = {
  id: string
  nome: string
  status: string
  sync_status: string
}

export function InstanceStatus({ instances }: { instances: Instance[] }) {
  if (instances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma instância configurada</p>
        <p className="text-xs text-muted-foreground mt-1">Vá para Configurações para adicionar uma instância</p>
      </div>
    )
  }

  const getStatusIcon = (status: string, syncStatus: string) => {
    if (status === "conectado" && syncStatus === "ativo") {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    }
    if (syncStatus === "sincronizando") {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    }
    if (syncStatus === "erro" || status === "desconectado") {
      return <XCircle className="h-4 w-4 text-destructive" />
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
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
    <div className="space-y-4">
      {instances.map((instance) => (
        <div key={instance.id} className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            {getStatusIcon(instance.status, instance.sync_status)}
            <div>
              <p className="text-sm font-medium">{instance.nome}</p>
              <p className="text-xs text-muted-foreground">{getStatusText(instance.status, instance.sync_status)}</p>
            </div>
          </div>
          <Badge variant={getStatusVariant(instance.status, instance.sync_status) as any}>
            {getStatusText(instance.status, instance.sync_status)}
          </Badge>
        </div>
      ))}
    </div>
  )
}
