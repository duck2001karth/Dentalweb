"use client"

import React from "react"
import { CalendarIcon, User, MoreVertical, Edit, Trash2, ImageIcon, ZoomIn, CheckSquare, Check, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface HistoryCardProps {
  note: any
  canEdit: boolean 
  canDelete: boolean 
  onEdit: (note: any) => void
  onDelete: (id: string) => void
  onAclarar: (id: string) => void
  onPreviewImage: (url: string) => void
}

export function HistoryCard({ note, canEdit, canDelete, onEdit, onDelete, onAclarar, onPreviewImage }: HistoryCardProps) {
  const isEvolution = note.type === "EVOLUTION"
  const isPrescription = note.type === "PRESCRIPTION"

  return (
    <div className="relative flex flex-col md:flex-row items-start mb-10 group">
      {/* Fecha Izquierda */}
      <div className="md:w-[100px] text-left md:text-right pr-6 pt-2 pb-2 pl-8 md:pl-0 font-bold text-muted-foreground text-sm capitalize">
        {format(new Date(note.createdAt), "MMM. dd, yyyy", { locale: es })}
      </div>
      
      {/* Punto de la línea de tiempo */}
      <div className="absolute left-0 md:left-[116px] top-3 w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 border-4 border-background z-10 group-hover:bg-[#008bcd] transition-colors"></div>
      
      {/* Tarjeta de Contenido */}
      <div className="ml-8 md:ml-12 flex-1 w-full">
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          
          <div className="bg-muted/30 border-b border-border px-5 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex items-center gap-2 text-[#008bcd] dark:text-blue-400">
              <User className="w-4 h-4" />
              <span className="text-sm font-semibold">{note.author?.name || "Dr. (a) Asignado"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CalendarIcon className="w-4 h-4" />
              <span>Escrita el {format(new Date(note.createdAt), "d 'de' MMMM 'de' yyyy HH:mm", { locale: es })}</span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-base font-bold text-foreground">
                {isEvolution ? `Plan de tratamiento #${note.id.substring(0,4).toUpperCase()}:` : 
                 isPrescription ? `Receta Médica #${note.id.substring(0,4).toUpperCase()}:` : 
                 `Documento Adjunto:`}
              </h4>
              
              <div className="flex items-center gap-3">
                {/* BOTÓN ACLARAR: Solo Doctor o Admin */}
                {isEvolution && !note.isSigned && canEdit && (
                  <button onClick={() => onAclarar(note.id)} className="text-xs font-semibold text-muted-foreground hover:text-emerald-500 flex items-center gap-1.5 transition-colors">
                    Marcar como aclarada <CheckSquare className="w-4 h-4" />
                  </button>
                )}
                {isEvolution && note.isSigned && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Aclarada
                 </span>
                )}
                
                {/* MENÚ DE ACCIONES: Doctor puede Editar, Admin puede Editar y Eliminar */}
                {(canEdit || canDelete) && (
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
                )}
              </div>
            </div>
            
            {note.fileUrl && (
              <div className="mb-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-2"><ImageIcon className="w-3.5 h-3.5"/> Archivo adjunto:</div>
                <div 
                  className="relative group/image inline-block cursor-pointer border border-border rounded-md overflow-hidden bg-muted/20"
                  onClick={() => onPreviewImage(note.fileUrl)}
                >
                  <img src={note.fileUrl} alt="Adjunto" className="max-h-32 w-auto object-cover transition-opacity group-hover/image:opacity-70" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                    <div className="bg-black/60 p-2 rounded-full text-white backdrop-blur-sm">
                      <ZoomIn className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(note.professionalSignature || note.patientSignature) && (
              <div className="mt-4 pt-4 border-t border-dashed border-border bg-muted/20 -mx-5 px-5 pb-2 rounded-b-xl">
                <p className="text-xs font-bold text-muted-foreground mb-3">Firmas del Procedimiento:</p>
                <div className="flex flex-wrap gap-6">
                  {note.professionalSignature && (
                    <div className="flex flex-col items-center">
                      <img src={note.professionalSignature} alt="Firma Profesional" className="h-12 w-auto object-contain bg-white rounded border border-border px-1" />
                      <span className="text-[10px] font-medium text-muted-foreground mt-1 flex items-center gap-1"><X className="w-3 h-3"/> Prof: {note.author?.name || "Dr."}</span>
                    </div>
                  )}
                  {note.patientSignature && (
                    <div className="flex flex-col items-center">
                      <img src={note.patientSignature} alt="Firma Paciente" className="h-12 w-auto object-contain bg-white rounded border border-border px-1" />
                      <span className="text-[10px] font-medium text-muted-foreground mt-1 flex items-center gap-1"><X className="w-3 h-3"/> Paciente</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pl-1 font-medium">
              {note.content}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}