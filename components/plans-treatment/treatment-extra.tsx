"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export function ExtraProcedureInfoModal({
  isOpen, setIsOpen, selectedProcedure, selectedTeeth = [], onConfirmAdd
}: {
  isOpen: boolean; setIsOpen: (v: boolean) => void; selectedProcedure: any; selectedTeeth: string[]; onConfirmAdd: (data: any) => void;
}) {
  const [symbol, setSymbol] = useState("Restauración")
  const [cieCode, setCieCode] = useState("")

  if (!selectedProcedure) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px] bg-card text-card-foreground border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 border-b border-border bg-slate-50 dark:bg-muted/20">
          <DialogTitle className="text-lg font-bold text-foreground">Información extra</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4 text-xs">
          <div>
            <Label className="text-muted-foreground font-bold uppercase text-[10px]">Prestación</Label>
            <p className="text-sm font-bold text-foreground mt-0.5">{selectedProcedure.name}</p>
          </div>

          <div>
            <Label className="text-muted-foreground font-bold uppercase text-[10px]">Piezas afectadas</Label>
            <p className="text-xs font-semibold text-[#00b0e9] mt-0.5">
              {selectedTeeth.length > 0 ? selectedTeeth.join(", ") : "Tratamiento General"}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground font-bold uppercase text-[10px]">Seleccione un símbolo para esta prestación</Label>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-full h-10 px-3 border border-border rounded-xl bg-background text-xs font-semibold text-foreground">
              <option value="Restauración">Restauración</option>
              <option value="Endodoncia">Endodoncia</option>
              <option value="Corona">Corona</option>
              <option value="Sellante">Sellante</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground font-bold uppercase text-[10px]">Agregar código CIE (Opcional)</Label>
            <Input placeholder="Código o nombre CIE-10" value={cieCode} onChange={(e) => setCieCode(e.target.value)} className="h-10 text-xs bg-background border-border" />
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 dark:bg-muted/20 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cerrar</Button>
          <Button onClick={() => onConfirmAdd({ symbol, cieCode })} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5">
            + Cargar al tratamiento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}