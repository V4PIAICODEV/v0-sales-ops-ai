import { createClient } from "@/lib/supabase/server"
import { ModelosManager } from "@/components/modelos-manager"
import { redirect } from "next/navigation"

export default async function ModelosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get current workspace
  const { data: workspaces } = await supabase.from("workspace").select("id").eq("id_user", user.id).limit(1)

  const workspaceId = workspaces?.[0]?.id

  if (!workspaceId) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modelos de Avaliação</h1>
          <p className="text-muted-foreground">Crie um workspace para começar</p>
        </div>
      </div>
    )
  }

  // Fetch models with categories and criteria
  const { data: models } = await supabase
    .from("modelo_avaliacao")
    .select(
      `
      *,
      categoria:categoria(
        *,
        criterio:criterio(*)
      )
    `,
    )
    .eq("id_workspace", workspaceId)
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modelos de Avaliação</h1>
        <p className="text-muted-foreground">Gerencie categorias e critérios de avaliação</p>
      </div>

      <ModelosManager models={models || []} workspaceId={workspaceId} />
    </div>
  )
}
