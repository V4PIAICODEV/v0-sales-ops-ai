"use client"

import { Smartphone } from "lucide-react"

interface DeviceDistributionChartProps {
  devices: Array<{ device: string | null }>
}

const DEVICE_COLORS = {
  android: "hsl(142, 76%, 36%)", // Green
  ios: "hsl(0, 0%, 100%)", // White
  web: "hsl(217, 91%, 60%)", // Blue
  unknown: "hsl(0, 0%, 50%)", // Gray
  // Keep capitalized versions as fallback
  Android: "hsl(142, 76%, 36%)",
  iOS: "hsl(0, 0%, 100%)",
  Web: "hsl(217, 91%, 60%)",
  Outro: "hsl(0, 0%, 50%)",
  Desconhecido: "hsl(0, 0%, 50%)",
}

export function DeviceDistributionChart({ devices }: DeviceDistributionChartProps) {
  // Count devices
  const deviceCounts = devices.reduce(
    (acc, item) => {
      const device = item.device || "unknown"
      acc[device] = (acc[device] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Convert to chart data
  const chartData = Object.entries(deviceCounts).map(([name, value]) => ({
    name,
    value,
    color: DEVICE_COLORS[name as keyof typeof DEVICE_COLORS] || DEVICE_COLORS.Outro,
  }))

  const displayData = chartData.filter((item) => item.name !== "Desconhecido" && item.name !== "unknown")

  if (displayData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <Smartphone className="h-8 w-8" />
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    )
  }

  const total = displayData.reduce((sum, item) => sum + item.value, 0)

  // Calculate pie slices
  let currentAngle = -90 // Start at top
  const slices = displayData.map((item) => {
    const percentage = item.value / total
    const angle = percentage * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    // Calculate path for pie slice
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const x1 = 150 + 100 * Math.cos(startRad)
    const y1 = 150 + 100 * Math.sin(startRad)
    const x2 = 150 + 100 * Math.cos(endRad)
    const y2 = 150 + 100 * Math.sin(endRad)
    const largeArc = angle > 180 ? 1 : 0

    return {
      ...item,
      percentage: Math.round(percentage * 100),
      path: `M 150 150 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`,
      labelAngle: (startAngle + endAngle) / 2,
    }
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[300px] w-full">
        <svg viewBox="0 0 300 300" className="h-full w-full">
          {slices.map((slice, index) => (
            <path key={index} d={slice.path} fill={slice.color} stroke="hsl(var(--background))" strokeWidth="2" />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {slices.map((slice, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: slice.color }} />
            <span className="text-sm">
              {slice.name} ({slice.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
