"use client"

import React, { useState } from "react"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts"

type TimeRange = "7D" | "4W" | "6M" | "1Y"

interface IncomeEvolutionChartProps {
  chartPeriods?: {
    "7D": { name: string; real: number; projected: number }[]
    "4W": { name: string; real: number; projected: number }[]
    "6M": { name: string; real: number; projected: number }[]
    "1Y": { name: string; real: number; projected: number }[]
  }
}

export function IncomeEvolutionChart({ chartPeriods }: IncomeEvolutionChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("6M")

  const chartData = chartPeriods?.[timeRange] || []
  const totalReal = chartData.reduce((acc, c) => acc + (Number(c.real) || 0), 0)
  const totalProjected = chartData.reduce((acc, c) => acc + (Number(c.projected) || 0), 0)

  return (
    <div className="bg-card rounded-[24px] border border-border shadow-xs p-6 flex flex-col justify-between">
      
      {/* HEADER Y SELECTOR DE RANGO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4 mb-4">
        <div>
          <h3 className="font-black text-foreground text-lg tracking-tight">
            Evolución Financiera vs Proyección
          </h3>
          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-1">
            <span>Cobros Reales: <strong className="text-emerald-600 dark:text-emerald-400 font-black">${totalReal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></span>
            <span>•</span>
            <span>Cotizado: <strong className="text-[#008bcd] font-black">${totalProjected.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></span>
          </div>
        </div>

        <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border/80 self-start sm:self-auto">
          {(["7D", "4W", "6M", "1Y"] as TimeRange[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                timeRange === range
                  ? "bg-[#008bcd] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range === "7D" ? "7 Días" : range === "4W" ? "Semanas" : range === "6M" ? "6 Meses" : "Año"}
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA DE LA GRÁFICA */}
      <div className="w-full h-[320px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="realGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#008bcd" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#008bcd" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.15)",
                fontSize: "12px",
                fontWeight: "bold"
              }}
              formatter={(val: any, name: any) => [
                `$${Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                name === "real" ? "Cobrado Real" : "Presupuestado"
              ]}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", fontWeight: 700, paddingBottom: "10px" }}
              formatter={(value: any) => (value === "real" ? "Cobrado Efectivo" : "Presupuestos Cotizados")}
            />
            <Area
              type="monotone"
              dataKey="projected"
              stroke="#008bcd"
              strokeDasharray="4 4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#projectedGradient)"
            />
            <Area
              type="monotone"
              dataKey="real"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#realGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}