import { cookies } from "next/headers"

export async function getCurrentWorkspaceId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("current-workspace-id")?.value || null
}

export async function setCurrentWorkspaceId(workspaceId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("current-workspace-id", workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
}
