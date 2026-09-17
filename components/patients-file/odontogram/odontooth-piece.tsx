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

  // La opacidad baja aplica si el diente no está (extraído, ausente de nacimiento, etc.)
  const isAbsent = hasStatus("EXT_REALIZADA") || hasStatus("AUSENTE") || hasStatus("PERDIDO")
  const isSelectedTotal = selectedSurfaces.includes("TODA_LA_PIEZA") || selectedSurfaces.length === 5

  return (
    <div className={cn("flex flex-col items-center gap-1 group select-none", isAbsent && "opacity-45")}>
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
        <polygon points="2,2 26,26 74,26 98,2" fill={getFill("top")} className="hover:opacity-85 transition-opacity" onClick={() => canEdit && onClick("top")} />
        <polygon points="2,2 26,26 26,74 2,98" fill={getFill("left")} className="hover:opacity-85 transition-opacity" onClick={() => canEdit && onClick("left")} />
        <polygon points="98,2 74,26 74,74 98,98" fill={getFill("right")} className="hover:opacity-85 transition-opacity" onClick={() => canEdit && onClick("right")} />
        <polygon points="2,98 26,74 74,74 98,98" fill={getFill("bottom")} className="hover:opacity-85 transition-opacity" onClick={() => canEdit && onClick("bottom")} />
        <rect x="26" y="26" width="48" height="48" fill={getFill("center")} className="hover:opacity-85 transition-opacity" onClick={() => canEdit && onClick("center")} />

        {/* ESQUELETO ESTRUCTURAL CONSTANTE */}
        <g fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 dark:text-slate-600 pointer-events-none" strokeLinejoin="round" strokeLinecap="round">
          <rect x="2" y="2" width="96" height="96" />
          <rect x="26" y="26" width="48" height="48" />
          <line x1="2" y1="2" x2="26" y2="26" />
          <line x1="98" y1="2" x2="74" y2="26" />
          <line x1="2" y1="98" x2="26" y2="74" />
          <line x1="98" y1="98" x2="74" y2="74" />
        </g>

        {/* ============================================================== */}
        {/* SIMBOLOGÍA CLÍNICA SOBREPUESTA (OVERLAYS) BASADO EN LA IMAGEN  */}
        {/* ============================================================== */}

        {/* 1. Diente Ausente (Línea Azul Horizontal) */}
        {hasStatus("AUSENTE") && (
          <line x1="5" y1="50" x2="95" y2="50" stroke="#008bcd" strokeWidth="8" className="pointer-events-none" strokeLinecap="round" />
        )}

        {/* 2. Diente Perdido (Línea Azul Vertical) */}
        {hasStatus("PERDIDO") && (
          <line x1="50" y1="5" x2="50" y2="95" stroke="#008bcd" strokeWidth="8" className="pointer-events-none" strokeLinecap="round" />
        )}

        {/* 3. Extracción Indicada (Cruz Roja) */}
        {hasStatus("EXT_INDICADA") && (
          <g className="pointer-events-none stroke-[#ef4444]" strokeWidth="6" strokeLinecap="round">
            <line x1="6" y1="6" x2="94" y2="94" />
            <line x1="94" y1="6" x2="6" y2="94" />
          </g>
        )}

        {/* 4. Diente Extraído / Realizada (Cruz Azul) */}
        {hasStatus("EXT_REALIZADA") && (
          <g className="pointer-events-none stroke-[#008bcd]" strokeWidth="6" strokeLinecap="round">
            <line x1="6" y1="6" x2="94" y2="94" />
            <line x1="94" y1="6" x2="6" y2="94" />
          </g>
        )}

        {/* 5. Caries Recurrente / Restauración Mala (Círculo azul con borde rojo grueso) */}
        {hasStatus("CARIES_RECURRENTE") && (
          <circle cx="50" cy="50" r="22" fill="#008bcd" stroke="#ef4444" strokeWidth="8" className="pointer-events-none" />
        )}

        {/* 6. Endodoncia en mal estado (Triángulo Rojo Vacío) */}
        {hasStatus("ENDO_INDICADA") && (
          <polygon points="50,10 88,88 12,88" fill="none" stroke="#ef4444" strokeWidth="5.5" strokeLinejoin="round" className="pointer-events-none" />
        )}

        {/* 7. Endodoncia en buen estado (Triángulo Azul Vacío) */}
        {hasStatus("ENDO_REALIZADA") && (
          <polygon points="50,10 88,88 12,88" fill="none" stroke="#008bcd" strokeWidth="5.5" strokeLinejoin="round" className="pointer-events-none" />
        )}

        {/* 8. Corona Completa Mala (Círculo Rojo Sólido, corregido según imagen) */}
        {hasStatus("CORONA_MALA") && (
          <circle cx="50" cy="50" r="46" fill="none" stroke="#ef4444" strokeWidth="5" className="pointer-events-none" />
        )}

        {/* 9. Corona Completa Buena (Círculo Azul Sólido) */}
        {hasStatus("CORONA_BUENA") && (
          <circle cx="50" cy="50" r="46" fill="none" stroke="#008bcd" strokeWidth="5" className="pointer-events-none" />
        )}

        {/* 10. Diente para Corona (Letra C en Rojo) */}
        {hasStatus("PARA_CORONA") && (
          <text x="50" y="68" fill="#ef4444" fontSize="56" fontWeight="900" textAnchor="middle" className="pointer-events-none font-mono">C</text>
        )}

        {/* 11. Incrustación en mal estado (INC Rojo) */}
        {hasStatus("INC_MALA") && (
          <text x="50" y="62" fill="#ef4444" fontSize="32" fontWeight="900" textAnchor="middle" className="pointer-events-none font-mono tracking-tighter">INC</text>
        )}

        {/* 12. Incrustación en buen estado (INC Azul) */}
        {hasStatus("INC_BUENA") && (
          <text x="50" y="62" fill="#008bcd" fontSize="32" fontWeight="900" textAnchor="middle" className="pointer-events-none font-mono tracking-tighter">INC</text>
        )}

        {/* 13. Prótesis Fija Mala (O-O Rojo) */}
        {hasStatus("PROTESIS_FIJA_MALA") && (
          <g className="pointer-events-none" stroke="#ef4444" strokeWidth="5" fill="none">
            <circle cx="20" cy="50" r="12" />
            <circle cx="80" cy="50" r="12" />
            <line x1="32" y1="50" x2="68" y2="50" />
          </g>
        )}

        {/* 14. Prótesis Fija Buena (O-O Azul) */}
        {hasStatus("PROTESIS_FIJA_BUENA") && (
          <g className="pointer-events-none" stroke="#008bcd" strokeWidth="5" fill="none">
            <circle cx="20" cy="50" r="12" />
            <circle cx="80" cy="50" r="12" />
            <line x1="32" y1="50" x2="68" y2="50" />
          </g>
        )}

        {/* 15. Prótesis Removible Mala (Dos líneas horizontales rojas) */}
        {hasStatus("PROTESIS_REM_MALA") && (
          <g className="pointer-events-none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round">
            <line x1="10" y1="35" x2="90" y2="35" />
            <line x1="10" y1="65" x2="90" y2="65" />
          </g>
        )}

        {/* 16. Prótesis Removible Buena (Dos líneas horizontales azules) */}
        {hasStatus("PROTESIS_REM_BUENA") && (
          <g className="pointer-events-none" stroke="#008bcd" strokeWidth="6" strokeLinecap="round">
            <line x1="10" y1="35" x2="90" y2="35" />
            <line x1="10" y1="65" x2="90" y2="65" />
          </g>
        )}

        {/* 17. Implante en mal estado (Flecha hacia arriba roja) */}
        {hasStatus("IMPLANTE_MALO") && (
          <g className="pointer-events-none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <line x1="50" y1="90" x2="50" y2="10" />
            <polyline points="30,30 50,10 70,30" />
          </g>
        )}

        {/* 18. Implante en buen estado (Flecha hacia arriba azul) */}
        {hasStatus("IMPLANTE_BUENO") && (
          <g className="pointer-events-none" stroke="#008bcd" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <line x1="50" y1="90" x2="50" y2="10" />
            <polyline points="30,30 50,10 70,30" />
          </g>
        )}

        {/* Sellantes (S) */}
        {hasStatus("SELLANTE_MALO") && (
          <text x="50" y="68" fill="#ef4444" fontSize="48" fontWeight="900" textAnchor="middle" className="pointer-events-none font-mono">S</text>
        )}
        {hasStatus("SELLANTE_BUENO") && (
          <text x="50" y="68" fill="#008bcd" fontSize="48" fontWeight="900" textAnchor="middle" className="pointer-events-none font-mono">S</text>
        )}

        {/* Fractura Diágonal */}
        {hasStatus("FRACTURA") && (
          <path d="M 12,88 L 44,52 L 56,60 L 88,12" fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none" />
        )}
      </svg>
    </div>
  )
}