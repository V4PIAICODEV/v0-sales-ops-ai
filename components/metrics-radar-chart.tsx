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
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        Nenhum modelo de avaliação ativo
      </div>
    )
  }

  const centerX = 200
  const centerY = 200
  const maxRadius = 100
  const numberOfPoints = data.length
  const angleStep = (2 * Math.PI) / numberOfPoints

  const points = data.map((item, index) => {
    const angle = angleStep * index - Math.PI / 2
    const radius = (item.value / 100) * maxRadius
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    return { x, y, angle, label: item.category, value: item.value }
  })

  const pathData = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + " Z"

  const gridCircles = [0.2, 0.4, 0.6, 0.8, 1].map((factor) => factor * maxRadius)

  const getLabelPosition = (angle: number, index: number) => {
    const labelRadius = maxRadius + 50
    const x = centerX + labelRadius * Math.cos(angle)
    let y = centerY + labelRadius * Math.sin(angle)

    // Determine text anchor based on position
    let textAnchor: "start" | "middle" | "end" = "middle"

    if (Math.cos(angle) > 0.3) {
      textAnchor = "start" // Right side
    } else if (Math.cos(angle) < -0.3) {
      textAnchor = "end" // Left side
    }

    // Adjust y position for better spacing
    const adjustY = Math.sin(angle)
    if (adjustY > 0.5) {
      y += 8 // Push down labels at bottom
    } else if (adjustY < -0.5) {
      y -= 8 // Push up labels at top
    }

    return { x, y, textAnchor }
  }

  const breakLabel = (label: string, maxChars = 18) => {
    if (label.length <= maxChars) return [label]

    const words = label.split(" ")
    const lines: string[] = []
    let currentLine = ""

    for (const word of words) {
      if ((currentLine + " " + word).trim().length <= maxChars) {
        currentLine = (currentLine + " " + word).trim()
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) lines.push(currentLine)

    return lines
  }

  return (
    <div className="relative h-[350px] w-full px-4 py-4">
      <svg viewBox="0 0 400 400" className="h-full w-full overflow-visible">
        {gridCircles.map((radius, i) => (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            opacity={0.2 + i * 0.1}
          />
        ))}

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
              strokeWidth="0.5"
              opacity="0.4"
            />
          )
        })}

        <path
          d={pathData}
          fill="oklch(0.7 0.15 195)"
          fillOpacity="0.4"
          stroke="oklch(0.7 0.15 195)"
          strokeWidth="2.5"
        />

        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="oklch(0.7 0.15 195)"
            stroke="oklch(0.9 0.15 195)"
            strokeWidth="2"
          />
        ))}

        {points.map((point, index) => {
          const labelPos = getLabelPosition(point.angle, index)
          const labelLines = breakLabel(point.label)

          return (
            <g key={index}>
              {labelLines.map((line, lineIndex) => (
                <text
                  key={lineIndex}
                  x={labelPos.x}
                  y={labelPos.y + lineIndex * 14}
                  textAnchor={labelPos.textAnchor}
                  dominantBaseline="middle"
                  className="fill-foreground text-[11px] font-medium"
                  style={{ userSelect: "none" }}
                >
                  {line}
                </text>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
