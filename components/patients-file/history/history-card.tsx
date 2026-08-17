"use client"

import React from "react"
import { 
  CalendarIcon, User, MoreVertical, Edit, Trash2, 
  ImageIcon, ZoomIn, Check, CheckSquare, Pill, Clock, FileText 
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { treatmentStatuses, documentStatuses } from "@/constants/status"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

interface HistoryCardProps {
  note: any
  canEdit: boolean 
  canDelete: boolean 
  onEdit: (note: any) => void
  onDelete: (id: string) => void
  onAclarar: (id: string) => void
  onPreviewImage: (url: string) => void
}

export function HistoryCard({ 
  note, 
  canEdit, 
  canDelete, 
  onEdit, 
  onDelete, 
  onAclarar, 
  onPreviewImage 
}: HistoryCardProps) {
  const isEvolution = note.type === "EVOLUTION"
  const isPrescription = note.type === "PRESCRIPTION"
  
  const statusConfig = isEvolution 
    ? treatmentStatuses[note.status] || treatmentStatuses.IN_PROGRESS 
    : documentStatuses[note.status] || documentStatuses.COMPLETED

  const StatusIcon = statusConfig.icon
  const codeId = `#${note.id?.slice(-4).toUpperCase() || "REG"}`

  // Parsear contenido si viene como JSON estructurado (ej. recetas)
  const renderContent = () => {
    if (isPrescription) {
      try {
        const data = typeof note.content === "string" && note.content.startsWith("{") 
          ? JSON.parse(note.content) 
          : { medications: note.content }

        return (
          <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/70 text-xs">
            {data.medications && (
              <div>
                <p className="font-extrabold text-[10px] text-[#008bcd] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Pill className="w-3.5 h-3.5" /> Medicamentos (R.P.)
                </p>
                <div className="text-foreground leading-relaxed pl-1" dangerouslySetInnerHTML={{ __html: data.medications }} />
              </div>
            )}
            {data.indications && (
              <div className="pt-2.5 border-t border-border/50">
                <p className="font-extrabold text-[10px] text-[#008bcd] uppercase tracking-wider mb-1">
                  Indicaciones
                </p>
                <div className="text-foreground leading-relaxed pl-1" dangerouslySetInnerHTML={{ __html: data.indications }} />
              </div>
            )}
            {data.observations && (
              <div className="pt-2.5 border-t border-dashed border-border/60 bg-amber-500/5 -mx-4 px-4 pb-1 rounded-b-xl">
                <p className="font-extrabold text-[10px] text-amber-600 uppercase tracking-wider mb-0.5">
                  Observaciones / Cuidados
                </p>
                <div className="text-foreground text-[11px] leading-relaxed pl-1" dangerouslySetInnerHTML={{ __html: data.observations }} />
              </div>
            )}
          </div>
        )
      } catch {
        return <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
      }
    }

    return (
      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-normal">
        {note.content}
      </p>
    )
  }

  return (
    <div className="relative flex flex-col md:flex-row items-start mb-8 group">
      
      {/* Columna Fecha Timeline */}
      <div className="md:w-[110px] text-left md:text-right pr-6 pt-2 pb-1 pl-8 md:pl-0 font-bold text-muted-foreground text-xs uppercase tracking-wider">
        {format(new Date(note.createdAt), "MMM. dd, yyyy", { locale: es })}
      </div>

      {/* Punto Conector en la Línea */}
      <div className="absolute left-0 md:left-[116px] top-3 w-4 h-4 rounded-full bg-card border-2 border-[#008bcd] z-10 group-hover:scale-125 transition-transform" />
      
      {/* Tarjeta Principal */}
      <div className="ml-8 md:ml-10 flex-1 w-full">
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden hover:border-[#008bcd]/40 hover:shadow-md transition-all">
          
          {/* Cabecera Tarjeta */}
          <div className="bg-muted/15 border-b border-border/70 px-5 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#008bcd]/10 flex items-center justify-center text-[#008bcd] font-bold text-xs">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-foreground">{note.author?.name || "Profesional Asignado"}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
              <Clock className="w-3 h-3" />
              <span>{format(new Date(note.createdAt), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</span>
            </div>
          </div>
          
          {/* Contenido */}
          <div className="p-5">
            <div className="flex justify-between items-start mb-3 gap-3">
              <div className="flex items-center gap-2">
                {isEvolution ? (
                  <FileText className="w-4 h-4 text-[#008bcd]" />
                ) : isPrescription ? (
                  <Pill className="w-4 h-4 text-purple-600" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-teal-600" />
                )}
                <h4 className="text-sm font-bold text-foreground">
                  {isEvolution && `Evolución Clínica `}
                  {isPrescription && `Receta Médica `}
                  {!isEvolution && !isPrescription && `Documento / Rx `}
                  <span className="font-mono text-[#008bcd]">{codeId}</span>
                </h4>
              </div>
              
              <div className="flex items-center gap-2.5">
                {/* Botón Aclarar (Solo Evoluciones) */}
                {isEvolution && !note.isSigned && canEdit && (
                  <button 
                    onClick={() => onAclarar(note.id)} 
                    className="text-[11px] font-semibold text-muted-foreground hover:text-emerald-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    Aclarar <CheckSquare className="w-3.5 h-3.5" />
                  </button>
                )}
                {isEvolution && note.isSigned && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Aclarada
                  </span>
                )}

                {/* Badge de Estado */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusConfig.bg} ${statusConfig.color}`}>
                  <StatusIcon className="w-3 h-3 shrink-0" />
                  {statusConfig.label}
                </span>

                {/* Menú de Acciones */}
                {(canEdit || canDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 rounded-xl font-sans">
                      {canEdit && (
                        <DropdownMenuItem onClick={() => onEdit(note)} className="cursor-pointer text-xs font-semibold py-2">
                          <Edit className="w-3.5 h-3.5 mr-2 text-amber-500" /> Editar
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem onClick={() => onDelete(note.id)} className="cursor-pointer text-xs font-semibold text-red-600 focus:text-red-600 py-2">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Texto Clínico o Receta Parseada */}
            <div className="mb-3">
              {renderContent()}
            </div>

            {/* Archivo o Foto Adjunta */}
            {note.fileUrl && (
              <div className="my-3">
                <div 
                  className="group/image relative inline-block cursor-pointer border border-border/80 rounded-xl overflow-hidden bg-muted/20"
                  onClick={() => onPreviewImage(note.fileUrl)}
                >
                  <img src={note.fileUrl} alt="Adjunto Clínico" className="max-h-36 w-auto object-cover group-hover/image:scale-105 transition-transform" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 bg-black/40 backdrop-blur-xs transition-opacity">
                    <ZoomIn className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Firmas Digitales con Contenedor Claro Seguro */}
            {(note.professionalSignature || note.patientSignature) && (
              <div className="mt-4 pt-3 border-t border-dashed border-border/70 flex flex-wrap gap-4">
                {note.professionalSignature && (
                  <div className="flex flex-col items-center">
                    <div className="bg-white rounded-lg p-1.5 border border-slate-200 shadow-2xs">
                      <img src={note.professionalSignature} alt="Firma Profesional" className="h-9 object-contain" />
                    </div>
                    <span className="text-[10px] font-bold text-foreground mt-1">👨‍⚕️ Dr(a). {note.author?.name || "Profesional"}</span>
                  </div>
                )}
                {note.patientSignature && (
                  <div className="flex flex-col items-center">
                    <div className="bg-white rounded-lg p-1.5 border border-slate-200 shadow-2xs">
                      <img src={note.patientSignature} alt="Firma Paciente" className="h-9 object-contain" />
                    </div>
                    <span className="text-[10px] font-bold text-foreground mt-1">👥 Paciente / Tutor</span>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  )
}