"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"

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

  // Calculate points for radar chart
  const centerX = 150
  const centerY = 150
  const maxRadius = 120
  const numberOfPoints = data.length
  const angleStep = (2 * Math.PI) / numberOfPoints

  const points = data.map((item, index) => {
    const angle = angleStep * index - Math.PI / 2
    const radius = (item.value / 100) * maxRadius
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    return { x, y, angle, label: item.category, value: item.value }
  })

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z'

  // Grid circles
  const gridCircles = [0.25, 0.5, 0.75, 1].map(factor => factor * maxRadius)

  return (
    <div className="relative h-[300px] w-full">
      <svg viewBox="0 0 300 300" className="h-full w-full">
        {/* Grid circles */}
        {gridCircles.map((radius, i) => (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}
        
        {/* Grid lines */}
        {points.map((point, index) => {
          const angle = angleStep * index - Math.PI / 2
          const endX = centerX + maxRadius * Math.cos(angle)
          const endY = centerY + maxRadius * Math.sin(angle)
          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              opacity="0.3"
            />
          )
        })}

        {/* Data polygon */}
        <path
          d={pathData}
          fill="hsl(180, 100%, 50%)"
          fillOpacity="0.3"
          stroke="hsl(180, 100%, 50%)"
          strokeWidth="2"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="hsl(180, 100%, 50%)"
          />
        ))}

        {/* Labels */}
        {points.map((point, index) => {
          const angle = angleStep * index - Math.PI / 2
          const labelRadius = maxRadius + 30
          const labelX = centerX + labelRadius * Math.cos(angle)
          const labelY = centerY + labelRadius * Math.sin(angle)
          
          return (
            <text
              key={index}
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-xs"
            >
              {point.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
