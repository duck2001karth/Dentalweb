"use client"

import React, { useState } from "react"
import { Stethoscope, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface BoxesSettingsTabProps {
  settings: any
  setSettings: React.Dispatch<React.SetStateAction<any>>
}

export function BoxesSettingsTab({ settings, setSettings }: BoxesSettingsTabProps) {
  const [newBoxName, setNewBoxName] = useState("")
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const handleAddBox = () => {
    if (!newBoxName.trim()) return
    setSettings((prev: any) => ({
      ...prev,
      availableBoxes: [...(prev.availableBoxes || []), newBoxName.trim()],
    }))
    setNewBoxName("")
  }

  const confirmRemoveBox = () => {
    if (deleteIndex === null) return
    setSettings((prev: any) => ({
      ...prev,
      availableBoxes: prev.availableBoxes.filter((_: any, i: number) => i !== deleteIndex),
    }))
    setDeleteIndex(null)
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <p className="text-xs font-bold text-foreground">Sillones Odontológicos Habilitados</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Estos Boxes estarán disponibles para seleccionar en las citas e inventario.
        </p>
      </div>

      <div className="flex gap-2">
        <Input 
          value={newBoxName} 
          onChange={(e) => setNewBoxName(e.target.value)} 
          placeholder="Ej: Box 4 (Endodoncia)" 
          className="h-10 rounded-xl bg-background text-sm" 
          onKeyDown={(e) => e.key === "Enter" && handleAddBox()}
        />
        <Button onClick={handleAddBox} type="button" className="bg-primary hover:bg-[#007bb6] text-white font-bold h-10 px-5 rounded-xl text-xs cursor-pointer">
          <Plus className="w-4 h-4 mr-1.5" /> Añadir
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {settings.availableBoxes?.map((box: string, idx: number) => (
          <div key={idx} className="flex items-center justify-between px-4 py-3 bg-muted/20 border border-border/60 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Stethoscope className="w-4 h-4 text-[#008bcd]" />
              <span className="text-xs font-bold text-foreground">{box}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setDeleteIndex(idx)} 
              className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* MODAL ELIMINAR BOX */}
      <Dialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              ¿Eliminar sillón clínico?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              Se removerá &quot;{deleteIndex !== null ? settings.availableBoxes?.[deleteIndex] : ""}&quot; de la lista de sillones disponibles.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)} className="rounded-xl text-xs font-bold">
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmRemoveBox} className="rounded-xl text-xs font-bold">
              Sí, Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}