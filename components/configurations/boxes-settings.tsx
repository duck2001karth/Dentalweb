"use client"

import React, { useState } from "react"
import { Stethoscope, Plus, Trash2, Edit3, Check, X, ShieldAlert, Armchair } from "lucide-react"
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
import { cn } from "@/lib/utils"

interface BoxesSettingsTabProps {
  settings: any
  setSettings: React.Dispatch<React.SetStateAction<any>>
}

export function BoxesSettingsTab({ settings, setSettings }: BoxesSettingsTabProps) {
  const brandColor = settings.primaryColor || "#008bcd"
  const [newBoxName, setNewBoxName] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState("")
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const availableBoxes: string[] = settings.availableBoxes || []

  const handleAddBox = () => {
    if (!newBoxName.trim()) return
    setSettings((prev: any) => ({
      ...prev,
      availableBoxes: [...(prev.availableBoxes || []), newBoxName.trim()],
    }))
    setNewBoxName("")
  }

  const startEdit = (idx: number, currentName: string) => {
    setEditingIndex(idx)
    setEditingText(currentName)
  }

  const saveEdit = (idx: number) => {
    if (!editingText.trim()) return
    const updated = [...availableBoxes]
    updated[idx] = editingText.trim()
    setSettings((prev: any) => ({ ...prev, availableBoxes: updated }))
    setEditingIndex(null)
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
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* Banner de Cabecera */}
      <div 
        className="p-5 rounded-2xl border flex items-center justify-between transition-all"
        style={{
          background: `linear-gradient(135deg, ${brandColor}12 0%, transparent 100%)`,
          borderColor: `${brandColor}25`,
        }}
      >
        <div className="flex items-center gap-3.5">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center border shadow-2xs"
            style={{ backgroundColor: `${brandColor}18`, borderColor: `${brandColor}35`, color: brandColor }}
          >
            <Armchair className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground tracking-tight">Sillones Odontológicos (Boxes)</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Define los espacios físicos disponibles para citas, asignación médica e inventario.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span 
            className="text-xs font-black px-3 py-1 rounded-full border shadow-2xs"
            style={{ backgroundColor: `${brandColor}15`, color: brandColor, borderColor: `${brandColor}30` }}
          >
            {availableBoxes.length} Activo{availableBoxes.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Input de Registro Rápido */}
      <div className="flex gap-2.5">
        <div className="relative flex-1">
          <Stethoscope className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input 
            value={newBoxName} 
            onChange={(e) => setNewBoxName(e.target.value)} 
            placeholder="Ej: Box 4 (Endodoncia & Cirugía)" 
            className="h-11 pl-10 rounded-xl bg-background border-border/80 text-xs font-semibold shadow-2xs focus-visible:ring-1"
            onKeyDown={(e) => e.key === "Enter" && handleAddBox()} 
          />
        </div>
        <Button 
          onClick={handleAddBox} 
          type="button" 
          disabled={!newBoxName.trim()}
          style={{ backgroundColor: newBoxName.trim() ? brandColor : undefined }}
          className={cn(
            "text-white font-bold h-11 px-5 rounded-xl text-xs transition-all shadow-sm cursor-pointer",
            !newBoxName.trim() && "opacity-50 cursor-not-allowed"
          )}
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Añadir Box
        </Button>
      </div>

      {/* Grid de Sillones Disponibles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {availableBoxes.map((box: string, idx: number) => {
          const isEditing = editingIndex === idx
          return (
            <div 
              key={idx} 
              className={cn(
                "group flex items-center justify-between p-3.5 px-4 bg-card border rounded-2xl transition-all duration-200 shadow-2xs",
                isEditing ? "border-primary ring-1 ring-primary/30" : "border-border/70 hover:border-border hover:shadow-xs"
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: `${brandColor}12`, borderColor: `${brandColor}25`, color: brandColor }}
                >
                  <Stethoscope className="w-4 h-4" />
                </div>
                
                {isEditing ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <Input 
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="h-8 text-xs font-bold bg-background rounded-lg"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(idx)
                        if (e.key === "Escape") setEditingIndex(null)
                      }}
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => saveEdit(idx)} 
                      className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10 rounded-lg cursor-pointer shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => setEditingIndex(null)} 
                      className="h-7 w-7 text-muted-foreground hover:bg-muted rounded-lg cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-foreground truncate">{box}</span>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => startEdit(idx, box)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg cursor-pointer transition-colors"
                    title="Editar nombre"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setDeleteIndex(idx)} 
                    className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                    title="Remover sillón"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal de Eliminación con Alerta de Integridad */}
      <Dialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-0 overflow-hidden bg-card border-border/80 shadow-2xl">
          <div className="p-6 border-b border-border/60 bg-destructive/10 text-destructive flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-destructive/20 border border-destructive/30 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 text-destructive stroke-[2.2]" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground">¿Remover Sillón Clínico?</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Se quitará <strong>&quot;{deleteIndex !== null ? availableBoxes[deleteIndex] : ""}&quot;</strong> del catálogo operativo.
              </DialogDescription>
            </div>
          </div>
          
          <div className="p-5 text-xs text-muted-foreground bg-muted/15 leading-relaxed">
            Las citas pasadas o archivadas en este sillón mantendrán su trazabilidad histórica, pero ningún especialista podrá agendar nuevos turnos aquí.
          </div>

          <DialogFooter className="p-4 px-6 border-t border-border/60 bg-muted/20 gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)} className="rounded-xl text-xs font-bold h-9">
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmRemoveBox} className="rounded-xl text-xs font-bold h-9 px-4">
              Sí, Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}