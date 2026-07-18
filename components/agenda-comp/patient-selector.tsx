"use client"

import { useState, useEffect, useRef } from "react"
import { Search, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PatientSelectorProps {
  patientId: string
  setPatientId: (id: string) => void
  patients: any[]
  isLoading: boolean
}

export function PatientSelector({ patientId, setPatientId, patients, isLoading }: PatientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedPatient = patients?.find((p: any) => p.id === patientId)
  const filteredPatients = patients?.filter((p: any) => {
    const term = searchTerm.toLowerCase()
    return (
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.ci.includes(term)
    )
  }) || []

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (selectedPatient) {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-[#008bcd]/10 border border-[#008bcd]/30 rounded-xl h-11 shadow-sm animate-in fade-in duration-200">
        <div className="flex items-center gap-2 overflow-hidden">
          <CheckCircle2 className="w-4 h-4 text-[#008bcd] shrink-0" />
          <span className="font-bold text-[#008bcd] truncate">
            {selectedPatient.firstName} {selectedPatient.lastName}
          </span>
          <span className="text-[#008bcd]/70 font-semibold text-xs shrink-0 ml-1">
            (CI: {selectedPatient.ci})
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-3 text-[#008bcd] hover:bg-[#008bcd]/20 hover:text-[#008bcd] font-bold rounded-lg"
          onClick={() => {
            setPatientId("")
            setSearchTerm("")
          }}
        >
          Cambiar
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={isLoading ? "Cargando pacientes..." : "Escribe el nombre, apellido o CI..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          disabled={isLoading}
          className="pl-9 bg-background border-border h-11 focus-visible:ring-[#008bcd] text-foreground placeholder:text-muted-foreground font-medium shadow-sm transition-all"
        />
      </div>

      {isOpen && searchTerm.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-1.5 bg-popover border border-border shadow-2xl rounded-xl z-[120] max-h-56 overflow-y-auto custom-scrollbar py-1 divide-y divide-border/40 animate-in fade-in slide-in-from-top-1 duration-150">
          {filteredPatients.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground font-medium">
              No se encontraron coincidencias para "{searchTerm}"
            </div>
          ) : (
            filteredPatients.map((patient: any) => (
              <div
                key={patient.id}
                className="flex flex-col px-4 py-2.5 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                onClick={() => {
                  setPatientId(patient.id)
                  setIsOpen(false)
                  setSearchTerm("")
                }}
              >
                <span className="font-bold text-sm text-foreground">
                  {patient.firstName} {patient.lastName}
                </span>
                <span className="text-muted-foreground font-semibold text-xs mt-0.5">
                  Cédula: {patient.ci}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}