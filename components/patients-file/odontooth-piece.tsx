"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface ToothPieceProps {
  number: number;
  toothRecords?: any[];
  selectedSurfaces?: string[];
  onClick: (surface: string) => void;
  canEdit: boolean;
}

export function ToothPiece({ number, toothRecords = [], selectedSurfaces = [], onClick, canEdit }: ToothPieceProps) {
  const hasStatus = (status: string) => toothRecords.some((r: any) => r.status === status)
  
  const getFill = (surface: string) => {
    if (selectedSurfaces.includes(surface)) return "#bae6fd" 
    const surfaceRecords = toothRecords.filter((r: any) => r.surfaces.includes(surface))
    if (surfaceRecords.length === 0) return "transparent"
    const recent = surfaceRecords[0]
    if (recent.status === "CARIES") return "#ef4444"
    if (recent.status === "REST_BUENA" || recent.status === "REST_MALA") return "#008bcd"
    return "transparent"
  }

  const getStroke = (surface: string) => {
    if (selectedSurfaces.includes(surface)) return "#0ea5e9"
    const surfaceRecords = toothRecords.filter((r: any) => r.surfaces.includes(surface))
    if (surfaceRecords.length > 0 && surfaceRecords[0].status === "REST_MALA") return "#ef4444" 
    return "#64748b"
  }

  const isAbsent = hasStatus("EXT_REALIZADA")
  const cursorClass = canEdit ? "cursor-pointer hover:scale-105" : "cursor-default"

  return (
    <div className={cn("flex flex-col items-center gap-1 group", isAbsent && "opacity-40")}>
      <span 
        className={cn("text-[10px] font-bold text-muted-foreground", canEdit && "group-hover:text-[#008bcd] cursor-pointer", selectedSurfaces.length > 0 && "text-[#008bcd]")} 
        onClick={() => canEdit && onClick("TODA_LA_PIEZA")}
      >
        {number}
      </span>
      <svg width="36" height="36" viewBox="0 0 100 100" className={cn("transition-transform relative drop-shadow-sm", cursorClass)}>
        <polygon points="0,0 25,25 75,25 100,0" fill={getFill("top")} stroke={getStroke("top")} strokeWidth="2" onClick={() => canEdit && onClick("top")} />
        <polygon points="0,0 25,25 25,75 0,100" fill={getFill("left")} stroke={getStroke("left")} strokeWidth="2" onClick={() => canEdit && onClick("left")} />
        <polygon points="100,0 75,25 75,75 100,100" fill={getFill("right")} stroke={getStroke("right")} strokeWidth="2" onClick={() => canEdit && onClick("right")} />
        <polygon points="0,100 25,75 75,75 100,100" fill={getFill("bottom")} stroke={getStroke("bottom")} strokeWidth="2" onClick={() => canEdit && onClick("bottom")} />
        <rect x="25" y="25" width="50" height="50" fill={getFill("center")} stroke={getStroke("center")} strokeWidth="2" onClick={() => canEdit && onClick("center")} />

        {/* GRÁFICOS DE NOMENCLATURA INTERNACIONAL */}
        {hasStatus("EXT_INDICADA") && <g className="pointer-events-none"><line x1="0" y1="0" x2="100" y2="100" stroke="#ef4444" strokeWidth="6" /><line x1="100" y1="0" x2="0" y2="100" stroke="#ef4444" strokeWidth="6" /></g>}
        {hasStatus("EXT_REALIZADA") && <g className="pointer-events-none"><line x1="0" y1="0" x2="100" y2="100" stroke="#008bcd" strokeWidth="6" /><line x1="100" y1="0" x2="0" y2="100" stroke="#008bcd" strokeWidth="6" /></g>}
        {hasStatus("ENDO_INDICADA") && <polygon points="50,15 85,85 15,85" fill="none" stroke="#ef4444" strokeWidth="6" className="pointer-events-none"/>}
        {hasStatus("ENDO_REALIZADA") && <polygon points="50,15 85,85 15,85" fill="none" stroke="#008bcd" strokeWidth="6" className="pointer-events-none"/>}
        {hasStatus("CORONA_MALA") && <circle cx="50" cy="50" r="45" fill="none" stroke="#ef4444" strokeWidth="6" className="pointer-events-none"/>}
        {hasStatus("CORONA_BUENA") && <circle cx="50" cy="50" r="45" fill="none" stroke="#008bcd" strokeWidth="6" className="pointer-events-none"/>}
        {hasStatus("SELLANTE_MALO") && <text x="50" y="65" fill="#ef4444" fontSize="45" fontWeight="bold" textAnchor="middle" className="pointer-events-none">S</text>}
        {hasStatus("SELLANTE_BUENO") && <text x="50" y="65" fill="#008bcd" fontSize="45" fontWeight="bold" textAnchor="middle" className="pointer-events-none">S</text>}
        {hasStatus("FRACTURA") && <line x1="15" y1="85" x2="85" y2="15" stroke="#ef4444" strokeWidth="6" className="pointer-events-none"/>}
      </svg>
    </div>
  )
}