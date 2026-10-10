"use client"

import React, { useState, useEffect } from "react"
import { Grid, Layers, Sparkles, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface RegionSelectorProps {
  selectedLocation: { type: "GENERAL" | "TOOTH" | "ARCADA" | "SEXTANTE"; value: string }
  onSelectLocation: (loc: { type: "GENERAL" | "TOOTH" | "ARCADA" | "SEXTANTE"; value: string }) => void
}

// Agrupados para mejor UX en el select
const PIEZAS_SUPERIORES = ["18","17","16","15","14","13","12","11","21","22","23","24","25","26","27","28"]
const PIEZAS_INFERIORES = ["48","47","46","45","44","43","42","41","31","32","33","34","35","36","37","38"]

const ARCADAS = [
  { id: "Arcada Superior", label: "Arcada Superior (Maxilar)" },
  { id: "Arcada Inferior", label: "Arcada Inferior (Mandíbula)" }
]

const SEXTANTES = [
  { id: "Sextante 1 (18-14)", label: "Sextante 1 (18 - 14)" },
  { id: "Sextante 2 (13-23)", label: "Sextante 2 (13 - 23)" },
  { id: "Sextante 3 (24-28)", label: "Sextante 3 (24 - 28)" },
  { id: "Sextante 4 (38-34)", label: "Sextante 4 (38 - 34)" },
  { id: "Sextante 5 (33-43)", label: "Sextante 5 (33 - 43)" },
  { id: "Sextante 6 (44-48)", label: "Sextante 6 (44 - 48)" }
]

export function RegionSelector({ selectedLocation, onSelectLocation }: RegionSelectorProps) {
  const [activeTab, setActiveTab] = useState<"GENERAL" | "TOOTH" | "ARCADA" | "SEXTANTE">(
    selectedLocation?.type || "GENERAL"
  )

  useEffect(() => {
    if (selectedLocation?.type && selectedLocation.type !== activeTab) {
      setActiveTab(selectedLocation.type)
    }
  }, [selectedLocation?.type])

  const handleTabChange = (type: "GENERAL" | "TOOTH" | "ARCADA" | "SEXTANTE") => {
    setActiveTab(type)
    onSelectLocation({
      type,
      value: selectedLocation.type === type ? selectedLocation.value : ""
    })
  }

  return (
    <div className="space-y-2.5 font-sans antialiased">
      {/* CONTROL SEGMENTADO ESTILO iOS (Compacto) */}
      <div className="flex bg-muted/50 p-1 rounded-xl border border-border/60 text-[11px] font-bold shadow-inner">
        <button
          type="button"
          onClick={() => handleTabChange("GENERAL")}
          className={cn(
            "flex-1 py-1.5 px-1 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer",
            activeTab === "GENERAL" ? "bg-background text-[#008bcd] shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="w-3 h-3" /> General
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("TOOTH")}
          className={cn(
            "flex-1 py-1.5 px-1 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer",
            activeTab === "TOOTH" ? "bg-background text-[#008bcd] shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Grid className="w-3 h-3" /> Pieza
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("ARCADA")}
          className={cn(
            "flex-1 py-1.5 px-1 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer",
            activeTab === "ARCADA" ? "bg-background text-[#008bcd] shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="w-3 h-3" /> Arcada
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("SEXTANTE")}
          className={cn(
            "flex-1 py-1.5 px-1 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer",
            activeTab === "SEXTANTE" ? "bg-background text-[#008bcd] shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Grid className="w-3 h-3" /> Sextantes
        </button>
      </div>

      {/* ÁREA DE SELECCIÓN DINÁMICA (Sin selects nativos) */}
      <div className="flex items-center">
        {activeTab === "GENERAL" && (
          <div className="w-full bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-2 text-[11px] text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> 
            Procedimiento global sin focalización anatómica específica.
          </div>
        )}

        {activeTab === "TOOTH" && (
          <Select 
            value={selectedLocation.type === "TOOTH" ? selectedLocation.value : ""} 
            onValueChange={(val) => onSelectLocation({ type: "TOOTH", value: val })}
          >
            <SelectTrigger className="w-full h-9 bg-background border-border/80 rounded-lg focus:border-[#008bcd] focus:ring-2 focus:ring-[#008bcd]/20 text-xs font-bold shadow-xs">
              <SelectValue placeholder="-- Seleccionar Pieza Dental --" />
            </SelectTrigger>
            {/* max-h-[220px] fuerza a que el listado tenga scroll interno y no se desborde del modal */}
            <SelectContent className="max-h-[220px] rounded-xl border-border shadow-xl">
              <SelectGroup>
                <SelectLabel className="text-[10px] text-muted-foreground">Maxilar Superior</SelectLabel>
                {PIEZAS_SUPERIORES.map(p => <SelectItem key={p} value={p} className="text-xs font-bold cursor-pointer">Diente {p}</SelectItem>)}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-[10px] text-muted-foreground border-t border-border mt-1 pt-1">Maxilar Inferior</SelectLabel>
                {PIEZAS_INFERIORES.map(p => <SelectItem key={p} value={p} className="text-xs font-bold cursor-pointer">Diente {p}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}

        {activeTab === "ARCADA" && (
          <div className="grid grid-cols-2 gap-2 w-full">
            {ARCADAS.map((arc) => {
              const isSelected = selectedLocation.type === "ARCADA" && selectedLocation.value === arc.id
              return (
                <button
                  type="button"
                  key={arc.id}
                  onClick={() => onSelectLocation({ type: "ARCADA", value: arc.id })}
                  className={cn(
                    "h-9 px-3 border rounded-lg text-xs font-bold transition-all cursor-pointer truncate shadow-xs",
                    isSelected ? "border-[#008bcd] bg-[#008bcd]/10 text-[#008bcd]" : "border-border/80 bg-background text-foreground hover:border-[#008bcd]/50 hover:bg-muted/30"
                  )}
                >
                  {arc.label}
                </button>
              )
            })}
          </div>
        )}

        {activeTab === "SEXTANTE" && (
          <Select 
            value={selectedLocation.type === "SEXTANTE" ? selectedLocation.value : ""} 
            onValueChange={(val) => onSelectLocation({ type: "SEXTANTE", value: val })}
          >
            <SelectTrigger className="w-full h-9 bg-background border-border/80 rounded-lg focus:border-[#008bcd] focus:ring-2 focus:ring-[#008bcd]/20 text-xs font-bold shadow-xs">
              <SelectValue placeholder="-- Seleccionar Sextante --" />
            </SelectTrigger>
            <SelectContent className="max-h-[220px] rounded-xl border-border shadow-xl">
              {SEXTANTES.map((sex) => (
                <SelectItem key={sex.id} value={sex.id} className="text-xs font-bold cursor-pointer">
                  {sex.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}