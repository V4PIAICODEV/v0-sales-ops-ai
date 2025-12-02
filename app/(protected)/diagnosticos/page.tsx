import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getCurrentWorkspaceId } from "@/lib/workspace"
import { DiagnosisHistoryWithFilter } from "@/components/diagnosis-history-with-filter"

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

      <DiagnosisHistoryWithFilter diagnoses={diagnoses || []} />
    </div>
  )
}
