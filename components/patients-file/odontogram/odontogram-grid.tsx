"use client"

import React from "react"
import { ToothPiece } from "./odontooth-piece"
import { cn } from "@/lib/utils"

interface OdontogramGridProps {
  dentition: "permanente" | "temporal"
  getRecordsForTooth: (toothNumber: number) => any[]
  selectedTooth: number | null
  currentSurfaces: string[]
  handleSurfaceClick: (tooth: number, surface: string) => void
  canEdit: boolean
}

export function OdontogramGrid({
  dentition,
  getRecordsForTooth,
  selectedTooth,
  currentSurfaces,
  handleSurfaceClick,
  canEdit,
}: OdontogramGridProps) {
  // Cuadrantes permanentes
  const arcada1 = [18, 17, 16, 15, 14, 13, 12, 11]
  const arcada2 = [21, 22, 23, 24, 25, 26, 27, 28]
  const arcada4 = [48, 47, 46, 45, 44, 43, 42, 41]
  const arcada3 = [31, 32, 33, 34, 35, 36, 37, 38]

  // Cuadrantes temporales (niños)
  const arcadaTemp1 = [55, 54, 53, 52, 51]
  const arcadaTemp2 = [61, 62, 63, 64, 65]
  const arcadaTemp4 = [85, 84, 83, 82, 81]
  const arcadaTemp3 = [71, 72, 73, 74, 75]

  const upperRight = dentition === "permanente" ? arcada1 : arcadaTemp1
  const upperLeft = dentition === "permanente" ? arcada2 : arcadaTemp2
  const lowerRight = dentition === "permanente" ? arcada4 : arcadaTemp4
  const lowerLeft = dentition === "permanente" ? arcada3 : arcadaTemp3

  const renderQuadrant = (teeth: number[]) => (
    <div className="flex gap-2.5 sm:gap-3 items-center">
      {teeth.map((num) => (
        <ToothPiece
          key={num}
          number={num}
          toothRecords={getRecordsForTooth(num)}
          selectedSurfaces={selectedTooth === num ? currentSurfaces : []}
          onClick={(surface: string) => handleSurfaceClick(num, surface)}
          canEdit={canEdit}
        />
      ))}
    </div>
  )

  return (
    <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-7 shadow-xs overflow-x-auto relative">
      <div className="min-w-[820px] flex flex-col items-center select-none">
        
        {/* Marcadores Superiores Discretos */}
        <div className="w-full flex justify-between items-center text-[11px] font-medium text-muted-foreground/70 px-4 mb-3">
          <span className="text-xs font-semibold text-foreground/80 tracking-wide" >Derecha (Paciente)</span>
          <span className="text-xs font-semibold text-foreground/80 tracking-wide">
            Maxilar Superior
          </span>
          <span className="text-xs font-semibold text-foreground/80 tracking-wide">Izquierda (Paciente)</span>
        </div>

        {/* CONTENEDOR DE ARCADAS */}
        <div className="flex flex-col gap-6 relative py-1">
          <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-px bg-border/40 pointer-events-none" />

          {/* ARCADA SUPERIOR */}
          <div className="flex justify-center items-center gap-5 sm:gap-6 relative z-10">
            {renderQuadrant(upperRight)}
            <div className="w-px h-14 bg-border/60" />
            {renderQuadrant(upperLeft)}
          </div>

          {/* SEPARADOR HORIZONTAL INTER-ARCADAS LIMPIO */}
          <div className="w-full flex items-center justify-center gap-3">
            <div className="h-px bg-border/40 flex-1" />
            <span className="text-[10px] font-semibold text-foreground/80 tracking-wide">
              Línea de Oclusión
            </span>
            <div className="h-px bg-border/40 flex-1" />
          </div>

          {/* ARCADA INFERIOR */}
          <div className="flex justify-center items-center gap-5 sm:gap-6 relative z-10">
            {renderQuadrant(lowerRight)}
            <div className="w-px h-14 bg-border/60" />
            {renderQuadrant(lowerLeft)}
          </div>

        </div>

        {/* Marcadores Inferiores Discretos */}
        <div className="w-full flex justify-between items-center text-[11px] font-medium text-muted-foreground/70 px-4 mt-3">
          <span className="text-xs font-semibold text-foreground/80 tracking-wide">Cuadrante 4 / 8</span>
          <span className="text-xs font-semibold text-foreground/80 tracking-wide">
            Maxilar Inferior
          </span>
          <span className="text-xs font-semibold text-foreground/80 tracking-wide">Cuadrante 3 / 7</span>
        </div>

      </div>
    </div>
  )
}