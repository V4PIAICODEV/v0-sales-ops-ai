"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"

type Category = {
  nome: string
  peso: number
}

export function MetricsRadarChart({ workspaceId }: { workspaceId?: string }) {
  const [data, setData] = React.useState<any[]>([])
  const [hoveredPoint, setHoveredPoint] = React.useState<number | null>(null)

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

      console.log("[v0] Categories from database:", categories)

      if (categories && categories.length > 0) {
        const maxPeso = Math.max(...categories.map((cat) => Number(cat.peso)))

        const chartData = categories.map((cat) => {
          // Normalize peso to percentage (0-100)
          const normalizedValue = (Number(cat.peso) / maxPeso) * 100
          return {
            category: cat.nome,
            value: normalizedValue,
          }
        })
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

  const centerX = 250
  const centerY = 220
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

  const pathData = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + " Z"

  const gridCircles = [0.2, 0.4, 0.6, 0.8, 1].map((factor) => factor * maxRadius)

  const getLabelPosition = (angle: number) => {
    const labelRadius = maxRadius + 50
    const x = centerX + labelRadius * Math.cos(angle)
    const y = centerY + labelRadius * Math.sin(angle)

    // Determine text anchor based on angle
    let textAnchor: "start" | "middle" | "end" = "middle"
    const cosAngle = Math.cos(angle)

    if (cosAngle > 0.2) {
      textAnchor = "start"
    } else if (cosAngle < -0.2) {
      textAnchor = "end"
    }

    return { x, y, textAnchor }
  }

  return (
    <div className="relative w-full">
      <div className="mb-4 flex justify-center">
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-8 bg-cyan-600" />
          <span className="text-sm font-medium">Categorias de Avaliação</span>
        </div>
      </div>

      <div className="relative h-[420px] w-full">
        <svg viewBox="0 0 500 440" className="h-full w-full">
          {gridCircles.map((radius, i) => (
            <circle
              key={i}
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              opacity={0.15}
            />
          ))}

          {/* Axis lines */}
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
                opacity="0.2"
              />
            )
          })}

          <path
            d={pathData}
            fill="oklch(0.7 0.15 195)"
            fillOpacity="0.3"
            stroke="oklch(0.65 0.18 195)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Data points with hover */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="20"
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="oklch(0.65 0.18 195)"
                stroke="white"
                strokeWidth="2.5"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {hoveredPoint === index && (
                <g>
                  <rect
                    x={point.x - 30}
                    y={point.y - 40}
                    width="60"
                    height="28"
                    rx="6"
                    fill="hsl(var(--popover))"
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                  />
                  <text
                    x={point.x}
                    y={point.y - 26}
                    textAnchor="middle"
                    className="fill-popover-foreground text-sm font-semibold"
                  >
                    {point.value.toFixed(0)}%
                  </text>
                </g>
              )}
            </g>
          ))}

          {points.map((point, index) => {
            const labelPos = getLabelPosition(point.angle)

            return (
              <text
                key={index}
                x={labelPos.x}
                y={labelPos.y}
                textAnchor={labelPos.textAnchor}
                dominantBaseline="middle"
                className="fill-foreground text-sm font-medium"
                style={{ userSelect: "none" }}
              >
                {point.label}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
