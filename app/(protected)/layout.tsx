import type React from "react"
import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentWorkspaceId } from "@/lib/workspace"

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

  const { data: workspaces } = await supabase.from("workspace").select("id").eq("id_user", user.id)

  if (!workspaces || workspaces.length === 0) {
    redirect("/onboarding/workspace")
  }

  const workspaceId = await getCurrentWorkspaceId()

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main className="flex-1 w-full">{children}</main>
    </SidebarProvider>
  )
}
