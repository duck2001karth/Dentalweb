"use client"

import React, { useState } from "react"
import { Users, UserPlus, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function AssignCollaboratorsModal({
  isOpen, setIsOpen, doctorsList = [], currentCollaborators = [], onSaveCollaborators
}: {
  isOpen: boolean; setIsOpen: (v: boolean) => void; doctorsList: any[]; currentCollaborators: string[]; onSaveCollaborators: (selectedIds: string[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(currentCollaborators)

  const toggleDoctor = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[450px] bg-card text-card-foreground border-border rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00b0e9]" />
            Asignar Colaboradores al Plan
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Selecciona los doctores o especialistas que participarán en este tratamiento.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-2 max-h-[300px] overflow-y-auto">
          {doctorsList.length > 0 ? (
            doctorsList.map((doc) => {
              const isSelected = selectedIds.includes(doc.id)
              return (
                <div 
                  key={doc.id} 
                  onClick={() => toggleDoctor(doc.id)}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    isSelected ? "border-[#00b0e9] bg-[#00b0e9]/10 font-bold" : "border-border bg-background hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                      {doc.name ? doc.name.charAt(0) : "D"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{doc.name}</p>
                      <p className="text-[11px] text-muted-foreground">{doc.specialty || "Odontólogo General"}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#00b0e9]" />}
                </div>
              )
            })
          ) : (
            <p className="text-xs text-center text-muted-foreground py-6">No hay otros doctores registrados en el sistema.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={() => { onSaveCollaborators(selectedIds); setIsOpen(false); }} className="bg-[#00b0e9] hover:bg-[#0095c6] text-white font-bold">
            Guardar Asignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}