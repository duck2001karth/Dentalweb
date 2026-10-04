"use client"

import React from "react"
import { appointmentStatuses } from "@/constants/status"
import { cn } from "@/lib/utils"

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
  const config = appointmentStatuses[cita.status] || appointmentStatuses.SCHEDULED
  const StatusIcon = config.icon

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col justify-between rounded-xl bg-card border border-border/80 p-2.5 shadow-2xs hover:shadow-md hover:border-border transition-all cursor-pointer overflow-hidden text-left h-full"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-colors"
        style={{ backgroundColor: doctorColor }}
      />
      
      <div className="pl-1.5 space-y-0.5 min-w-0">
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
            config.bg, 
            config.color
          )}
        >
          <StatusIcon className="w-2.5 h-2.5" />
          <span>{config.label}</span>
        </span>
      </div>
    </div>
  )
}