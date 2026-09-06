"use client"

import React, { useState } from "react"
import { Lock, Paperclip, FileText, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { EvolutionInput } from "@/types/treatments"

interface EvolutionModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  patient: any
  plan: any
  selectedItemToEvolve: any
  evolutionProgress: number
  evolutionNote: string
  setEvolutionNote: (note: string | ((prev: string) => string)) => void
  handleSaveEvolution: (data?: EvolutionInput) => void
  setIsTemplateModalOpen: (open: boolean) => void
}

export function EvolutionModal({
  isOpen,
  setIsOpen,
  patient,
  plan,
  selectedItemToEvolve,
  evolutionProgress,
  evolutionNote,
  setEvolutionNote,
  handleSaveEvolution,
  setIsTemplateModalOpen
}: EvolutionModalProps) {
  const { toast } = useToast()
  
  const [selectedDoctor, setSelectedDoctor] = useState(plan?.doctor?.name || "Dr. Asignado")
  const [isPrivateEvolution, setIsPrivateEvolution] = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [hasIncident, setHasIncident] = useState(false)
  const [hasAdverseEvent, setHasAdverseEvent] = useState(false)
  const [showError, setShowError] = useState(false)

  const onSubmit = () => {
    if (!evolutionNote.trim()) {
      setShowError(true)
      toast({
        title: "Campos incompletos",
        description: "Debes completar la Nota de Evolución.",
        variant: "destructive"
      })
      return
    }

    handleSaveEvolution({
      progress: evolutionProgress,
      note: evolutionNote,
      isPrivate: isPrivateEvolution,
      hasIncident,
      hasAdverseEvent,
      doctorId: selectedDoctor
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) setShowError(false)
      setIsOpen(open)
    }}>
      <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[88vh] bg-card text-card-foreground border border-border shadow-2xl rounded-2xl p-0 overflow-hidden font-sans">
        
        <DialogHeader className="p-5 border-b border-border bg-muted/30">
          <DialogTitle className="text-lg md:text-xl font-black uppercase text-foreground tracking-tight">
            EVOLUCIÓN PARA {patient?.firstName} {patient?.lastName}
          </DialogTitle>
          <DialogDescription className="text-xs font-semibold text-muted-foreground mt-0.5">
            Prestación seleccionada: <b className="text-[#008bcd] dark:text-blue-400">{selectedItemToEvolve?.procedureName || selectedItemToEvolve?.name}</b>
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto max-h-[calc(88vh-130px)]">
          <div className="md:col-span-7 space-y-4 flex flex-col">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
                Profesional a cargo <span className="text-red-500 font-extrabold">*</span>
              </Label>
              <select 
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full border border-border rounded-xl h-10 px-3 text-xs font-bold bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#008bcd]"
              >
                <option value={plan?.doctor?.name || "Dr. Asignado"}>
                  {plan?.doctor?.name || "Dr. Asignado"}
                </option>
              </select>
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
                  Nota de Evolución <span className="text-red-500 font-extrabold">*</span>
                </Label>
                
                <button 
                  type="button" 
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="text-xs font-bold text-[#008bcd] dark:text-blue-400 hover:underline flex items-center gap-1 bg-blue-500/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Usar plantilla
                </button>
              </div>

              <div className={`border rounded-xl overflow-hidden bg-background flex flex-col flex-1 shadow-xs transition-all ${
                showError && !evolutionNote.trim() 
                  ? "border-red-500 ring-2 ring-red-500/20" 
                  : "border-border focus-within:border-[#008bcd]"
              }`}>
                <div className="flex items-center gap-1 p-1 bg-muted/40 border-b border-border text-xs font-bold text-foreground">
                  <span className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded cursor-pointer">B</span>
                  <span className="w-6 h-6 flex items-center justify-center italic hover:bg-muted rounded cursor-pointer">I</span>
                  <span className="w-6 h-6 flex items-center justify-center underline hover:bg-muted rounded cursor-pointer">U</span>
                </div>
                <Textarea 
                  value={evolutionNote} 
                  onChange={(e) => {
                    setEvolutionNote(e.target.value)
                    if (e.target.value.trim()) setShowError(false)
                  }} 
                  className="min-h-[140px] border-none shadow-none focus-visible:ring-0 resize-none p-3 text-xs font-medium leading-relaxed bg-transparent text-foreground placeholder:text-muted-foreground" 
                  placeholder="Escriba los detalles clínicos del procedimiento efectuado (Requerido)..." 
                />
              </div>
              {showError && !evolutionNote.trim() && (
                <p className="text-[11px] font-bold text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Este campo es obligatorio para continuar.
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-5 space-y-4 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox id="private-evo-chk" checked={isPrivateEvolution} onCheckedChange={(c) => setIsPrivateEvolution(!!c)} />
                <label htmlFor="private-evo-chk" className="text-xs font-bold text-amber-700 dark:text-amber-400 cursor-pointer flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-500" /> Esta evolución es privada
                </label>
              </div>
              <p className="text-[10px] text-amber-800/80 dark:text-amber-400 font-medium pl-6">
                (Opcional) Sólo podrá ser leída por el profesional emisor.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Archivos Adjuntos <span className="text-muted-foreground font-normal text-[11px]">(Opcional)</span>
              </Label>
              <label className="flex flex-col items-center justify-center gap-1.5 w-full p-4 border border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/40 transition-colors bg-background">
                <Paperclip className="w-4 h-4 text-[#008bcd]" />
                <span className="text-xs font-bold text-foreground text-center truncate max-w-[200px]">
                  {attachedFile ? attachedFile.name : "Adjuntar archivo"}
                </span>
                <span className="text-[10px] text-muted-foreground">PDF, JPG o PNG (máx 10MB)</span>
                <input type="file" className="hidden" onChange={(e) => setAttachedFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="space-y-3 border-t border-border pt-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">
                  ¿Ocurrió algún incidente? <span className="text-muted-foreground font-normal text-[10px]">(Opcional)</span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Checkbox id="inc-chk" checked={hasIncident} onCheckedChange={(c) => setHasIncident(!!c)} />
                  <label htmlFor="inc-chk" className="text-xs font-semibold text-foreground cursor-pointer">Sí, registrar incidente</label>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">
                  ¿Ocurrió algún evento adverso? <span className="text-muted-foreground font-normal text-[10px]">(Opcional)</span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Checkbox id="adv-chk" checked={hasAdverseEvent} onCheckedChange={(c) => setHasAdverseEvent(!!c)} />
                  <label htmlFor="adv-chk" className="text-xs font-semibold text-foreground cursor-pointer">Sí, registrar evento adverso</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-3.5 bg-muted/30 border-t border-border flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="font-bold border-border text-foreground hover:bg-muted">
            Cancelar
          </Button>
          <Button 
            size="sm" 
            onClick={onSubmit} 
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-extrabold px-6 rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            Evolucionar al {evolutionProgress}%
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}