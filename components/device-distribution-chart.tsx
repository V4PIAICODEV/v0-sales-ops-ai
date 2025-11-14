"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Smartphone } from 'lucide-react'

interface DeviceDistributionChartProps {
  devices: Array<{ device: string | null }>
}

const DEVICE_COLORS = {
  Android: "hsl(142, 76%, 36%)", // Green
  iOS: "hsl(217, 91%, 60%)", // Blue
  Web: "hsl(48, 96%, 53%)", // Yellow
  Outro: "hsl(280, 67%, 55%)", // Purple
  Desconhecido: "hsl(0, 0%, 45%)", // Gray
}

export function DeviceDistributionChart({ devices }: DeviceDistributionChartProps) {
  // Count devices
  const deviceCounts = devices.reduce(
    (acc, item) => {
      const device = item.device || "Desconhecido"
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

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <Smartphone className="h-8 w-8" />
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Legend
          wrapperStyle={{
            color: "hsl(var(--foreground))",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
