"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  Plus, Search, Phone, Mail, FileText, AlertTriangle, 
  ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, 
  User, Loader2 
} from "lucide-react"

import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { useGetPatients } from "@/hooks/patients"
import { NewPatientModal } from "@/components/patients/patients-form"

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 7 
  const { patients, isLoading, refetch } = useGetPatients({ search: searchTerm })

  const totalItems = patients?.length || 0
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPatients = patients?.slice(startIndex, endIndex) || []
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  return (
    <AppLayout>
      <div className="flex flex-col w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 h-[calc(100vh-4rem)]">
        
        {/* --- ENCABEZADO --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-[#008bcd] dark:text-blue-400 rounded-xl shadow-xs border border-blue-500/20">
                <User size={24} />
              </div>
              Directorio de Pacientes
            </h1>
            <p className="text-muted-foreground mt-2">Busca, gestiona y accede a las fichas clínicas de tus pacientes.</p>
          </div>
          <NewPatientModal onSuccess={() => refetch?.()} />
        </div>

        {/* --- BARRA DE BÚSQUEDA --- */}
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs mb-6 flex items-center shrink-0 transition-all focus-within:border-blue-400/50 focus-within:ring-4 focus-within:ring-blue-500/10 text-card-foreground">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar por CI, nombre o apellido..." 
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008bcd]/20 focus:border-[#008bcd]/50 transition-all text-sm text-foreground placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="ml-auto text-sm text-muted-foreground font-medium hidden sm:block">
            {isLoading ? (
              <span className="flex items-center gap-2 text-[#008bcd] dark:text-blue-400"><Loader2 className="w-4 h-4 animate-spin"/> Buscando...</span>
            ) : (
              <span>Mostrando {totalItems} pacientes en total</span>
            )}
          </div>
        </div>

        {/* --- TABLA DE PACIENTES --- */}
        <div className="bg-card rounded-xl border border-border shadow-xs flex-1 overflow-hidden flex flex-col text-card-foreground">
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs border-b border-border z-10">
                <tr className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4">CI / Identificación</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-[#008bcd] dark:text-blue-400">
                        <Loader2 className="w-10 h-10 animate-spin" />
                        <p className="font-semibold text-muted-foreground">Sincronizando con la base de datos...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentPatients && currentPatients.length > 0 ? (
                  currentPatients.map((patient: any) => (
                    <tr key={patient.id} className="hover:bg-muted/30 transition-colors group cursor-default">
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-[#008bcd] dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-500/20 shadow-xs shrink-0">
                            {patient.firstName?.charAt(0) || ""}{patient.lastName?.charAt(0) || ""}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-base">{patient.firstName} {patient.lastName}</p>
                            <div className="mt-1">
                              {patient.medicalAlerts ? (
                                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
                                  <AlertTriangle size={10} /> Alerta Médica
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground font-medium">Sin alertas registradas</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted text-foreground text-sm font-semibold tracking-wide border border-border">
                          {patient.ci || "Sin CI"}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Phone className="w-4 h-4 opacity-70" /> {patient.phone || "Sin teléfono"}
                          </span>
                          <span className="flex items-center gap-2">
                            <Mail className="w-4 h-4 opacity-70" /> {patient.email || "Sin correo"}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <Link href={`/paciente/${patient.id}`}>
                          <button className="inline-flex items-center justify-center gap-2 text-[#008bcd] dark:text-blue-400 bg-blue-500/10 hover:bg-[#008bcd] hover:text-white dark:hover:bg-blue-600 transition-all font-semibold px-4 py-2 rounded-lg text-sm border border-transparent hover:shadow-md focus:ring-2 focus:ring-blue-400/50 outline-none">
                            <FileText className="w-4 h-4" /> Ficha Clínica <ChevronRight className="w-4 h-4 opacity-50" />
                          </button>
                        </Link>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 border border-border shadow-xs">
                          <Search className="w-8 h-8 text-muted-foreground opacity-50" />
                        </div>
                        <p className="text-foreground font-semibold text-lg">No se encontraron pacientes</p>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                          {searchTerm 
                            ? `No hay coincidencias para "${searchTerm}".` 
                            : "Aún no hay pacientes registrados en el sistema."}
                        </p>
                        {searchTerm && (
                          <button 
                            onClick={() => {
                              setSearchTerm("")
                              setCurrentPage(1)
                            }}
                            className="mt-4 text-[#008bcd] dark:text-blue-400 hover:underline text-sm font-medium"
                          >
                            Limpiar búsqueda
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>

          {/* --- PAGINACIÓN --- */}
          {!isLoading && totalItems > 0 && (
            <div className="border-t border-border bg-card px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="text-sm text-muted-foreground font-medium">
                Mostrando del {startIndex + 1} al {Math.min(endIndex, totalItems)} de {totalItems} paciente(s)
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-foreground font-medium">
                  Página {currentPage} de {totalPages}
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-background border-border text-foreground hover:bg-accent"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-background border-border text-foreground hover:bg-accent"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-background border-border text-foreground hover:bg-accent"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-background border-border text-foreground hover:bg-accent"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
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