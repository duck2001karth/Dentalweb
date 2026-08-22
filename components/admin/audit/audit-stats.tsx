"use client"

import React, { useMemo } from "react"
import { ShieldCheck, AlertOctagon, Fingerprint, Activity } from "lucide-react"

export function AuditStats({ logs = [] }: { logs: any[] }) {
  const stats = useMemo(() => {
    const criticalCount = logs.filter(l => l.action === "DELETE").length
    const updateCount = logs.filter(l => l.action === "UPDATE").length
    const uniqueUsers = new Set(logs.map(l => l.user?.name).filter(Boolean)).size

    return {
      total: logs.length,
      critical: criticalCount,
      updates: updateCount,
      users: uniqueUsers
    }
  }, [logs])

  const cards = [
    {
      title: "Total Eventos",
      value: stats.total,
      sub: "Registros en bitácora",
      icon: Activity,
      color: "bg-[#008bcd]/10 text-[#008bcd] border-[#008bcd]/20"
    },
    {
      title: "Acciones Críticas",
      value: stats.critical,
      sub: "Eliminaciones (DELETE)",
      icon: AlertOctagon,
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
    },
    {
      title: "Modificaciones",
      value: stats.updates,
      sub: "Ediciones de registros",
      icon: ShieldCheck,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    },
    {
      title: "Usuarios Activos",
      value: stats.users,
      sub: "Interactuando con el sistema",
      icon: Fingerprint,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-card p-5 rounded-[22px] border border-border shadow-xs flex items-center justify-between hover:border-[#008bcd]/40 transition-all">
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