import type React from "react"
import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentWorkspaceId, setCurrentWorkspaceId } from "@/lib/workspace"

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

  let workspaceId = await getCurrentWorkspaceId()

  const { data: workspaces, error } = await supabase.from("workspace").select("id").eq("id_user", user.id)

  if (!workspaces || workspaces.length === 0) {
    redirect("/onboarding/workspace")
  }

  if (!workspaceId || !workspaces.find((w) => w.id === workspaceId)) {
    workspaceId = workspaces[0].id
    await setCurrentWorkspaceId(workspaceId)
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main className="flex-1 w-full">{children}</main>
    </SidebarProvider>
  )
}
