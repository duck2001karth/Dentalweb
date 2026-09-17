"use client"

import React from "react"
import { 
  Plus, ChevronDown, Printer, Trash2, 
  Stethoscope, ArrowRightLeft, Layers, Grid, FileText, Activity 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface TreatmentActionsProps {
  onOpenSectionModal?: () => void
  onOpenCatalogModal?: () => void
  onOpenDiagnosis?: () => void
  selectedCount?: number
  sections?: any[]
  isMoving?: boolean
  onMoveToSection?: (sectionId: string | null, sectionName: string) => void
  onTriggerPrint?: (mode: "COMPLETO" | "SOLO_TOTAL" | "SIN_DETALLE" | "LABORATORIO") => void
  onTrashClick?: () => void
  onAssignRegion?: (regionName: string) => void
}

export function TreatmentActions({ 
  onOpenSectionModal,
  onOpenCatalogModal,
  onOpenDiagnosis,
  selectedCount = 0,
  sections = [],
  isMoving = false,
  onMoveToSection,
  onTriggerPrint,
  onTrashClick,
  onAssignRegion
}: TreatmentActionsProps) {
  return (
    <div className="p-4 border-b border-border/80 flex flex-wrap gap-2 items-center justify-between bg-muted/20">
      {/* GRUPO IZQUIERDO: SECCIÓN, PRESTACIÓN Y ACCIONES */}
      <div className="flex items-center gap-2">
        {onOpenSectionModal && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenSectionModal} 
            className="text-[#008bcd] border-[#008bcd]/50 hover:bg-[#008bcd]/10 font-bold rounded-xl h-9 text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1 stroke-[2.5]"/> Sección
          </Button>
        )}
        
        {onOpenCatalogModal && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenCatalogModal} 
            className="text-emerald-600 dark:text-emerald-400 border-emerald-600/50 hover:bg-emerald-500/10 font-bold rounded-xl h-9 text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1 stroke-[2.5]"/> Prestación
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3.5 border-border/80 bg-background text-foreground hover:bg-muted font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
            >
              Acciones <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-card text-card-foreground border border-border/80 shadow-xl rounded-xl text-xs font-semibold p-1">
            {onOpenDiagnosis && (
              <DropdownMenuItem 
                onClick={onOpenDiagnosis}
                className="font-bold cursor-pointer py-2 rounded-lg flex items-center gap-2"
              >
                <Stethoscope className="w-4 h-4 text-[#008bcd]" /> Ingresar Diagnóstico
              </DropdownMenuItem>
            )}

            {sections.length > 0 && onMoveToSection && (
              <>
                <DropdownMenuSeparator className="my-1 border-border/60" />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger 
                    disabled={selectedCount === 0 || isMoving}
                    className="cursor-pointer py-2 font-bold flex items-center gap-2 rounded-lg"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-[#008bcd]" />
                    <span>Mover a Fase ({selectedCount})</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-52 bg-card text-card-foreground border border-border/80 shadow-xl rounded-xl text-xs font-semibold p-1">
                      <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase px-2 py-1">
                        Fase Destino
                      </DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => onMoveToSection(null, "Sin Fase")} 
                        className="cursor-pointer py-2 font-medium rounded-lg"
                      >
                        Generales (Sin Fase)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1 border-border/60" />
                      {sections.map((sec: any) => (
                        <DropdownMenuItem 
                          key={sec.id} 
                          onClick={() => onMoveToSection(sec.id, sec.name)} 
                          className="cursor-pointer py-2 font-bold flex items-center gap-2 rounded-lg"
                        >
                          <Layers className="w-3.5 h-3.5 text-[#008bcd]" />
                          <span className="truncate">{sec.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* GRUPO DERECHO: IMPRESORA, PAPELERA Y ARCADAS */}
      <div className="flex items-center gap-2">
        {onTriggerPrint && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Opciones de Impresión" 
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border/80 shadow-xl rounded-xl text-xs font-semibold">
              <DropdownMenuItem onClick={() => onTriggerPrint("COMPLETO")} className="cursor-pointer py-2">
                <FileText className="w-4 h-4 mr-2 text-[#008bcd]" /> Presupuesto completo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTriggerPrint("SOLO_TOTAL")} className="cursor-pointer py-2">
                <FileText className="w-4 h-4 mr-2 text-muted-foreground" /> Presupuesto sólo total
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTriggerPrint("SIN_DETALLE")} className="cursor-pointer py-2">
                <FileText className="w-4 h-4 mr-2 text-muted-foreground" /> Presupuesto sin detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTriggerPrint("LABORATORIO")} className="cursor-pointer py-2 border-t border-border/60">
                <Activity className="w-4 h-4 mr-2 text-amber-500" /> Orden de laboratorio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onTrashClick && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onTrashClick}
            title={selectedCount > 0 ? `Eliminar (${selectedCount}) seleccionados` : "Vaciar presupuesto"} 
            className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-xl cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}

        {onAssignRegion && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-xs font-bold text-[#008bcd] hover:underline flex items-center gap-1.5 ml-2 focus:outline-none cursor-pointer">
                <Grid className="w-4 h-4" /> Arcadas y Sextantes <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border/80 shadow-xl rounded-xl text-xs font-semibold">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Arcadas Dentales</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onAssignRegion("Arcada Superior")} className="font-bold cursor-pointer">
                Arcada Superior
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAssignRegion("Arcada Inferior")} className="font-bold cursor-pointer">
                Arcada Inferior
              </DropdownMenuItem>
              
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground border-t border-border/60 mt-1 pt-2">Sextantes</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onAssignRegion("Sextante 1 (18-14)")} className="cursor-pointer">Sextante 1 (18 a 14)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAssignRegion("Sextante 2 (13-23)")} className="cursor-pointer">Sextante 2 (13 a 23)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAssignRegion("Sextante 3 (24-28)")} className="cursor-pointer">Sextante 3 (24 a 28)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAssignRegion("Sextante 4 (38-34)")} className="cursor-pointer">Sextante 4 (38 a 34)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAssignRegion("Sextante 5 (33-43)")} className="cursor-pointer">Sextante 5 (33 a 43)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAssignRegion("Sextante 6 (44-48)")} className="cursor-pointer">Sextante 6 (44 a 48)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export default TreatmentActions