import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

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

  console.log("[v0] Protected layout - User ID:", user.id)

  const { data: workspaces, error } = await supabase.from("workspace").select("id").eq("id_user", user.id).limit(1)

  console.log("[v0] Protected layout - Workspace query result:", workspaces)
  console.log("[v0] Protected layout - Workspace query error:", error)

  if (!workspaces || workspaces.length === 0) {
    console.log("[v0] Protected layout - No workspace found, redirecting to onboarding")
    redirect("/onboarding/workspace")
  }

  console.log("[v0] Protected layout - Workspace found, rendering protected content")

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main className="flex-1 w-full">{children}</main>
    </SidebarProvider>
  )
}
