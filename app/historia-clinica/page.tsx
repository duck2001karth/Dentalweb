"use client"

import React, { useState, useEffect } from "react"
import { 
  Search, FileText, ArrowRight, Loader2, User, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  Phone, AlertTriangle, CheckCircle2, Pill, Droplet 
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { AppLayout } from "@/components/layouts/app-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useGetPatients } from "@/hooks/patients"

const calculateAge = (birthDateString?: string | Date | null) => {
  if (!birthDateString) return "--"
  const today = new Date()
  const birthDate = new Date(birthDateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

export default function HistoriaClinicaHubPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12 

  const { patients, isLoading } = useGetPatients({ search: searchTerm })

  const totalItems = patients?.length || 0
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPatients = patients?.slice(startIndex, endIndex) || []

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  return (
    <AppLayout>
      <div className="w-full px-4 md:px-6 py-6 lg:py-8 animate-in fade-in duration-500 flex flex-col min-h-[calc(100vh-70px)]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-10 bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-6 relative z-10 w-full lg:w-auto">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0 rotate-3 transition-transform hover:rotate-0">
              <FileText className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                Archivo Clínico Central
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm md:text-base max-w-md">
                Accede al expediente médico completo. Escribe el nombre o documento para abrir la ficha clínica.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-[400px] xl:w-[500px] relative z-10">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <Input 
                type="text" 
                placeholder="Buscar por cédula o apellidos..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-6 text-base rounded-xl border-2 border-border focus-visible:ring-0 focus-visible:border-emerald-500 bg-background shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-20 text-emerald-600">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="font-medium animate-pulse">Cargando archivo clínico...</p>
            </div>
          ) : currentPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-20 bg-card rounded-2xl border border-dashed border-border shadow-sm">
              <User className="w-16 h-16 text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-1">No se encontraron expedientes</h3>
              <p className="text-muted-foreground text-sm max-w-sm text-center">
                {searchTerm ? `No hay resultados para "${searchTerm}". Intenta con otro nombre o documento.` : "Aún no hay pacientes registrados en el sistema."}
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-6 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* CUADRÍCULA DE PACIENTES*/}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
                {currentPatients.map((patient: any) => (
                  <div key={patient.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:border-emerald-500/40 transition-all group flex flex-col h-full relative overflow-hidden">
                    
                    {patient.medicalAlerts && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-red-500/80"></div>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-5 mt-1">
                      
                      <div className="flex items-start gap-4 min-w-0">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border shrink-0",
                          patient.medicalAlerts 
                            ? "bg-red-500/10 text-red-600 border-red-500/20" 
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        )}>
                          {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-foreground text-lg truncate">
                            {patient.firstName} {patient.lastName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold bg-muted px-2 py-0.5 rounded border border-border text-foreground">
                              CI: {patient.ci}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/60 px-2 py-1 rounded-md">
                          {calculateAge(patient.birthDate)} años
                        </span>
                        {patient.grupoSanguineo && (
                          <span className="inline-flex items-center text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md border border-red-100 dark:border-red-900">
                            <Droplet className="w-3 h-3 mr-1 fill-current" /> {patient.grupoSanguineo}
                          </span>
                        )}
                      </div>

                    </div>

                    <div className="flex flex-col gap-2.5 mb-6 flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 opacity-70 shrink-0" />
                        <span className="truncate">{patient.phone || "Sin contacto registrado"}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Pill className="w-4 h-4 opacity-70 text-emerald-600 shrink-0" />
                        <span className="truncate font-medium">{patient.eps || "Sin seguro (Particular)"}</span>
                      </div>

                      {patient.medicalAlerts ? (
                        <div className="mt-1 flex items-start gap-2 text-xs font-medium text-red-700 dark:text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="line-clamp-2" title={patient.medicalAlerts}>
                            {patient.medicalAlerts}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-transparent">
                          <CheckCircle2 className="w-4 h-4 shrink-0 opacity-40 text-emerald-600" />
                          <span>Sin alertas médicas</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-emerald-600 transition-colors">
                        Módulo Historia
                      </span>
                      <Link href={`/paciente/${patient.id}?tab=historial`}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-lg px-4">
                          Abrir Ficha <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                      </Link>
                    </div>

                  </div>
                ))}
              </div>
              {totalItems > 0 && (
                <div className="mt-auto border-t border-border bg-card px-6 py-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground font-medium">
                    Mostrando del <span className="text-foreground">{startIndex + 1}</span> al <span className="text-foreground">{Math.min(endIndex, totalItems)}</span> de <span className="text-foreground">{totalItems}</span> expedientes
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
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}