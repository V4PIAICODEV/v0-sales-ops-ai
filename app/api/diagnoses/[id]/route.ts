import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = await createClient()

    const { data: diagnosis, error } = await supabase.from("diagnostico").select("*").eq("id", id).single()

    if (error) {
      console.error("[v0] Error fetching diagnosis:", error)
      return NextResponse.json({ error: "Diagnosis not found" }, { status: 404 })
    }

    return NextResponse.json(diagnosis)
  } catch (error) {
    console.error("[v0] Error in GET /api/diagnoses/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
