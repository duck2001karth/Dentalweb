"use client"
import React from "react"
import { ChevronLeft, X, History, Stethoscope, CheckCircle, PlusCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { odontogramStatuses } from "@/constants/status"

const getOdontogramType = (val: string) => ["CARIES", "REST_MALA", "REST_BUENA"].includes(val) ? "surfaces" : "tooth"

const LESION_KEYS = ["CARIES", "FRACTURA", "ENDO_INDICADA", "REST_MALA", "EXT_INDICADA", "SELLANTE_MALO"]
const PREEXISTENCE_KEYS = ["REST_BUENA", "CORONA_BUENA", "ENDO_REALIZADA", "EXT_REALIZADA", "SELLANTE_BUENO"]

export const LESION_OPTIONS = LESION_KEYS.map(val => ({ value: val, label: odontogramStatuses[val].label, type: getOdontogramType(val), Icon: odontogramStatuses[val].icon }))
export const PREEXISTENCE_OPTIONS = PREEXISTENCE_KEYS.map(val => ({ value: val, label: odontogramStatuses[val].label, type: getOdontogramType(val), Icon: odontogramStatuses[val].icon }))
export const HEALTHY_OPTION = { label: "Diente sano", value: "DIENTE_SANO", type: "tooth", Icon: () => <span>✓</span> }

export function OdontogramActionMenu({
  menuStep, setMenuStep, selectedTooth, currentSurfaces, handleCloseMenu, planId, 
  setIsCatalogModalOpen, selectedStatus, setSelectedStatus, recordComment, 
  setRecordComment, handleSaveRecord, isSaving
}: any) {
  if (menuStep === "NONE") return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card text-card-foreground w-[90%] max-w-[500px] rounded-[24px] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-900 dark:bg-slate-950 px-7 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            {menuStep !== "OPTIONS" && (
                <Button variant="ghost" size="icon" onClick={() => setMenuStep("OPTIONS")} className="h-9 w-9 text-white hover:bg-white/20 rounded-full"><ChevronLeft className="w-5 h-5"/></Button>
            )}
            <div>
              <h3 className="font-bold text-xl leading-tight">
                {menuStep === "OPTIONS" ? "Opciones de Pieza" : menuStep === "LESIONS" ? "Definir lesión" : menuStep === "PREEXISTENCES" ? "Agregar preexistencia" : "Detalle"}
              </h3>
              <p className="text-xs opacity-80 font-medium tracking-wide uppercase mt-0.5">PIEZA {selectedTooth} {currentSurfaces.length > 0 && currentSurfaces[0] !== "TODA_LA_PIEZA" ? `• CARAS: ${currentSurfaces.join(", ")}` : ""}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCloseMenu} className="h-9 w-9 text-white hover:bg-white/20 rounded-full"><X className="w-5 h-5"/></Button>
        </div>

        {menuStep === "OPTIONS" && (
          <div className="flex flex-col bg-card">
            <button onClick={() => setMenuStep("PREEXISTENCES")} className="flex items-center gap-5 px-7 py-5 hover:bg-accent transition-colors text-left border-b border-border">
              <div className="bg-blue-50 dark:bg-blue-900/30 text-[#008bcd] p-3 rounded-full"><History className="w-6 h-6" /></div>
              <div>
                <p className="font-bold text-foreground text-base">Agregar preexistencia</p>
                <p className="text-xs text-muted-foreground mt-1">Restauraciones o tratamientos previos</p>
              </div>
            </button>
            
            <button onClick={() => setMenuStep("LESIONS")} className="flex items-center gap-5 px-7 py-5 hover:bg-accent transition-colors text-left border-b border-border">
              <div className="bg-red-50 dark:bg-red-900/30 text-red-500 p-3 rounded-full"><Stethoscope className="w-6 h-6" /></div>
              <div>
                <p className="font-bold text-foreground text-base">Definir lesión</p>
                <p className="text-xs text-muted-foreground mt-1">Caries, fracturas o patologías actuales</p>
              </div>
            </button>

            {planId && (
              <button onClick={() => { setMenuStep("NONE"); setIsCatalogModalOpen(true); }} className="flex items-center gap-5 px-7 py-5 hover:bg-accent transition-colors text-left border-b border-border">
                <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 p-3 rounded-full"><PlusCircle className="w-6 h-6" /></div>
                <div>
                  <p className="font-bold text-foreground text-base">Agregar prestación</p>
                  <p className="text-xs text-muted-foreground mt-1">Agrega un tratamiento al presupuesto</p>
                </div>
              </button>
            )}

            <button onClick={() => { setSelectedStatus(HEALTHY_OPTION); setRecordComment(""); setMenuStep("SAVE_FORM"); }} className="flex items-center gap-5 px-7 py-5 hover:bg-accent transition-colors text-left">
              <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-3 rounded-full"><CheckCircle className="w-6 h-6" /></div>
              <div>
                <p className="font-bold text-foreground text-base">Diente sano</p>
                <p className="text-xs text-muted-foreground mt-1">Limpia marcas previas e ingresa comentarios</p>
              </div>
            </button>
          </div>
        )}

        {(menuStep === "LESIONS" || menuStep === "PREEXISTENCES") && (
          <div className="grid grid-cols-3 gap-4 p-7 bg-card">
            {(menuStep === "LESIONS" ? LESION_OPTIONS : PREEXISTENCE_OPTIONS).map((opt) => (
              <button key={opt.value} onClick={() => { setSelectedStatus(opt); setMenuStep("SAVE_FORM"); }} className="flex flex-col items-center justify-center gap-3 py-5 px-2 rounded-2xl hover:bg-accent transition-colors text-center border border-transparent hover:border-border">
                <div className="text-4xl"><opt.Icon /></div>
                <span className="text-xs font-semibold text-muted-foreground leading-tight px-1">{opt.label}</span>
              </button>
            ))}
          </div>
        )}

        {menuStep === "SAVE_FORM" && selectedStatus && (
          <div className="p-7 space-y-6 bg-card">
            <div className="flex items-center gap-4">
              <div className="text-4xl"><selectedStatus.Icon /></div>
              <div>
                <h4 className="font-bold text-xl text-foreground">
                  Comentario para: <span className="text-[#008bcd]">{selectedStatus.label}</span>
                </h4>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Ingrese un comentario (opcional):</Label>
              <Textarea 
                value={recordComment} onChange={(e) => setRecordComment(e.target.value)} 
                placeholder="Detalles clínicos o notas opcionales..." 
                className="bg-background border-border resize-none text-base p-4 rounded-xl focus-visible:ring-[#008bcd]" 
                rows={4} autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setMenuStep("OPTIONS")} className="font-bold h-11 px-6 rounded-xl border-border">Cerrar</Button>
              <Button onClick={handleSaveRecord} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 rounded-xl shadow-sm">
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : null} Guardar simbología
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}