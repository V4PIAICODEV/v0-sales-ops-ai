import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function OnboardingLayout({
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

  const { data: workspaces } = await supabase.from("workspace").select("id").eq("id_user", user.id).limit(1)

  console.log("[v0] Onboarding layout - User ID:", user.id)
  console.log("[v0] Onboarding layout - Workspace found:", workspaces)

  // If user already has a workspace, redirect to dashboard
  if (workspaces && workspaces.length > 0) {
    console.log("[v0] Onboarding layout - Redirecting to dashboard")
    redirect("/dashboard")
  }

  return <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">{children}</div>
}
