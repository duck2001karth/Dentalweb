"use client"

import React, { useState } from "react"
import { Grid, Layers, Sparkles, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface RegionSelectorProps {
  selectedLocation: { type: "GENERAL" | "TOOTH" | "ARCADA" | "SEXTANTE"; value: string }
  onSelectLocation: (loc: { type: "GENERAL" | "TOOTH" | "ARCADA" | "SEXTANTE"; value: string }) => void
}

const PIEZAS_DENTALES = [
  "18","17","16","15","14","13","12","11","21","22","23","24","25","26","27","28",
  "48","47","46","45","44","43","42","41","31","32","33","34","35","36","37","38"
]

const ARCADAS = [
  { id: "Arcada Superior", label: "Arcada Superior (Maxilar)" },
  { id: "Arcada Inferior", label: "Arcada Inferior (Mandíbula)" }
]

const SEXTANTES = [
  { id: "Sextante 1", label: "Sextante 1 (18 - 14)" },
  { id: "Sextante 2", label: "Sextante 2 (13 - 23)" },
  { id: "Sextante 3", label: "Sextante 3 (24 - 28)" },
  { id: "Sextante 4", label: "Sextante 4 (38 - 34)" },
  { id: "Sextante 5", label: "Sextante 5 (33 - 43)" },
  { id: "Sextante 6", label: "Sextante 6 (44 - 48)" }
]

export function RegionSelector({ selectedLocation, onSelectLocation }: RegionSelectorProps) {
  const [activeTab, setActiveTab] = useState<"GENERAL" | "TOOTH" | "ARCADA" | "SEXTANTE">(selectedLocation.type || "GENERAL")

  const handleTabChange = (type: "GENERAL" | "TOOTH" | "ARCADA" | "SEXTANTE") => {
    setActiveTab(type)
    if (type === "GENERAL") {
      onSelectLocation({ type: "GENERAL", value: "" })
    }
  }

  return (
    <div className="space-y-3 font-sans antialiased">
      <div className="flex bg-muted/60 p-1 rounded-xl border border-border/80 gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => handleTabChange("GENERAL")}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "GENERAL" ? "bg-background text-[#008bcd] dark:text-blue-400 shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" /> General
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("TOOTH")}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "TOOTH" ? "bg-background text-[#008bcd] dark:text-blue-400 shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Grid className="w-3.5 h-3.5" /> Diente / Pieza
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("ARCADA")}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "ARCADA" ? "bg-background text-[#008bcd] dark:text-blue-400 shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="w-3.5 h-3.5" /> Arcada
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("SEXTANTE")}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "SEXTANTE" ? "bg-background text-[#008bcd] dark:text-blue-400 shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Grid className="w-3.5 h-3.5" /> Sextantes
        </button>
      </div>
      <div className="min-h-[42px] flex items-center">
        {activeTab === "GENERAL" && (
          <div className="text-xs text-muted-foreground font-semibold px-2 py-1 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#008bcd]" /> Tratamiento global (Sin focalización anatómica específica).
          </div>
        )}

        {activeTab === "TOOTH" && (
          <select 
            value={selectedLocation.type === "TOOTH" ? selectedLocation.value : ""} 
            onChange={(e) => onSelectLocation({ type: "TOOTH", value: e.target.value })}
            className="w-full h-10 px-3 text-xs font-bold bg-background border border-border/80 rounded-xl focus:ring-2 focus:ring-[#008bcd] outline-none text-foreground cursor-pointer shadow-xs"
          >
            <option value="">-- Seleccionar Pieza Dental (11 al 48) --</option>
            {PIEZAS_DENTALES.map(p => (
              <option key={p} value={p}>Pieza Dental {p}</option>
            ))}
          </select>
        )}

        {activeTab === "ARCADA" && (
          <div className="grid grid-cols-2 gap-2 w-full">
            {ARCADAS.map(arc => {
              const isSelected = selectedLocation.type === "ARCADA" && selectedLocation.value === arc.id
              return (
                <button
                  type="button"
                  key={arc.id}
                  onClick={() => onSelectLocation({ type: "ARCADA", value: arc.id })}
                  className={cn(
                    "h-10 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer truncate",
                    isSelected ? "border-[#008bcd] bg-[#008bcd]/10 text-[#008bcd] dark:text-blue-400" : "border-border/80 bg-background text-foreground hover:bg-muted/40"
                  )}
                >
                  {arc.label}
                </button>
              )
            })}
          </div>
        )}

        {activeTab === "SEXTANTE" && (
          <select 
            value={selectedLocation.type === "SEXTANTE" ? selectedLocation.value : ""} 
            onChange={(e) => onSelectLocation({ type: "SEXTANTE", value: e.target.value })}
            className="w-full h-10 px-3 text-xs font-bold bg-background border border-border/80 rounded-xl focus:ring-2 focus:ring-[#008bcd] outline-none text-foreground cursor-pointer shadow-xs"
          >
            <option value="">-- Seleccionar Sextante Periodontal --</option>
            {SEXTANTES.map(sex => (
              <option key={sex.id} value={sex.id}>{sex.label}</option>
            ))}
          </select>
        )}
      </div>

    </div>
  )
}