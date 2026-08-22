"use client"

import React, { useMemo } from "react"
import { ListTree, CheckCircle2, DollarSign, Layers } from "lucide-react"

interface Procedure {
  id: string
  code: string | null
  name: string
  category: string
  basePrice: number
  isActive: boolean
}

export function CatalogStats({ items = [] }: { items: Procedure[] }) {
  const stats = useMemo(() => {
    const total = items.length
    const active = items.filter((i) => i.isActive).length
    const categoriesCount = new Set(items.map((i) => i.category)).size
    const avgPrice = total > 0 ? items.reduce((acc, i) => acc + Number(i.basePrice || 0), 0) / total : 0

    return { total, active, categoriesCount, avgPrice }
  }, [items])

  const cards = [
    {
      title: "Total Prestaciones",
      value: stats.total.toString(),
      sub: "Registradas en arancel",
      icon: ListTree,
      color: "bg-[#008bcd]/10 text-[#008bcd] border-[#008bcd]/20"
    },
    {
      title: "Prestaciones Activas",
      value: stats.active.toString(),
      sub: "Disponibles en odontograma",
      icon: CheckCircle2,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    },
    {
      title: "Especialidades",
      value: stats.categoriesCount.toString(),
      sub: "Categorías clínicas",
      icon: Layers,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
    },
    {
    title: "Arancel Promedio",
    value: `$${stats.avgPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    sub: "Valor medio por prestación",
    icon: DollarSign,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-card p-5 rounded-[22px] border border-border shadow-xs flex items-center justify-between hover:border-[#008bcd]/40 transition-all"
        >
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {card.title}
            </p>
            <h3 className="text-2xl font-black text-foreground tracking-tight">
              {card.value}
            </h3>
            <p className="text-[10px] text-muted-foreground font-semibold mt-1">
              {card.sub}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${card.color}`}>
            <card.icon className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      ))}
    </div>
  )
}