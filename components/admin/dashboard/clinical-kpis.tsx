"use client"

import React from "react"
import { 
  DollarSign, 
  Target, 
  Wallet, 
  ReceiptText, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react"

interface ClinicalKPIsProps {
  income: number
  incomeGrowth: number
  patients: number
  patientsGrowth: number
  acceptanceRate: number
  totalAccountsReceivable: number
  averageTicket: number
  payingPatientsCount?: number
}

export function ClinicalKPIs({
  income = 0,
  incomeGrowth = 0,
  patients = 0,
  acceptanceRate = 0,
  totalAccountsReceivable = 0,
  averageTicket = 0,
  payingPatientsCount = 0
}: ClinicalKPIsProps) {
  const cards = [
    {
      title: "Ingresos del Mes",
      value: `$${income.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: `${incomeGrowth}% vs mes anterior`,
      icon: DollarSign,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      trend: incomeGrowth >= 0
    },
    {
      title: "Tasa de Aceptación",
      value: `${acceptanceRate}%`,
      sub: "Presupuestos aprobados",
      icon: Target,
      color: "bg-[#008bcd]/10 text-[#008bcd] border-[#008bcd]/20"
    },
    {
      title: "Cuentas por Cobrar",
      value: `$${totalAccountsReceivable.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: "Cartera en tratamientos activos",
      icon: Wallet,
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
    },
    {
      title: "Ticket Promedio",
      value: `$${averageTicket.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: payingPatientsCount > 0 ? `En base a ${payingPatientsCount} pagos` : `En base a ${patients} pacientes`,
      icon: ReceiptText,
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-card p-5 rounded-[22px] border border-border shadow-xs flex items-center justify-between hover:border-[#008bcd]/40 transition-all group"
        >
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {card.title}
            </p>
            <h3 className="text-2xl font-black text-foreground tracking-tight">
              {card.value}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              {card.trend !== undefined ? (
                <span className={`text-[10px] font-bold flex items-center ${card.trend ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {card.trend ? <ArrowUpRight className="w-3 h-3 stroke-[2.5]" /> : <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />}
                  {card.sub}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {card.sub}
                </span>
              )}
            </div>
          </div>

          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${card.color}`}>
            <card.icon className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      ))}
    </div>
  )
}