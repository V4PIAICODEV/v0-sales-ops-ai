import { createClient } from "@/lib/supabase/server"
import { InstanceManager } from "@/components/instance-manager"
import { redirect } from "next/navigation"
import { getCurrentWorkspaceId } from "@/lib/workspace"

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const workspaceId = await getCurrentWorkspaceId()

  console.log("[v0] Configuracoes - User ID:", user.id)
  console.log("[v0] Configuracoes - Workspace ID:", workspaceId)

  const { data: workspace } = await supabase
    .from("workspace")
    .select("nome")
    .eq("id", workspaceId || "")
    .single()

  const workspaceName = workspace?.nome
  console.log("[v0] Configuracoes - Workspace Name:", workspaceName)

  if (!workspaceId) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Crie um workspace para começar</p>
        </div>
      </div>
    )
  }

  // Fetch instances
  const { data: instances, error: instancesError } = await supabase
    .from("instancia")
    .select("*")
    .eq("id_workspace", workspaceId)
    .order("created_at", { ascending: false })

  console.log("[v0] Configuracoes - Instances found:", instances?.length || 0)
  console.log("[v0] Configuracoes - Instances error:", instancesError)
  if (instances && instances.length > 0) {
    console.log("[v0] Configuracoes - First instance:", instances[0])
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas instâncias do WhatsApp</p>
      </div>

      <InstanceManager instances={instances || []} workspaceId={workspaceId} workspaceName={workspaceName || ""} />
    </div>
  )
}
