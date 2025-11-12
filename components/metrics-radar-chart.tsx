"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type Category = {
  nome: string
  peso: number
}

export function MetricsRadarChart({ workspaceId }: { workspaceId?: string }) {
  const [data, setData] = React.useState<any[]>([])

  React.useEffect(() => {
    if (!workspaceId) return

    const loadCategories = async () => {
      const supabase = createClient()

      // Get active model
      const { data: model } = await supabase
        .from("modelo_avaliacao")
        .select("id")
        .eq("id_workspace", workspaceId)
        .eq("ativo", true)
        .single()

      if (!model) {
        // Set default empty data
        setData([
          { category: "Atendimento", value: 0 },
          { category: "Comunicação", value: 0 },
          { category: "Resolução", value: 0 },
          { category: "Proatividade", value: 0 },
          { category: "Empatia", value: 0 },
        ])
        return
      }

      // Get categories
      const { data: categories } = await supabase
        .from("categoria")
        .select("nome, peso")
        .eq("id_modelo", model.id)
        .order("ordem")

      if (categories && categories.length > 0) {
        const chartData = categories.map((cat) => ({
          category: cat.nome,
          value: Number(cat.peso) * 100,
        }))
        setData(chartData)
      } else {
        setData([
          { category: "Atendimento", value: 0 },
          { category: "Comunicação", value: 0 },
          { category: "Resolução", value: 0 },
          { category: "Proatividade", value: 0 },
          { category: "Empatia", value: 0 },
        ])
      }
    }

    loadCategories()
  }, [workspaceId])

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        Nenhum modelo de avaliação ativo
      </div>
    )
  }

  return (
    <ChartContainer
      config={{
        value: {
          label: "Peso",
          color: "hsl(180, 100%, 50%)",
        },
      }}
      className="h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%">
          <PolarGrid stroke="hsl(240, 5%, 30%)" strokeWidth={1} />
          <PolarAngleAxis dataKey="category" tick={{ fill: "hsl(0, 0%, 90%)", fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(0, 0%, 70%)", fontSize: 10 }} />
          <Radar
            name="Peso"
            dataKey="value"
            stroke="hsl(180, 100%, 50%)"
            fill="hsl(180, 100%, 50%)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
