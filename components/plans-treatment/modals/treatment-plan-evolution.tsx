"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Loader2, Paperclip, Lock, User } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

export default function EvolutionModal({
  isOpen,
  setIsOpen,
  patient,
  plan,
  selectedItemToEvolve,
  evolutionProgress,
  evolutionNote,
  setEvolutionNote,
  handleSaveEvolution,
}: any) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const [doctorId, setDoctorId] = useState<string>("")
  const [isPrivate, setIsPrivate] = useState<boolean>(false)
  const [hasIncident, setHasIncident] = useState<boolean>(false)
  const [hasAdverseEvent, setHasAdverseEvent] = useState<boolean>(false)
  
  const currentUserId = (session?.user as any)?.id

  useEffect(() => {
    if (isOpen) {
      setDoctorId(currentUserId || plan?.doctorId || "")
    }
  }, [isOpen, currentUserId, plan?.doctorId])

  const draftKey = selectedItemToEvolve?.id
    ? `carmo_draft_evo_${plan?.id || "plan"}_${selectedItemToEvolve.id}`
    : null

  useEffect(() => {
    if (isOpen && draftKey) {
      const savedDraft = localStorage.getItem(draftKey)
      setEvolutionNote((prev: string) => {
        if (!prev && savedDraft) return savedDraft
        return prev
      })
    }
  }, [isOpen, draftKey, setEvolutionNote])

  useEffect(() => {
    if (!isOpen || !draftKey) return
    const timer = setTimeout(() => {
      if (typeof evolutionNote === "string" && evolutionNote.trim() !== "") {
        localStorage.setItem(draftKey, evolutionNote)
      } else {
        localStorage.removeItem(draftKey)
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [evolutionNote, isOpen, draftKey])

  const onSave = async () => {
    if (!evolutionNote?.trim()) {
      toast({
        title: "Nota requerida",
        description: "Debe ingresar el detalle clínico de la evolución.",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      if (handleSaveEvolution) {
        await handleSaveEvolution({
          progress: evolutionProgress,
          note: evolutionNote,
          isPrivate,
          hasIncident,
          hasAdverseEvent,
          doctorId,
          fileUrl: null
        })
      }
      if (draftKey) {
        localStorage.removeItem(draftKey)
      }
      setIsPrivate(false)
      setHasIncident(false)
      setHasAdverseEvent(false)
    } finally {
      setIsSaving(false)
    }
  }

  const patientName = patient ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim().toUpperCase() : "PACIENTE"
  const procedureName = selectedItemToEvolve?.procedureName || selectedItemToEvolve?.name || "Prestación"

  const CustomToggle = ({ checked, onChange, label }: any) => (
    <div 
      className="flex items-center gap-2.5 cursor-pointer select-none group mt-1" 
      onClick={() => onChange(!checked)}
    >
      <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${
        checked ? 'border-[#008bcd] bg-transparent' : 'border-slate-400 dark:border-slate-500/50 group-hover:border-slate-500 dark:group-hover:border-slate-400'
      }`}>
        {checked && <div className="w-2 h-2 rounded-full bg-[#008bcd]" />}
      </div>
      <span className="text-sm font-bold text-foreground dark:text-slate-200">{label}</span>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && setIsOpen(false)}>
      <DialogContent className="sm:max-w-[850px] w-[95vw] bg-card dark:bg-[#121212] border-border dark:border-[#2a2a2a] text-foreground dark:text-slate-200 rounded-2xl p-0 overflow-hidden shadow-2xl font-sans flex flex-col max-h-[90vh]">
        
        <DialogHeader className="px-6 py-4 border-b border-border dark:border-[#2a2a2a] shrink-0">
          <DialogTitle className="text-xl font-black text-foreground dark:text-white tracking-tight uppercase">
            EVOLUCIÓN PARA {patientName}
          </DialogTitle>
          <div className="text-xs font-bold text-muted-foreground dark:text-slate-400 mt-1">
            Prestación seleccionada: <span className="text-[#008bcd]">{procedureName}</span>
          </div>
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6 overflow-y-auto custom-scrollbar">
          
          <div className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold tracking-widest text-muted-foreground dark:text-slate-300 uppercase">
                PROFESIONAL TRATANTE <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none">
                  <User className="w-3.5 h-3.5 fill-current" />
                </div>
                <select 
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 bg-background dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] rounded-lg text-xs font-bold text-foreground dark:text-white focus:outline-none focus:border-[#008bcd] appearance-none cursor-pointer transition-colors"
                >
                  <option value={currentUserId} className="bg-background dark:bg-[#1e1e1e] text-foreground dark:text-white">
                    {session?.user?.name || "Dr. Actual"}
                  </option>
                  {plan?.doctor && plan.doctor.id !== currentUserId && (
                    <option value={plan.doctor.id} className="bg-background dark:bg-[#1e1e1e] text-foreground dark:text-white">
                      {plan.doctor.name}
                    </option>
                  )}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground dark:text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-[10px] font-extrabold tracking-widest text-muted-foreground dark:text-slate-300 uppercase">
                NOTA CLÍNICA DE EVOLUCIÓN <span className="text-red-500">*</span>
              </label>
              <textarea
                value={evolutionNote}
                onChange={(e) => setEvolutionNote(e.target.value)}
                placeholder="Detalle el instrumental utilizado, anestésico, procedimiento efectuado..."
                className="w-full min-h-[140px] flex-1 bg-background dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] rounded-lg p-3 text-xs font-medium text-foreground dark:text-slate-200 resize-none focus:outline-none focus:border-[#008bcd] placeholder:text-muted-foreground dark:placeholder:text-slate-600 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div 
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${isPrivate ? 'bg-amber-50 dark:bg-[#1a1a1a] border-[#008bcd]/50' : 'bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] hover:border-[#008bcd]/30 dark:hover:border-slate-500/30'}`}
              onClick={() => setIsPrivate(!isPrivate)}
            >
              <div className="flex items-start gap-2.5">
                <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isPrivate ? 'border-[#008bcd] bg-transparent' : 'border-slate-400 dark:border-slate-500'}`}>
                  {isPrivate && <div className="w-2 h-2 rounded-full bg-[#008bcd]" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Lock className={`w-3.5 h-3.5 ${isPrivate ? 'text-[#008bcd]' : 'text-muted-foreground dark:text-slate-400'}`} />
                    <span className={`text-xs font-bold ${isPrivate ? 'text-foreground dark:text-white' : 'text-muted-foreground dark:text-slate-300'}`}>
                      Esta evolución es privada
                    </span>
                  </div>
                  <p className="text-[10px] mt-1 text-muted-foreground dark:text-slate-500 leading-tight">
                    (Opcional) Sólo podrá ser consultada por el doctor tratante emisor.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold tracking-widest text-muted-foreground dark:text-slate-300 uppercase">
                ARCHIVOS ADJUNTOS <span className="text-muted-foreground dark:text-slate-500">(OPCIONAL)</span>
              </label>
              <button 
                type="button"
                className="w-full py-5 border border-dashed border-border dark:border-[#444] bg-muted/30 dark:bg-[#1a1a1a] hover:bg-muted/50 dark:hover:bg-[#222] rounded-lg flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Paperclip className="w-4 h-4 text-[#008bcd]" />
                <span className="text-xs font-bold text-foreground dark:text-white">Adjuntar radiografía o documento</span>
                <span className="text-[10px] font-medium text-muted-foreground dark:text-slate-500">PDF, JPG o PNG (máx 10MB)</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground dark:text-slate-300 uppercase">
                  ¿Ocurrió algún incidente? <span className="text-muted-foreground dark:text-slate-500 normal-case font-medium">(Opcional)</span>
                </label>
                <CustomToggle checked={hasIncident} onChange={setHasIncident} label="Sí, registrar incidente clínico" />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground dark:text-slate-300 uppercase">
                  ¿Ocurrió algún evento adverso? <span className="text-muted-foreground dark:text-slate-500 normal-case font-medium">(Opcional)</span>
                </label>
                <CustomToggle checked={hasAdverseEvent} onChange={setHasAdverseEvent} label="Sí, registrar evento adverso" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/80 dark:border-[#2a2a2a] flex items-center justify-end gap-3 shrink-0 bg-muted/30 dark:bg-[#0a0a0a]">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isSaving}
            className="h-9 px-5 rounded-lg text-xs font-bold border-transparent bg-transparent text-muted-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-[#222] hover:text-foreground dark:hover:text-white cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || !evolutionNote?.trim()}
            className="bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold h-9 px-5 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            Guardar y Evolucionar al {evolutionProgress}%
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}