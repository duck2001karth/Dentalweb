"use client"

import React from "react"
import { CalendarIcon, User, MoreVertical, Edit, Trash2, ImageIcon, ZoomIn } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { treatmentStatuses } from "@/constants/status"

interface EvolutionCardProps {
  note: any
  canEdit: boolean 
  canDelete: boolean 
  onEdit: (note: any) => void
  onDelete: (id: string) => void
  onPreviewImage: (url: string) => void
}



export function EvolutionCard({ note, canEdit, canDelete, onEdit, onDelete, onPreviewImage }: EvolutionCardProps) {
  const statusConfig = treatmentStatuses[note.status] || treatmentStatuses.IN_PROGRESS;
  const StatusIcon = statusConfig.icon;
  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group print:mb-6 print:break-inside-avoid print:block">
      
      {/* Ícono central */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-card bg-[#008bcd] text-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110 print:hidden">
        <CalendarIcon size={16} />
      </div>
      
      {/* Tarjeta */}
      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-background p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow print:w-full print:border-slate-300 print:shadow-none print:p-4 print:bg-white">
        
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-border pb-3 print:border-slate-200 print:pb-2 print:mb-3">
          <div className="flex flex-col print:flex-row print:justify-between print:w-full print:items-center">
            <h3 className="font-bold text-foreground text-sm print:text-[#008bcd] print:text-base">Evolución Clínica #{note.id.substring(0,4).toUpperCase()}</h3>
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-1 print:text-slate-600 print:mt-0">
              {format(new Date(note.createdAt), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
            </span>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusConfig.bg} ${statusConfig.color}`}>
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </div>
          {(canEdit || canDelete) && (
            <div className="print:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-full">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-card border-border">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit(note)} className="cursor-pointer font-medium hover:text-[#008bcd]">
                      <Edit className="w-4 h-4 mr-2" /> Editar
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem onClick={() => onDelete(note.id)} className="cursor-pointer font-medium text-red-500 hover:text-red-600 focus:text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-4 print:text-black font-medium">
          {note.content}
        </p>

        {note.fileUrl && (
          <div className="mb-4 print:break-inside-avoid">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-2 print:text-black"><ImageIcon className="w-3.5 h-3.5 print:hidden"/> Evidencia fotográfica:</div>
            <div 
              className="relative group/image inline-block cursor-pointer border border-border rounded-xl overflow-hidden bg-muted/20 print:border-none print:bg-transparent print:block"
              onClick={() => onPreviewImage(note.fileUrl)}
            >
              <img src={note.fileUrl} alt="Adjunto" className="max-h-32 w-auto object-cover transition-opacity group-hover/image:opacity-70 print:max-h-48 print:rounded-lg print:border print:border-slate-200" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity print:hidden">
                <div className="bg-black/60 p-2 rounded-full text-white backdrop-blur-sm">
                  <ZoomIn className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {(note.professionalSignature || note.patientSignature) && (
          <div className="mt-4 pt-4 border-t border-dashed border-border bg-muted/20 -mx-5 px-5 pb-2 rounded-b-2xl print:bg-transparent print:border-slate-200 print:mx-0 print:px-0 print:border-t-2 print:border-solid print:pt-4">
            <p className="text-xs font-bold text-muted-foreground mb-3 print:text-black">Firmas de Conformidad:</p>
            <div className="flex flex-wrap gap-6 print:gap-12">
              {note.professionalSignature && (
                <div className="flex flex-col items-center">
                  <img src={note.professionalSignature} alt="Firma Profesional" className="h-12 w-auto object-contain bg-white rounded border border-border px-2 print:border-none print:h-16" />
                  <span className="text-[10px] font-bold text-muted-foreground mt-1 print:text-slate-600 print:border-t print:border-slate-400 print:pt-1 print:w-32 print:justify-center">👨‍⚕️ Dr: {note.author?.name || "Especialista"}</span>
                </div>
              )}
              {note.patientSignature && (
                <div className="flex flex-col items-center">
                  <img src={note.patientSignature} alt="Firma Paciente" className="h-12 w-auto object-contain bg-white rounded border border-border px-2 print:border-none print:h-16" />
                  <span className="text-[10px] font-bold text-muted-foreground mt-1 print:text-slate-600 print:border-t print:border-slate-400 print:pt-1 print:w-32 print:justify-center">👥 Paciente</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground print:border-slate-200 print:text-slate-600">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 print:hidden" /> Atendido por: <span className="font-bold text-foreground print:text-black">{note.author?.name || "Dr. Asignado"}</span>
          </div>
        </div>

      </div>
    </div>
  )
}