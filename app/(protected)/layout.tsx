import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has a workspace
  const { data: workspaces } = await supabase
    .from("workspace")
    .select("id")
    .eq("id_user", user.id)
    .limit(1)

  if (!workspaces || workspaces.length === 0) {
    redirect("/onboarding/workspace")
  }

  // Check if workspace has at least one instance
  const { data: instances } = await supabase
    .from("instancia")
    .select("id")
    .eq("id_workspace", workspaces[0].id)
    .limit(1)

  if (!instances || instances.length === 0) {
    redirect("/onboarding/instance")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <span className="font-semibold">Diagnóstico WhatsApp AI</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
