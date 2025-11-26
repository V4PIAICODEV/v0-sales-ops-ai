import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspace_id")

    if (!workspaceId) {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("analise")
      .select(
        `
        *,
        conversa!inner(
          id,
          cliente(nome, telefone),
          instancia!inner(
            id_workspace
          )
        )
      `,
      )
      .eq("conversa.instancia.id_workspace", workspaceId)

    if (error) {
      console.error("[v0] Error fetching analyses:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error in GET /api/analyses:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
