"use client"

import React, { useMemo } from "react"
import { Users, Shield, Stethoscope, Headset } from "lucide-react"

export function UserStats({ users = [] }: { users: any[] }) {
  const stats = useMemo(() => {
    const activeUsers = users.filter(u => u.isActive)
    return {
      total: users.length,
      admins: activeUsers.filter(u => u.role === "ADMIN").length,
      doctors: activeUsers.filter(u => u.role === "DOCTOR").length,
      receptionists: activeUsers.filter(u => u.role === "RECEPTIONIST").length,
    }
  }, [users])

  const cards = [
    {
      title: "Total Usuarios",
      value: stats.total,
      sub: "Registrados en el sistema",
      icon: Users,
      color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
    },
    {
      title: "Administradores",
      value: stats.admins,
      sub: "Con acceso total",
      icon: Shield,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
    },
    {
      title: "Doctores Activos",
      value: stats.doctors,
      sub: "Especialistas clínicos",
      icon: Stethoscope,
      color: "bg-[#008bcd]/10 text-[#008bcd] border-[#008bcd]/20"
    },
    {
      title: "Recepción",
      value: stats.receptionists,
      sub: "Atención al paciente",
      icon: Headset,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
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