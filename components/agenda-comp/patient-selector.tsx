"use client"

import { useState, useEffect, useRef } from "react"
import { Search, CheckCircle2, User, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PatientSelectorProps {
  patientId: string
  setPatientId: (id: string) => void
  patients: any[]
  isLoading: boolean
  themeColor?: string 
}

export function PatientSelector({ 
  patientId, 
  setPatientId, 
  patients = [], 
  isLoading, 
  themeColor = "#008bcd" 
}: PatientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedPatient = patients?.find((p: any) => p.id === patientId)

  const filteredPatients = (patients || []).filter((p: any) => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return false
    
    const fullName = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase()
    const ci = (p.ci || "").toLowerCase()
    const phone = (p.phone || "").toLowerCase()
    
    return fullName.includes(term) || ci.includes(term) || phone.includes(term)
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const styleVars = {
    "--theme-color": themeColor,
    "--theme-light": `${themeColor}15`,
    "--theme-border": `${themeColor}40`,
  } as React.CSSProperties

  if (selectedPatient) {
    return (
      <div 
        className="flex items-center justify-between px-3.5 py-2 border rounded-xl h-11 shadow-xs animate-in fade-in duration-200"
        style={{ backgroundColor: `${themeColor}12`, borderColor: `${themeColor}30` }}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div 
            className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs"
            style={{ backgroundColor: themeColor }}
          >
            {selectedPatient.firstName?.charAt(0) || "P"}
          </div>
          <div className="flex flex-col min-w-0">
            <span 
              className="font-bold text-xs truncate leading-tight"
              style={{ color: themeColor }}
            >
              {selectedPatient.firstName} {selectedPatient.lastName}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono font-medium leading-none mt-0.5">
              CI: {selectedPatient.ci || "S/N"}
            </span>
          </div>
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          style={{ color: themeColor, backgroundColor: "transparent" }}
          onClick={() => {
            setPatientId("")
            setSearchTerm("")
            setIsOpen(false)
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${themeColor}20`}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Cambiar
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full" style={styleVars}>
      
      <style>{`
        .patient-input-dynamic:focus {
          border-color: var(--theme-color) !important;
          box-shadow: 0 0 0 2px var(--theme-light) !important;
        }
        .patient-item-dynamic:hover {
          background-color: var(--theme-light) !important;
        }
        .patient-item-dynamic:hover .patient-text-dynamic {
          color: var(--theme-color) !important;
        }
        .patient-item-dynamic:hover .patient-icon-dynamic {
          background-color: var(--theme-light) !important;
          color: var(--theme-color) !important;
        }
        .patient-item-dynamic:hover .patient-check-dynamic {
          color: var(--theme-color) !important;
          opacity: 1 !important;
        }
      `}</style>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={isLoading ? "Cargando lista de pacientes..." : "Buscar por nombre, apellido o CI..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(e.target.value.trim().length > 0)
          }}
          disabled={isLoading}
          className="patient-input-dynamic pl-9.5 pr-8 bg-background border-border/80 h-11 text-foreground placeholder:text-muted-foreground font-medium text-xs rounded-xl shadow-xs transition-all outline-none"
        />
        {isLoading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && searchTerm.trim().length > 0 && !isLoading && (
        <div className="absolute top-full left-0 w-full mt-1.5 bg-popover border border-border/80 shadow-2xl rounded-2xl z-[130] max-h-56 overflow-y-auto custom-scrollbar p-1 divide-y divide-border/30 animate-in fade-in slide-in-from-top-1 duration-150">
          {filteredPatients.length === 0 ? (
            <div className="py-6 px-4 text-center text-xs text-muted-foreground font-medium">
              <User className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-muted-foreground" />
              No se encontraron pacientes para "{searchTerm}"
            </div>
          ) : (
            filteredPatients.map((patient: any) => (              <div
                key={patient.id}
                className="patient-item-dynamic flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors text-left"
                onClick={() => {
                  setPatientId(patient.id)
                  setIsOpen(false)
                  setSearchTerm("")
                }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="patient-icon-dynamic w-8 h-8 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center font-bold text-xs transition-colors shrink-0">
                    {patient.firstName?.charAt(0) || "P"}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="patient-text-dynamic font-bold text-xs text-foreground transition-colors truncate">
                      {patient.firstName} {patient.lastName}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      C.I: {patient.ci || "Sin documento"} {patient.phone ? ` • Tel: ${patient.phone}` : ""}
                    </span>
                  </div>
                </div>
                <CheckCircle2 className="patient-check-dynamic w-4 h-4 text-muted-foreground/30 shrink-0 opacity-0 transition-all" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}