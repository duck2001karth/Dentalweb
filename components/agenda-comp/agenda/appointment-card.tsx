"use client"

import React from "react"
import { Clock, Check, X, User } from "lucide-react"
import { cn } from "@/lib/utils"

export type AppointmentStatusType = "COMPLETED" | "SCHEDULED" | "WAITING" | "CANCELED"

export const STATUS_CONFIG: Record<AppointmentStatusType, { label: string; icon: React.ComponentType<{ className?: string }>; badgeClass: string; barClass: string }> = {
  COMPLETED: {
    label: "Completed",
    icon: Check,
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    barClass: "bg-emerald-500",
  },
  SCHEDULED: {
    label: "Scheduled",
    icon: Clock,
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    barClass: "bg-sky-500",
  },
  WAITING: {
    label: "Patient is waiting",
    icon: User,
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    barClass: "bg-amber-500",
  },
  CANCELED: {
    label: "Canceled",
    icon: X,
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    barClass: "bg-rose-500",
  },
}

interface AppointmentCardProps {
  cita: any
  doctorColor: string
  onClick: () => void
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  cita,
  doctorColor,
  onClick,
}) => {
  const statusKey: AppointmentStatusType = 
    cita.status === "COMPLETED" ? "COMPLETED" :
    cita.status === "WAITING" ? "WAITING" :
    (cita.status === "CANCELLED" || cita.status === "CANCELED") ? "CANCELED" : "SCHEDULED"

  const config = STATUS_CONFIG[statusKey]
  const StatusIcon = config.icon

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col justify-between rounded-xl bg-card border border-border/80 p-2.5 shadow-2xs hover:shadow-md hover:border-border transition-all cursor-pointer overflow-hidden text-left"
    >
      <div 
        className={cn("absolute left-0 top-0 bottom-0 w-1", config.barClass)} 
        style={{ backgroundColor: doctorColor }}
      />

      <div className="pl-1.5 space-y-0.5">
        <span className="text-[10px] font-semibold text-muted-foreground block">
          {cita.startTime} - {cita.endTime}
        </span>
        <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
          {cita.patient?.firstName} {cita.patient?.lastName}
        </h4>
        <p className="text-[10px] text-muted-foreground truncate leading-tight">
          {cita.reason || "Consulta General"}
        </p>
      </div>

      <div className="mt-2 pl-1.5">
        <span 
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors",
            config.badgeClass
          )}
        >
          <StatusIcon className="w-2.5 h-2.5" />
          <span>{config.label}</span>
        </span>
      </div>
    </div>
  )
}