import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getCurrentWorkspaceId } from "@/lib/workspace"
import { DiagnosisHistory } from "@/components/diagnosis-history"

export default async function DiagnosticosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const workspaceId = await getCurrentWorkspaceId()

  if (!workspaceId) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diagnósticos Comerciais</h1>
          <p className="text-muted-foreground">Crie um workspace para começar</p>
        </div>
      </div>
    )
  }

  // Fetch all diagnoses for the current workspace
  const { data: diagnoses } = await supabase
    .from("diagnostico")
    .select("*")
    .eq("id_workspace", workspaceId)
    .order("data_geracao", { ascending: false })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Diagnósticos Comerciais</h1>
        <p className="text-muted-foreground">
          Histórico completo de diagnósticos gerados com dados consolidados do período
        </p>
      </div>

      <DiagnosisHistory diagnoses={diagnoses || []} fullPage={true} />
    </div>
  )
}
