import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://xdhokkofpvqplhkdmhda.supabase.co"
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkaG9ra29mcHZxcGxoa2RtaGRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MjAzNjcsImV4cCI6MjA1MjA5NjM2N30.BVUWaLh7IXP9z_XOpH6TQA0uYcVGUOPzjm4BbwOdfgA"

  if (!supabaseUrl || supabaseUrl.trim() === "") {
    console.error(
      "[v0] Missing SUPABASE_URL. Available env keys:",
      Object.keys(process.env).filter((k) => k.includes("SUPABASE")),
    )
    throw new Error("Missing Supabase URL. Please ensure NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL is set.")
  }

  if (!supabaseAnonKey || supabaseAnonKey.trim() === "") {
    console.error(
      "[v0] Missing SUPABASE_ANON_KEY. Available env keys:",
      Object.keys(process.env).filter((k) => k.includes("SUPABASE")),
    )
    throw new Error(
      "Missing Supabase Anon Key. Please ensure NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY is set.",
    )
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
