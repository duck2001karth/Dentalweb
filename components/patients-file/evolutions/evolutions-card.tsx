"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  MoreVertical, Edit, Trash2, Calendar, 
  User, CheckCircle2, Activity, Clock, ShieldCheck 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { treatmentStatuses } from "@/constants/status"

interface EvolutionCardProps {
  note: any
  canEdit: boolean
  canDelete: boolean
  onEdit: (note: any) => void
  onDelete: (id: string) => void
  onPreviewImage: (url: string) => void
}

export function EvolutionCard({
  note,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onPreviewImage,
}: EvolutionCardProps) {
  const statusConfig = treatmentStatuses[note.status] || treatmentStatuses.IN_PROGRESS
  const StatusIcon = statusConfig.icon

  const formattedDate = note.createdAt 
    ? format(new Date(note.createdAt), "d 'de' MMMM yyyy, HH:mm", { locale: es })
    : "Sin fecha"

  const noteCode = `#${note.id?.slice(-4).toUpperCase() || "EVOL"}`

  return (
    <div className="relative flex items-start gap-4 md:gap-8 group">
      <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-2xl bg-card border-2 border-[#008bcd] text-[#008bcd] shadow-xs z-10 shrink-0">
        <Calendar className="w-4 h-4" />
      </div>
      <div className="flex-1 bg-card border border-border/80 rounded-2xl p-5 shadow-xs hover:border-[#008bcd]/40 transition-all">
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3.5 mb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground text-sm">
                Evolución Clínica <span className="text-[#008bcd] font-mono">{noteCode}</span>
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground/70" />
              {formattedDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* BADGE DE ESTADO PREMIUM */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${statusConfig.bg} ${statusConfig.color}`}>
              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
              {statusConfig.label}
            </span>

            {/* Menú de Acciones */}
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 rounded-xl font-sans">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit(note)} className="cursor-pointer text-xs font-semibold py-2">
                      <Edit className="mr-2 h-3.5 w-3.5 text-amber-500" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem onClick={() => onDelete(note.id)} className="cursor-pointer text-xs font-semibold text-red-600 focus:text-red-600 py-2">
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="text-foreground text-xs leading-relaxed whitespace-pre-wrap font-normal mb-4">
          {note.content}
        </div>
        {note.fileUrl && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => onPreviewImage(note.fileUrl)}
              className="group relative overflow-hidden rounded-xl border border-border/80 max-w-xs block cursor-pointer"
            >
              <img 
                src={note.fileUrl} 
                alt="Adjunto Clínico" 
                className="h-28 w-full object-cover group-hover:scale-105 transition-transform" 
              />
              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                Ver imagen
              </span>
            </button>
          </div>
        )}

        {/* Firmas de Conformidad */}
        {(note.professionalSignature || note.patientSignature) && (
          <div className="pt-3 border-t border-dashed border-border/70 mb-3.5">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
              Firmas de Conformidad:
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              
              {/* Firma Doctor */}
              <div className="p-2.5 rounded-xl border border-border/70 bg-muted/20 flex flex-col items-center">
                {note.professionalSignature ? (
                  <div className="bg-white rounded-lg p-1.5 w-full flex items-center justify-center border border-slate-200 shadow-2xs">
                    <img 
                      src={note.professionalSignature} 
                      alt="Firma Doctor" 
                      className="h-10 object-contain max-w-full" 
                    />
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic py-3">Pendiente doctor</span>
                )}
                <span className="text-[10px] font-bold text-foreground mt-1.5">
                  👨‍⚕️ Dr(a). {note.author?.name || "Profesional"}
                </span>
              </div>

              {/* Firma Paciente */}
              <div className="p-2.5 rounded-xl border border-border/70 bg-muted/20 flex flex-col items-center">
                {note.patientSignature ? (
                  <div className="bg-white rounded-lg p-1.5 w-full flex items-center justify-center border border-slate-200 shadow-2xs">
                    <img 
                      src={note.patientSignature} 
                      alt="Firma Paciente" 
                      className="h-10 object-contain max-w-full" 
                    />
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic py-3">Pendiente paciente</span>
                )}
                <span className="text-[10px] font-bold text-foreground mt-1.5">
                  👥 Paciente / Tutor
                </span>
              </div>

            </div>
          </div>
        )}

        {/* Pie de Tarjeta: Profesional a Cargo */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-2 border-t border-border/40">
          <User className="w-3.5 h-3.5 text-muted-foreground/70" />
          <span>Atendido por:</span>
          <b className="text-foreground">{note.author?.name || "Profesional Registrado"}</b>
        </div>

      </div>
    </div>
  )
}