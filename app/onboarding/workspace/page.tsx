"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function WorkspaceOnboardingPage() {
  const [workspaceName, setWorkspaceName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { data: workspace, error: workspaceError } = await supabase
        .from("workspace")
        .insert({
          nome: workspaceName,
          id_user: user.id,
        })
        .select()
        .single()

      if (workspaceError) throw workspaceError

      const { error: modelError } = await supabase.rpc("create_default_evaluation_model", {
        workspace_id: workspace.id,
      })

      if (modelError) {
        console.error("[v0] Error creating default model:", modelError)
        // Don't throw - workspace is created, model creation is secondary
      }

      router.refresh()

      // Small delay to ensure refresh completes
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Redirect to instance setup
      router.push("/onboarding/instance")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao criar workspace")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Crie seu Workspace</CardTitle>
          <CardDescription>
            Para começar, você precisa criar um workspace. Este será o espaço onde você gerenciará suas conversas e
            análises.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateWorkspace}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="workspace-name">Nome do Workspace</Label>
                <Input
                  id="workspace-name"
                  type="text"
                  placeholder="Minha Empresa"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading || !workspaceName.trim()}>
                {isLoading ? "Criando..." : "Criar Workspace"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
