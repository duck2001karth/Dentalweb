"use client"

import React, { useState, useEffect } from "react"
import { 
  Loader2, AlertCircle, CheckCircle2, CalendarIcon, 
  ArrowRight, Activity, Clock, Search, ChevronLeft, 
  ChevronRight, ChevronsLeft, ChevronsRight, User, Phone, ArrowDownAZ, ArrowUpZA,
  X, FileText
} from "lucide-react"
import { format, isToday } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { useGetPatients } from "@/hooks/patients"

const PatientSearchModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  
  const { patients, isLoading } = useGetPatients({ search: searchTerm })

  const searchResults = patients?.slice(0, 6) || []

  const handleGoToPatient = (patientId: string) => {
    onClose()
    router.push(`/paciente/${patientId}?tab=evoluciones`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) { setSearchTerm(""); onClose(); }
    }}>
      <DialogContent className="sm:max-w-[850px] bg-background border-border p-0 overflow-hidden rounded-2xl [&>button]:hidden">
        <DialogHeader className="px-6 py-5 border-b border-border bg-muted/30">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Search className="w-5 h-5 text-[#008bcd]" /> Búsqueda Rápida de Pacientes
              </DialogTitle>
              <DialogDescription className="mt-1">
                Busca un paciente específico para ir directamente a su historial de evoluciones.
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-background border shadow-sm hover:bg-red-50 hover:text-red-500">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 bg-slate-50/50 dark:bg-background">
          <div className="relative mb-6 max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#008bcd] w-5 h-5" />
            <Input 
              autoFocus
              placeholder="Escribe el nombre, apellido o número de cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6 text-base rounded-full border-2 border-border focus-visible:ring-0 focus-visible:border-[#008bcd] bg-card shadow-sm"
            />
          </div>

          <div className="min-h-[250px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#008bcd]">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm font-medium">Buscando pacientes...</p>
              </div>
            ) : searchTerm.length > 0 && searchResults.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No se encontraron resultados para "{searchTerm}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                {searchResults.map((patient: any) => (
                  <div key={patient.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-[#008bcd]/50 hover:shadow-md transition-all group gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 text-[#008bcd] flex items-center justify-center font-black text-lg border border-blue-500/20 shrink-0">
                        {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm sm:text-base leading-tight">
                          {patient.firstName} {patient.lastName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1.5">
                          <span className="bg-muted px-2 py-0.5 rounded text-foreground font-semibold">CI: {patient.ci}</span>
                          {patient.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {patient.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleGoToPatient(patient.id)} 
                      className="w-full sm:w-auto bg-[#008bcd] hover:bg-[#0070a8] text-white shadow-sm"
                    >
                      Abrir <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchTerm === "" && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-10" />
                <p className="text-sm">Comienza a escribir en la barra superior para ver los resultados aquí.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function GlobalEvolutionsPage() {
  const { toast } = useToast()
  
  const [evolutions, setEvolutions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "TODAY" | "UNSIGNED">("ALL")
  const [sortDesc, setSortDesc] = useState(true)
  
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    const fetchGlobalEvolutions = async () => {
      try {
        const res = await fetch('/api/clinical-notes/global')
        if (!res.ok) throw new Error()
        const data = await res.json()
        setEvolutions(data)
      } catch (error) {
        toast({ title: "Error", description: "No se pudieron cargar las evoluciones.", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    fetchGlobalEvolutions()
  }, [toast])

  let filteredEvolutions = evolutions.filter((evo) => {
    if (filter === "TODAY") return isToday(new Date(evo.createdAt))
    if (filter === "UNSIGNED") return !evo.isSigned
    return true 
  })

  filteredEvolutions = filteredEvolutions.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return sortDesc ? dateB - dateA : dateA - dateB
  })

  useEffect(() => { setCurrentPage(1) }, [filter, sortDesc])

  const totalItems = filteredEvolutions.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEvolutions = filteredEvolutions.slice(startIndex, endIndex)

  const countToday = evolutions.filter(evo => isToday(new Date(evo.createdAt))).length
  const countUnsigned = evolutions.filter(evo => !evo.isSigned).length

  return (
    <AppLayout>
      <div className="w-full px-4 md:px-6 py-6 lg:py-8 animate-in fade-in duration-300 flex flex-col min-h-[calc(100vh-70px)]">
        
        <PatientSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-blue-500/10 text-[#008bcd] rounded-xl shadow-sm border border-blue-500/20">
                <Activity className="w-6 h-6" />
              </div>
              Auditoría de Evoluciones
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona, revisa y firma los planes de tratamiento registrados en los últimos 7 días.
            </p>
          </div>

          <Button 
            onClick={() => setIsSearchModalOpen(true)}
            className="bg-card hover:bg-muted text-foreground border border-border shadow-sm rounded-xl py-6 px-6 w-full md:w-auto flex items-center justify-start md:justify-center gap-3 transition-all group"
          >
            <Search className="w-6 h-6 text-[#008bcd] group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="block font-bold text-sm">Búsqueda Rápida de Pacientes</span>
              <span className="block text-xs text-muted-foreground font-normal">Accede directo a su historial</span>
            </div>
          </Button>
        </div>

        {/* --- CORRECCIÓN EN LA BOTONERA DE FILTROS --- */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex flex-wrap gap-2 bg-card p-1.5 rounded-xl border border-border shadow-sm">
            
            <Button 
              variant="ghost" size="sm" onClick={() => setFilter("ALL")}
              className={cn("rounded-lg font-semibold transition-all", 
                filter === "ALL" 
                  ? "bg-[#008bcd] text-white hover:bg-[#0070a8] dark:bg-[#008bcd] dark:hover:bg-[#0070a8] dark:text-white" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <CalendarIcon className="w-4 h-4 mr-2" /> Todos (7 días)
            </Button>
            
            <Button 
              variant="ghost" size="sm" onClick={() => setFilter("TODAY")}
              className={cn("rounded-lg font-semibold transition-all", 
                filter === "TODAY" 
                  ? "bg-[#008bcd] text-white hover:bg-[#0070a8] dark:bg-[#008bcd] dark:hover:bg-[#0070a8] dark:text-white" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Clock className="w-4 h-4 mr-2" /> Hoy 
              <span className={cn("ml-2 px-2 py-0.5 rounded-full text-[10px]", 
                filter === "TODAY" ? "bg-white/20 text-white" : "bg-muted-foreground/20 text-muted-foreground"
              )}>{countToday}</span>
            </Button>
            
            <Button 
              variant="ghost" size="sm" onClick={() => setFilter("UNSIGNED")}
              className={cn("rounded-lg font-semibold relative transition-all", 
                filter === "UNSIGNED" 
                  ? "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 dark:text-white" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <AlertCircle className="w-4 h-4 mr-2" /> Sin Firmar
              {countUnsigned > 0 && (
                <span className={cn("ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold", 
                  filter === "UNSIGNED" ? "bg-white text-red-500" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                )}>
                  {countUnsigned}
                </span>
              )}
            </Button>

          </div>

          <Button variant="outline" size="sm" onClick={() => setSortDesc(!sortDesc)} className="bg-card font-medium">
            {sortDesc ? <ArrowDownAZ className="w-4 h-4 mr-2"/> : <ArrowUpZA className="w-4 h-4 mr-2"/>}
            {sortDesc ? "Más recientes primero" : "Más antiguas primero"}
          </Button>
        </div>

        {/* TABLA DE EVOLUCIONES */}
        <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden flex-1">
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead className="bg-muted/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
                <tr className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Fecha y Hora</th>
                  <th className="p-4">Paciente</th>
                  <th className="p-4">Resumen Clínico</th>
                  <th className="p-4">Profesional</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 pr-6 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-[#008bcd]">
                        <Loader2 className="w-10 h-10 animate-spin" />
                        <p className="font-semibold text-muted-foreground">Sincronizando registros clínicos...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentEvolutions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle2 className="w-16 h-16 opacity-20 mb-4 text-emerald-500" />
                        <p className="font-bold text-lg text-foreground">¡Todo al día!</p>
                        <p className="text-sm mt-1 text-muted-foreground">No hay evoluciones que coincidan con este filtro en esta página.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentEvolutions.map((evo) => (
                    <tr key={evo.id} className="hover:bg-muted/30 transition-colors cursor-default">
                      <td className="p-4 pl-6 whitespace-nowrap">
                        <div className="font-bold text-foreground">{format(new Date(evo.createdAt), "dd MMM yyyy", { locale: es })}</div>
                        <div className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3"/> {format(new Date(evo.createdAt), "HH:mm")}
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div className="font-bold text-foreground">{evo.patient?.firstName} {evo.patient?.lastName}</div>
                        <div className="text-xs font-semibold text-muted-foreground mt-1 bg-muted inline-block px-2 py-0.5 rounded border border-border">CI: {evo.patient?.ci}</div>
                      </td>
                      
                      <td className="p-4 max-w-[300px]">
                        <p className="truncate text-muted-foreground text-xs leading-relaxed" title={evo.content}>
                          {evo.content}
                        </p>
                      </td>
                      
                      <td className="p-4 text-foreground font-medium text-xs flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {evo.author?.name ? evo.author.name.charAt(0) : "D"}
                        </div>
                        <span className="truncate max-w-[120px]" title={evo.author?.name || "Dr. Asignado"}>
                          {evo.author?.name || "Dr. Asignado"}
                        </span>
                      </td>
                      
                      <td className="p-4 text-center">
                        {evo.isSigned || evo.professionalSignature ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Firmada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-800 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" /> Pendiente
                          </span>
                        )}
                      </td>
                      
                      <td className="p-4 pr-6 text-center">
                        <Link href={`/paciente/${evo.patientId}?tab=evoluciones`}>
                          <button className="inline-flex items-center justify-center gap-2 text-[#008bcd] dark:text-blue-400 bg-blue-500/10 hover:bg-[#008bcd] hover:text-white dark:hover:bg-blue-600 transition-all font-semibold px-4 py-2 rounded-lg text-sm border border-transparent hover:shadow-md">
                            <FileText className="w-4 h-4" /> Ir a la ficha
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- FOOTER DE PAGINACIÓN --- */}
          {!isLoading && totalItems > 0 && (
            <div className="border-t border-border bg-card px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="text-sm text-muted-foreground font-medium">
                Mostrando del {startIndex + 1} al {Math.min(endIndex, totalItems)} de {totalItems} registro(s)
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-foreground font-medium">
                  Página {currentPage} de {totalPages}
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-background border-border"
                    onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-background border-border"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-background border-border"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-background border-border"
                    onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  )
}