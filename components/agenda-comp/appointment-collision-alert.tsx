"use client"

import React from "react"
import { AlertCircle, Clock, MapPin } from "lucide-react"

interface AppointmentCollisionAlertProps {
  conflict: {
    type: "DOCTOR" | "BOX"
    patientName: string
    startTime: string
    endTime: string
    box?: string
    doctorName?: string
  } | null
}

export const AppointmentCollisionAlert: React.FC<AppointmentCollisionAlertProps> = ({
  conflict,
}) => {
  if (!conflict) return null

  return (
    <div 
      className="flex items-start gap-3.5 p-4 rounded-2xl border border-sky-300/80 dark:border-sky-500/30 bg-sky-100/80 dark:bg-sky-950/30 shadow-xs animate-in fade-in duration-200"
      style={{
        backgroundColor: "var(--collision-bg, rgba(0, 139, 205, 0.14))",
      }}
    >
      {/* Icono con contenedor blanco en claro y tintado en oscuro */}
      <div className="p-2 rounded-xl bg-white/90 dark:bg-sky-500/20 border border-sky-300 dark:border-sky-500/40 text-[var(--doctor-accent,#008bcd)] shrink-0 mt-0.5 shadow-2xs">
        <AlertCircle className="w-4 h-4 stroke-[2.5]" />
      </div>
      
      <div className="space-y-1.5 text-left min-w-0 flex-1">
        {/* Encabezado y Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black text-slate-900 dark:text-foreground tracking-tight text-xs">
            Aviso de Horario Asignado
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-[#008bcd]/20 text-[#008bcd] border border-[#008bcd]/30">
            {conflict.type === "DOCTOR" ? "Doctor Ocupado" : "Sillón en Uso"}
          </span>
        </div>

        {/* Detalle descriptivo */}
        <p className="text-[11px] text-slate-700 dark:text-muted-foreground leading-relaxed font-medium">
          {conflict.type === "DOCTOR" ? (
            <>
              El especialista ya tiene una cita activa con{" "}
              <strong className="text-slate-950 dark:text-foreground font-black">{conflict.patientName}</strong>.
            </>
          ) : (
            <>
              El <strong className="text-slate-950 dark:text-foreground font-black">{conflict.box}</strong> ya está reservado por{" "}
              <strong className="text-slate-950 dark:text-foreground font-black">{conflict.patientName}</strong>.
            </>
          )}
        </p>

        {/* Metadatos de Horario y Sillón */}
        <div className="flex items-center gap-3.5 pt-0.5 text-[11px] font-bold text-slate-800 dark:text-sky-300">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[var(--doctor-accent,#008bcd)]" />
            <span>{conflict.startTime} - {conflict.endTime}</span>
          </span>
          {conflict.box && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--doctor-accent,#008bcd)]" />
              <span>{conflict.box}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}