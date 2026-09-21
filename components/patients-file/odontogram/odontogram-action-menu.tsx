"use client"
import React from "react"
import { ChevronLeft, X, History, Stethoscope, CheckCircle, PlusCircle, Loader2, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { odontogramStatuses } from "@/constants/status"

const LOCAL_STATUSES: Record<string, { label: string, icon: any }> = {
  ...(odontogramStatuses || {}),
  CARIES_RECURRENTE: { label: "Caries Recurrente", icon: () => <div className="w-4 h-4 rounded-full bg-[#008bcd] border-2 border-red-500" /> },
  INC_MALA: { label: "Incrustación (Mala)", icon: () => <span className="font-bold text-red-500 text-[10px]">INC</span> },
  INC_BUENA: { label: "Incrustación (Buena)", icon: () => <span className="font-bold text-[#008bcd] text-[10px]">INC</span> },
  PARA_CORONA: { label: "Diente para Corona", icon: () => <span className="font-bold text-red-500 text-lg">C</span> },
  AUSENTE: { label: "Diente Ausente", icon: () => <div className="w-5 h-1 bg-[#008bcd]" /> },
  PERDIDO: { label: "Diente Perdido", icon: () => <div className="w-1 h-5 bg-[#008bcd]" /> },
  PROTESIS_FIJA_BUENA: { label: "P. Fija (Buena)", icon: () => <span className="font-bold text-[#008bcd] text-[10px]">O-O</span> },
  PROTESIS_FIJA_MALA: { label: "P. Fija (Mala)", icon: () => <span className="font-bold text-red-500 text-[10px]">O-O</span> },
  PROTESIS_REM_BUENA: { label: "P. Removible (Buena)", icon: () => <span className="font-bold text-[#008bcd] text-sm">==</span> },
  PROTESIS_REM_MALA: { label: "P. Removible (Mala)", icon: () => <span className="font-bold text-red-500 text-sm">==</span> },
  IMPLANTE_BUENO: { label: "Implante (Bueno)", icon: () => <ArrowUp className="w-5 h-5 text-[#008bcd]" /> },
  IMPLANTE_MALO: { label: "Implante (Malo)", icon: () => <ArrowUp className="w-5 h-5 text-red-500" /> },
}

const safeGetStatus = (val: string) => LOCAL_STATUSES[val] || { label: val, icon: () => <span className="text-xs">{val}</span> }

const getOdontogramType = (val: string) => 
  ["CARIES", "REST_MALA", "REST_BUENA", "CARIES_RECURRENTE", "INC_MALA", "INC_BUENA", "FRACTURA"].includes(val) 
    ? "surfaces" 
    : "tooth"

const LESION_KEYS = [
  "CARIES", "CARIES_RECURRENTE", "FRACTURA", "ENDO_INDICADA", "REST_MALA", 
  "EXT_INDICADA", "SELLANTE_MALO", "CORONA_MALA", "INC_MALA", 
  "PROTESIS_FIJA_MALA", "PROTESIS_REM_MALA", "IMPLANTE_MALO", "PARA_CORONA"
]

const PREEXISTENCE_KEYS = [
  "REST_BUENA", "CORONA_BUENA", "INC_BUENA", "ENDO_REALIZADA", 
  "EXT_REALIZADA", "AUSENTE", "PERDIDO", "SELLANTE_BUENO", 
  "PROTESIS_FIJA_BUENA", "PROTESIS_REM_BUENA", "IMPLANTE_BUENO"
]

export const LESION_OPTIONS = LESION_KEYS.map(val => ({ 
  value: val, 
  label: safeGetStatus(val).label, 
  type: getOdontogramType(val), 
  Icon: safeGetStatus(val).icon 
}))

export const PREEXISTENCE_OPTIONS = PREEXISTENCE_KEYS.map(val => ({ 
  value: val, 
  label: safeGetStatus(val).label, 
  type: getOdontogramType(val), 
  Icon: safeGetStatus(val).icon 
}))

export const HEALTHY_OPTION = { 
  label: "Diente sano", 
  value: "DIENTE_SANO", 
  type: "tooth", 
  Icon: () => <span>🦷</span> 
}

export function OdontogramActionMenu({
  menuStep, setMenuStep, selectedTooth, currentSurfaces, handleCloseMenu, planId, 
  setIsCatalogModalOpen, selectedStatus, setSelectedStatus, recordComment, 
  setRecordComment, handleSaveRecord, isSaving 
}: any) {
  if (menuStep === "NONE") return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card text-card-foreground w-[90%] max-w-[600px] max-h-[85vh] rounded-[24px] shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-[#0b0f19] dark:bg-slate-950 px-7 py-5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-4">
            {menuStep !== "OPTIONS" && (
                <Button variant="ghost" size="icon" onClick={() => setMenuStep("OPTIONS")} className="h-9 w-9 text-white hover:bg-white/20 rounded-full"><ChevronLeft className="w-5 h-5"/></Button>
            )}
            <div>
              <h3 className="font-bold text-xl leading-tight">
                {menuStep === "OPTIONS" ? "Opciones de Pieza" : menuStep === "LESIONS" ? "Definir lesión / patología" : menuStep === "PREEXISTENCES" ? "Agregar preexistencia" : "Detalle de Registro"}
              </h3>
              <p className="text-xs opacity-80 font-medium tracking-wide uppercase mt-0.5">PIEZA {selectedTooth} {currentSurfaces.length > 0 && currentSurfaces[0] !== "TODA_LA_PIEZA" ? ` | CARAS: ${currentSurfaces.join(", ")}` : ""}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCloseMenu} className="h-9 w-9 text-white hover:bg-white/20 rounded-full"><X className="w-5 h-5"/></Button>
        </div>

        <div className="overflow-y-auto custom-scrollbar">
          {menuStep === "OPTIONS" && (
            <div className="flex flex-col bg-card">
              <button onClick={() => setMenuStep("PREEXISTENCES")} className="flex items-center gap-5 px-7 py-5 hover:bg-accent transition-colors text-left border-b border-border">
                <div className="bg-blue-50 dark:bg-blue-900/30 text-[#008bcd] p-3 rounded-full"><History className="w-6 h-6" /></div>
                <div>
                  <p className="font-bold text-foreground text-base">Agregar preexistencia (Azul)</p>
                  <p className="text-xs text-muted-foreground mt-1">Restauraciones, sellantes en buen estado, o dientes ausentes.</p>
                </div>
              </button>
              
              <button onClick={() => setMenuStep("LESIONS")} className="flex items-center gap-5 px-7 py-5 hover:bg-accent transition-colors text-left border-b border-border">
                <div className="bg-red-50 dark:bg-red-900/30 text-red-500 p-3 rounded-full"><Stethoscope className="w-6 h-6" /></div>
                <div>
                  <p className="font-bold text-foreground text-base">Definir lesión (Rojo)</p>
                  <p className="text-xs text-muted-foreground mt-1">Caries, fracturas, patologías actuales o tratamientos necesarios.</p>
                </div>
              </button>

              {planId && (
                <button onClick={() => { setMenuStep("NONE"); setIsCatalogModalOpen(true); }} className="flex items-center gap-5 px-7 py-5 hover:bg-accent transition-colors text-left border-b border-border">
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 p-3 rounded-full"><PlusCircle className="w-6 h-6" /></div>
                  <div>
                    <p className="font-bold text-foreground text-base">Agregar prestación clínica</p>
                    <p className="text-xs text-muted-foreground mt-1">Cotizar e incorporar un tratamiento al presupuesto actual.</p>
                  </div>
                </button>
              )}

              <button onClick={() => { setSelectedStatus(HEALTHY_OPTION); setRecordComment(""); setMenuStep("SAVE_FORM"); }} className="flex items-center gap-5 px-7 py-5 hover:bg-accent transition-colors text-left">
                <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-3 rounded-full"><CheckCircle className="w-6 h-6" /></div>
                <div>
                  <p className="font-bold text-foreground text-base">Diente sano / Limpiar</p>
                  <p className="text-xs text-muted-foreground mt-1">Elimina las marcas previas y reestablece el diente a sano.</p>
                </div>
              </button>
            </div>
          )}

          {(menuStep === "LESIONS" || menuStep === "PREEXISTENCES") && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-6 bg-card">
              {(menuStep === "LESIONS" ? LESION_OPTIONS : PREEXISTENCE_OPTIONS).map((opt) => (
                <button key={opt.value} onClick={() => { setSelectedStatus(opt); setMenuStep("SAVE_FORM"); }} className="flex flex-col items-center justify-start gap-3 py-4 px-2 rounded-2xl hover:bg-accent transition-colors text-center border border-border hover:border-[#008bcd] shadow-2xs group">
                  <div className="text-3xl flex items-center justify-center h-10 w-10 group-hover:scale-110 transition-transform"><opt.Icon /></div>
                  <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground leading-tight px-1">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {menuStep === "SAVE_FORM" && selectedStatus && (
            <div className="p-7 space-y-6 bg-card">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/20">
                <div className="text-4xl"><selectedStatus.Icon /></div>
                <div>
                  <h4 className="font-bold text-lg text-foreground">
                    Asignando: <span className="text-[#008bcd] uppercase">{selectedStatus.label}</span>
                  </h4>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Ingrese un comentario (opcional):</Label>
                <Textarea 
                  value={recordComment} onChange={(e) => setRecordComment(e.target.value)}
                  placeholder="Detalles clínicos o notas opcionales sobre el diagnóstico..."
                  className="bg-background border-border resize-none text-sm p-4 rounded-xl focus-visible:ring-[#008bcd]"
                  rows={4} autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setMenuStep("OPTIONS")} className="font-bold h-11 px-6 rounded-xl border-border">Atrás</Button>
                <Button onClick={handleSaveRecord} disabled={isSaving} className="bg-primary hover:bg-[#0070a8] text-white font-bold h-11 px-6 rounded-xl shadow-sm">
                  {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : null} Guardar Simbología
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}