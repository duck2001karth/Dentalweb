"use client"

import React, { useMemo } from "react"
import { DollarSign, Banknote, CreditCard } from "lucide-react"

interface BillingStatsProps {
  payments: any[]
}

export function BillingStats({ payments = [] }: BillingStatsProps) {
  const stats = useMemo(() => {
    let completedTotal = 0, cashTotal = 0, digitalTotal = 0
    const methodDistribution: Record<string, number> = { Efectivo: 0, Transferencia: 0, Tarjetas: 0, Otros: 0 }

    payments.forEach((p) => {
      const amount = Number(p.amount || 0)
      const m = (p.method || "CASH").toUpperCase()

      completedTotal += amount
      if (m === "CASH" || m === "EFECTIVO") {
        cashTotal += amount
        methodDistribution["Efectivo"] += amount
      } else if (m === "TRANSFER" || m === "DEUNA") {
        digitalTotal += amount
        methodDistribution["Transferencia"] += amount
      } else if (m.includes("CARD") || m.includes("TARJETA")) {
        digitalTotal += amount
        methodDistribution["Tarjetas"] += amount
      } else {
        methodDistribution["Otros"] += amount
      }
    })

    return { completedTotal, cashTotal, digitalTotal, methodDistribution }
  }, [payments])

  const maxMethodValue = Math.max(...Object.values(stats.methodDistribution), 1)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 print:hidden">     
      {/* 1. TOTAL RECAUDADO */}
      <div className="bg-card p-5 rounded-[22px] border border-border shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Total Recaudado
          </p>
          <h3 className="text-2xl font-black text-foreground tracking-tight">
            ${stats.completedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            Cobros verificados
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <DollarSign className="w-5 h-5 stroke-[2.5]" />
        </div>
      </div>
      {/* 2. EFECTIVO FÍSICO */}
      <div className="bg-card p-5 rounded-[22px] border border-border shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Efectivo Físico
          </p>
          <h3 className="text-2xl font-black text-[#008bcd] tracking-tight">
            ${stats.cashTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-muted-foreground font-semibold mt-1">
            Arqueo en gaveta
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center shrink-0">
          <Banknote className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>
      {/* 3. DIGITAL / BANCOS */}
      <div className="bg-card p-5 rounded-[22px] border border-border shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Digital / Bancos
          </p>
          <h3 className="text-2xl font-black text-foreground tracking-tight">
            ${stats.digitalTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-muted-foreground font-semibold mt-1">
            Cuentas y datafast
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>

      {/* 4. DISTRIBUCIÓN DE MEDIOS */}
      <div className="bg-card p-4 rounded-[22px] border border-border shadow-xs flex flex-col justify-center gap-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Distribución de Medios
        </p>
        <div className="space-y-1.5">
          {Object.entries(stats.methodDistribution).map(([label, val]) => {
            const pct = stats.completedTotal > 0 ? Math.round((val / stats.completedTotal) * 100) : 0
            return (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className="w-20 text-[10px] font-bold text-muted-foreground truncate">{label}</span>
                <div className="flex-1 bg-muted/60 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#008bcd] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
                <span className="font-bold text-[10px] text-foreground w-10 text-right font-mono">
                  ${val.toFixed(0)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}