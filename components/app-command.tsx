"use client"

import * as React from "react"
import { Search, Loader2, User, ArrowRight } from "lucide-react" 
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { useGetPatients } from "@/hooks/patients" 

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      window.clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function AppCommand({ className, ...props }: any) {
  const router = useRouter()
  const ref = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  const [isFocused, setIsFocused] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const debouncedQuery = useDebounce(query, 400)

  const { patients, isLoading } = useGetPatients({
    search: debouncedQuery,
    skip: !debouncedQuery, 
  })

  const filteredPatients = React.useMemo(() => {
    if (!query) return []
    const q = query.toLowerCase()
    return (patients || []).filter((p: any) => 
      p.firstName?.toLowerCase().includes(q) || 
      p.lastName?.toLowerCase().includes(q) || 
      p.ci?.toLowerCase().includes(q)
    ).slice(0, 5)
  }, [query, patients])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!query.trim()) return
    setIsOpen(false)
    router.push(`/pacientes?q=${encodeURIComponent(query)}`)
    ref.current?.blur()
  }

  const navigateToPatient = (id: string) => {
    setIsOpen(false)
    setQuery("")
    ref.current?.blur()
    router.push(`/paciente/${id}`)
  }

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-[600px] z-50 print:hidden", className)}>
      <form onSubmit={handleSubmit} className="w-full relative transition-all duration-300">

        <div className={cn(
          "relative flex items-center w-full rounded-full border bg-background transition-all duration-300",
          isFocused ? "border-[#008bcd]/50 shadow-md shadow-blue-500/10 ring-4 ring-[#008bcd]/10" : "border-border shadow-sm hover:border-slate-300"
        )}>
          <div className="pl-4 pr-2 text-muted-foreground">
            <Search size={18} className={isFocused ? "text-[#008bcd]" : ""} />
          </div>

          <input
            ref={ref}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            className="flex-1 h-11 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 px-2 font-medium"
            placeholder="Buscar paciente por nombre o CI..."
            onFocus={() => {
              setIsFocused(true)
              if (query) setIsOpen(true)
            }}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          <div className="pr-3 flex items-center">
            {isLoading ? (
               <Loader2 className="animate-spin text-[#008bcd]" size={18} />
            ) : (
               <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-muted/50 px-2 text-[10px] font-medium text-muted-foreground opacity-70">
                 <span className="text-xs">⌘</span>K
               </kbd>
            )}
          </div>
        </div>
      </form>

      {/* DROPDOWN (MODAL FLOTANTE DE RESULTADOS) */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-full bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center text-muted-foreground text-sm font-medium">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#008bcd]" /> Buscando pacientes...
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="flex flex-col">
              <div className="px-4 py-2.5 bg-muted/30 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Pacientes Encontrados
              </div>
              {filteredPatients.map((patient: any) => (
                <button
                  key={patient.id}
                  onClick={() => navigateToPatient(patient.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 text-left transition-colors border-b border-border/50 last:border-0 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center font-bold text-xs shrink-0">
                      {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-bold text-foreground text-sm group-hover:text-[#008bcd] transition-colors truncate">
                        {patient.firstName} {patient.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">CI: {patient.ci}</span>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center group-hover:border-[#008bcd]/30 group-hover:bg-[#008bcd]/5 transition-colors">
                    <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-[#008bcd]" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <User className="w-6 h-6 text-muted-foreground opacity-50" />
              </div>
              <p className="text-sm font-bold text-foreground">Paciente no encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">No hay resultados para "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}