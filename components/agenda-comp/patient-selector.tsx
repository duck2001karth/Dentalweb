"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import type { CSSProperties, KeyboardEvent } from "react"
import { Check, Loader2, Search, UserRound, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type PatientOption = {
  id: string
  firstName?: string | null
  lastName?: string | null
  ci?: string | null
  phone?: string | null
}

interface PatientSelectorProps {
  patientId: string
  setPatientId: (id: string) => void
  patients: PatientOption[]
  isLoading: boolean
  themeColor?: string
}

const fullName = (patient: PatientOption) =>
  [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() || "Paciente sin nombre"

export function PatientSelector({
  patientId,
  setPatientId,
  patients = [],
  isLoading: _isLoading,
  themeColor: _themeColor = "#008bcd",
}: PatientSelectorProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<PatientOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeIndex, setActiveIndex] = useState(-1)
  const [rememberedPatient, setRememberedPatient] = useState<PatientOption | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const hintId = useId()

  const selectedPatient = useMemo(
    () =>
      (rememberedPatient?.id === patientId ? rememberedPatient : null) ??
      patients.find((patient) => String(patient.id) === String(patientId)) ??
      null,
    [patientId, patients, rememberedPatient]
  )

  useEffect(() => {
    if (!open || query.trim().length < 2 || patientId) {
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError("")
      try {
        const url = `/api/patients?search=${encodeURIComponent(query.trim())}&page=1&limit=20`
        const response = await fetch(url, {
          signal: controller.signal,
          cache: "no-store",
          credentials: "same-origin",
        })
        if (!response.ok) throw new Error("No fue posible consultar los pacientes")
        const json: unknown = await response.json()
        const list =
          json && typeof json === "object" && "patients" in json
            ? (json as { patients?: unknown }).patients
            : undefined
        if (!Array.isArray(list)) throw new Error("Respuesta de pacientes inválida")
        setResults(list.filter((item): item is PatientOption =>
          !!item && typeof item === "object" && typeof item.id === "string"
        ))
        setActiveIndex(-1)
      } catch (err) {
        if (controller.signal.aborted) return
        setResults([])
        setError(err instanceof Error ? err.message : "Error de conexión")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [open, query, patientId])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  const selectPatient = (patient: PatientOption) => {
    setRememberedPatient(patient)
    setPatientId(patient.id)
    setQuery("")
    setResults([])
    setOpen(false)
    setActiveIndex(-1)
  }

  const clearPatient = () => {
    setPatientId("")
    setRememberedPatient(null)
    setQuery("")
    setResults([])
    setOpen(false)
    setActiveIndex(-1)
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false)
      setActiveIndex(-1)
    } else if (open && results.length > 0 && event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (open && results.length > 0 && event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (open && event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault()
      selectPatient(results[activeIndex])
    }
  }

  if (patientId) {
    return (
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 font-sans">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {selectedPatient ? fullName(selectedPatient) : "Paciente seleccionado"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {selectedPatient ? `CI: ${selectedPatient.ci || "Sin documento"}` : "Selección conservada"}
            </p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={clearPatient} className="h-9 shrink-0 rounded-lg px-2.5 text-xs text-foreground hover:bg-muted" aria-label="Cambiar paciente">
          <X className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Cambiar
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full font-sans" style={{ "--patient-selector-accent": "var(--color-primary)" } as CSSProperties}>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && query.trim().length >= 2}
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          aria-describedby={hintId}
          placeholder="Buscar paciente por nombre, apellido o CI..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setResults([])
            setError("")
            setActiveIndex(-1)
            setOpen(true)
          }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeys}
          className="h-11 w-full rounded-xl border-border bg-background pl-10 pr-10 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        {loading && <Loader2 aria-label="Buscando" className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />}
      </div>
      <p id={hintId} className="sr-only">Escribe al menos dos caracteres. Usa las flechas para elegir y Enter para seleccionar.</p>

      {open && query.trim().length >= 2 && (
        <div id={listId} role="listbox" aria-label="Resultados de pacientes" className="absolute left-0 right-0 top-full z-[130] mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl">
          {loading ? (
            <p className="px-3 py-5 text-center text-xs text-muted-foreground">Buscando pacientes…</p>
          ) : error ? (
            <p role="alert" className="px-3 py-5 text-center text-xs text-destructive">{error}. Intenta nuevamente.</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-5 text-center text-xs text-muted-foreground">No hay coincidencias. Comprueba el nombre o CI.</p>
          ) : (
            results.map((patient, index) => (
              <button
                key={patient.id}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectPatient(patient)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none ${index === activeIndex ? "bg-accent" : ""}`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><UserRound className="h-4 w-4" aria-hidden="true" /></div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-popover-foreground">{fullName(patient)}</p>
                    <p className="truncate text-xs text-muted-foreground">CI: {patient.ci || "Sin documento"}</p>
                  </div>
                </div>
                <Check className="h-4 w-4 shrink-0 text-primary opacity-0" aria-hidden="true" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
