"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface ToothPieceProps {
  number: number
  toothRecords?: any[]
  selectedSurfaces?: string[]
  onClick: (surface: string) => void
  canEdit: boolean
}

export function ToothPiece({ 
  number, 
  toothRecords = [], 
  selectedSurfaces = [], 
  onClick, 
  canEdit 
}: ToothPieceProps) {
  
  const matchesSurface = (recordSurfaces: string[], targetKey: string) => {
    if (!Array.isArray(recordSurfaces)) return false
    if (recordSurfaces.includes("TODA_LA_PIEZA") || recordSurfaces.includes("all")) {
      return false
    }

    const quadrant = Math.floor(number / 10)
    const aliases: Record<string, string[]> = {
      top: ["top", "vestibular"],
      bottom: ["bottom", number >= 31 && number <= 48 ? "lingual" : "palatino", "palatina", "lingual"],
      center: ["center", "middle", "oclusal", "incisal"],
      left: [
        "left", 
        quadrant === 1 || quadrant === 4 ? "distal" : "mesial"
      ],
      right: [
        "right", 
        quadrant === 1 || quadrant === 4 ? "mesial" : "distal"
      ]
    }

    const validKeys = aliases[targetKey] || [targetKey]
    return recordSurfaces.some((s) => validKeys.includes(s.toLowerCase().trim()))
  }

  const getSurfaceRecord = (surfaceKey: string) => {
    return toothRecords.find((r: any) => matchesSurface(r.surfaces, surfaceKey))
  }

  const getFill = (surfaceKey: string) => {
    if (selectedSurfaces.includes(surfaceKey)) {
      return "#38bdf8"
    }

    const record = getSurfaceRecord(surfaceKey)
    if (!record) return "transparent"

    const status = record.status
    if (["CARIES", "FRACTURA", "CAVIDAD", "REST_MALA"].includes(status)) {
      return "#ef4444"
    }
    if (["REST_BUENA", "SELLANTE_BUENO", "AMALGAMA_BUENA", "RESINA_BUENA"].includes(status)) {
      return "#008bcd"
    }
    if (status === "SELLANTE_MALO") return "#f87171"

    return "transparent"
  }

  const hasStatus = (status: string) => toothRecords.some((r: any) => r.status === status)
  const isAbsent = hasStatus("EXT_REALIZADA")
  const isSelectedTotal = selectedSurfaces.includes("TODA_LA_PIEZA") || selectedSurfaces.length === 5

  return (
    <div className={cn("flex flex-col items-center gap-1 group select-none", isAbsent && "opacity-45")}>
      
      {/* FDI Number */}
      <span 
        className={cn(
          "font-mono font-black text-[11px] transition-colors",
          canEdit && "group-hover:text-[#008bcd] cursor-pointer",
          isSelectedTotal || selectedSurfaces.length > 0 ? "text-[#008bcd] scale-110" : "text-muted-foreground"
        )} 
        onClick={() => canEdit && onClick("TODA_LA_PIEZA")}
        title={`Pieza #${number} - Clic para marcar completa`}
      >
        {number}
      </span>

      {/* 
        viewBox="-4 -4 108 108" proporciona 4px de padding interno en el SVG, 
        evitando que ningún borde de 2px o trazo grueso sea recortado.
      */}
      <svg 
        width="40" 
        height="40" 
        viewBox="-4 -4 108 108" 
        className={cn(
          "transition-all relative overflow-visible",
          canEdit ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default",
          isSelectedTotal && "ring-2 ring-[#008bcd] ring-offset-2 rounded-lg"
        )}
      >
        {/* CARAS CLÍNICAS RELLENAS (SUPERFICIES) */}
        
        {/* Superior (Top) */}
        <polygon 
          points="2,2 26,26 74,26 98,2" 
          fill={getFill("top")} 
          className="hover:opacity-85 transition-opacity"
          onClick={() => canEdit && onClick("top")} 
        />

        {/* Izquierda (Left) */}
        <polygon 
          points="2,2 26,26 26,74 2,98" 
          fill={getFill("left")} 
          className="hover:opacity-85 transition-opacity"
          onClick={() => canEdit && onClick("left")} 
        />

        {/* Derecha (Right) */}
        <polygon 
          points="98,2 74,26 74,74 98,98" 
          fill={getFill("right")} 
          className="hover:opacity-85 transition-opacity"
          onClick={() => canEdit && onClick("right")} 
        />

        {/* Inferior (Bottom) */}
        <polygon 
          points="2,98 26,74 74,74 98,98" 
          fill={getFill("bottom")} 
          className="hover:opacity-85 transition-opacity"
          onClick={() => canEdit && onClick("bottom")} 
        />

        {/* Centro (Oclusal / Incisal) */}
        <rect 
          x="26" 
          y="26" 
          width="48" 
          height="48" 
          fill={getFill("center")} 
          className="hover:opacity-85 transition-opacity"
          onClick={() => canEdit && onClick("center")} 
        />

        {/* ESQUELETO ESTRUCTURAL CONSTANTE (Garantiza líneas nítidas sin huecos blancos) */}
        <g 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          className="text-slate-400 dark:text-slate-600 pointer-events-none"
          strokeLinejoin="round" 
          strokeLinecap="round"
        >
          {/* Cuadrado Exterior Completo */}
          <rect x="2" y="2" width="96" height="96" />
          
          {/* Cuadrado Central (Oclusal) */}
          <rect x="26" y="26" width="48" height="48" />
          
          {/* Líneas Diagonales Conectoras */}
          <line x1="2" y1="2" x2="26" y2="26" />
          <line x1="98" y1="2" x2="74" y2="26" />
          <line x1="2" y1="98" x2="26" y2="74" />
          <line x1="98" y1="98" x2="74" y2="74" />
        </g>

        {/* SIMBOLOGÍA CLÍNICA SOBREPUESTA (OVERLAYS) */}
        
        {/* Extracción Indicada (Cruz Roja) */}
        {hasStatus("EXT_INDICADA") && (
          <g className="pointer-events-none stroke-[#ef4444]" strokeWidth="6" strokeLinecap="round">
            <line x1="6" y1="6" x2="94" y2="94" />
            <line x1="94" y1="6" x2="6" y2="94" />
          </g>
        )}

        {/* Extracción Realizada / Ausente (Cruz Azul) */}
        {hasStatus("EXT_REALIZADA") && (
          <g className="pointer-events-none stroke-[#008bcd]" strokeWidth="6" strokeLinecap="round">
            <line x1="6" y1="6" x2="94" y2="94" />
            <line x1="94" y1="6" x2="6" y2="94" />
          </g>
        )}

        {/* Endodoncia Indicada (Triángulo Rojo) */}
        {hasStatus("ENDO_INDICADA") && (
          <polygon points="50,10 88,88 12,88" fill="none" stroke="#ef4444" strokeWidth="5.5" strokeLinejoin="round" className="pointer-events-none" />
        )}

        {/* Endodoncia Realizada (Triángulo Azul) */}
        {hasStatus("ENDO_REALIZADA") && (
          <polygon points="50,10 88,88 12,88" fill="none" stroke="#008bcd" strokeWidth="5.5" strokeLinejoin="round" className="pointer-events-none" />
        )}

        {/* Corona Deficiente / Requerida (Círculo Rojo Punteado) */}
        {hasStatus("CORONA_MALA") && (
          <circle cx="50" cy="50" r="46" fill="none" stroke="#ef4444" strokeWidth="5" strokeDasharray="6,3" className="pointer-events-none" />
        )}

        {/* Corona en Buen Estado (Círculo Azul Sólido) */}
        {hasStatus("CORONA_BUENA") && (
          <circle cx="50" cy="50" r="46" fill="none" stroke="#008bcd" strokeWidth="5" className="pointer-events-none" />
        )}

        {/* Sellantes */}
        {hasStatus("SELLANTE_MALO") && (
          <text x="50" y="68" fill="#ef4444" fontSize="48" fontWeight="900" textAnchor="middle" className="pointer-events-none font-mono">S</text>
        )}
        {hasStatus("SELLANTE_BUENO") && (
          <text x="50" y="68" fill="#008bcd" fontSize="48" fontWeight="900" textAnchor="middle" className="pointer-events-none font-mono">S</text>
        )}

        {/* Fractura */}
        {hasStatus("FRACTURA") && (
          <path d="M 12,88 L 44,52 L 56,60 L 88,12" fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none" />
        )}
      </svg>
    </div>
  )
}