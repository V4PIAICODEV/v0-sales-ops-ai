import { createClient } from "@/lib/supabase/server"
import { InstanceManager } from "@/components/instance-manager"
import { redirect } from "next/navigation"

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: workspaces } = await supabase.from("workspace").select("id, nome").eq("id_user", user.id).limit(1)

  const workspaceId = workspaces?.[0]?.id
  const workspaceName = workspaces?.[0]?.nome

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
  const { data: instances } = await supabase
    .from("instancia")
    .select("*")
    .eq("id_workspace", workspaceId)
    .order("created_at", { ascending: false })

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
