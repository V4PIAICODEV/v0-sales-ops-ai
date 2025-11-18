"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"

type Workspace = {
  id: string
  nome: string
  created_at: string
}

export function WorkspaceSelector() {
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = React.useState<Workspace | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from("workspace")
      .select("*")
      .eq("id_user", user.id)
      .order("created_at", { ascending: false })

    if (data && data.length > 0) {
      setWorkspaces(data)
      const savedWorkspaceId = localStorage.getItem("currentWorkspaceId")
      const workspace = data.find((w) => w.id === savedWorkspaceId) || data[0]
      setCurrentWorkspace(workspace)
      localStorage.setItem("currentWorkspaceId", workspace.id)
    }
  }

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return

    setIsLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from("workspace")
      .insert({
        nome: newWorkspaceName,
        id_user: user.id,
      })
      .select()
      .single()

    if (data) {
      setWorkspaces([data, ...workspaces])
      setCurrentWorkspace(data)
      localStorage.setItem("currentWorkspaceId", data.id)
      setNewWorkspaceName("")
      setIsDialogOpen(false)
      window.location.reload()
    }

    setIsLoading(false)
  }

  const handleSelectWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace)
    localStorage.setItem("currentWorkspaceId", workspace.id)
    window.location.reload()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between bg-transparent">
            <span className="truncate">{currentWorkspace?.nome || "Selecione um workspace"}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((workspace) => (
            <DropdownMenuItem key={workspace.id} onClick={() => handleSelectWorkspace(workspace)}>
              <Check
                className={cn("mr-2 h-4 w-4", currentWorkspace?.id === workspace.id ? "opacity-100" : "opacity-0")}
              />
              {workspace.nome}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Workspace</DialogTitle>
            <DialogDescription>Crie um novo workspace para organizar suas instâncias e análises.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Workspace</Label>
              <Input
                id="name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Meu Workspace"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateWorkspace} disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
