"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { 
  Search, Phone, Mail, FileText, AlertTriangle, 
  ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, 
  User, Loader2, Users, AlertCircle, HeartPulse
} from "lucide-react"

import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { useGetPatients } from "@/hooks/patients"
import { NewPatientModal } from "@/components/patients/patient-form"

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 7 
  
  const { patients, isLoading, refetch } = useGetPatients({ search: searchTerm })
  const getAvatarColor = (name: string = "") => {
    const colors = [
      "bg-blue-500/10 text-blue-500 border-blue-500/20",
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      "bg-purple-500/10 text-purple-500 border-purple-500/20",
      "bg-amber-500/10 text-amber-500 border-amber-500/20",
      "bg-rose-500/10 text-rose-500 border-rose-500/20",
      "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  const totalItems = patients?.length || 0
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPatients = patients?.slice(startIndex, endIndex) || []

  const alertsCount = useMemo(() => patients?.filter((p: any) => p.medicalAlerts).length || 0, [patients])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  return (
    <AppLayout>
      <div className="w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 font-sans antialiased animate-in fade-in duration-300">
        
        {/* --- CABECERA --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-[#008bcd]/10 text-[#008bcd] rounded-xl shadow-xs border border-[#008bcd]/20 flex items-center justify-center">
                <User size={22} className="stroke-[2.5]" />
              </div>
              Directorio de Pacientes
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 font-medium">
              Busca, gestiona y accede a las fichas clínicas de tus pacientes.
            </p>
          </div>
          <div className="shrink-0">
            <NewPatientModal onSuccess={() => refetch?.()} />
          </div>
        </div>

        {/*KPIs DE RESUMEN CLÍNICO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <div className="bg-card border border-border rounded-[20px] p-5 flex items-center gap-4 shadow-sm hover:border-[#008bcd]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center shrink-0 border border-[#008bcd]/20">
              <Users className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Pacientes</p>
              <p className="text-2xl font-black text-foreground">{totalItems}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-[20px] p-5 flex items-center gap-4 shadow-sm hover:border-rose-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20">
              <AlertCircle className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Con Alertas Médicas</p>
              <p className="text-2xl font-black text-foreground">{alertsCount}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-[20px] p-5 flex items-center gap-4 shadow-sm hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <HeartPulse className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Estado de Salud</p>
              <p className="text-sm font-bold text-emerald-500 mt-1">Directorio Optimizado</p>
            </div>
          </div>
        </div>

        {/* --- CONTENEDOR PRINCIPAL (BUSCADOR + TABLA) --- */}
        <div className="bg-card border border-border rounded-[24px] shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border/60 bg-muted/10 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:max-w-[400px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por CI, nombre o apellido..." 
                className="w-full pl-10 pr-4 h-10 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008bcd]/30 transition-all text-xs font-medium text-foreground placeholder:text-muted-foreground"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="text-xs text-muted-foreground font-bold flex items-center gap-2">
              {isLoading ? (
                <span className="flex items-center gap-2 text-[#008bcd]"><Loader2 className="w-3.5 h-3.5 animate-spin"/> Sincronizando...</span>
              ) : (
                <span>Mostrando {totalItems} pacientes en total</span>
              )}
            </div>
          </div>

          {/* TABLA */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-muted/30 border-b border-border text-[11px] uppercase text-muted-foreground font-black">
                <tr>
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4">CI / Identificación</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-24 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#008bcd] mx-auto mb-3 stroke-[2.5]" />
                      <p className="text-xs font-bold text-muted-foreground">Cargando directorio de pacientes...</p>
                    </td>
                  </tr>
                ) : currentPatients.length > 0 ? (
                  currentPatients.map((patient: any) => (
                    <tr key={patient.id} className="hover:bg-muted/30 transition-colors group">
                      
                      {/* PACIENTE */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm border shadow-xs shrink-0 ${getAvatarColor(patient.firstName)}`}>
                            {patient.firstName?.charAt(0) || ""}{patient.lastName?.charAt(0) || ""}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm">{patient.firstName} {patient.lastName}</p>
                            <div className="mt-1">
                              {patient.medicalAlerts ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                                  <AlertTriangle size={11} className="stroke-[2.5]" /> Alerta Médica
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground font-medium">Sin alertas registradas</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* IDENTIFICACIÓN */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-xs font-bold tracking-wider shadow-sm">
                          {patient.ci || "Sin Identificación"}
                        </span>
                      </td>
                      
                      {/* CONTACTO */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 opacity-70" /> {patient.phone || "Sin teléfono"}
                          </span>
                          <span className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 opacity-70" /> {patient.email || "Sin correo"}
                          </span>
                        </div>
                      </td>
                      
                      {/* ACCIONES */}
                      <td className="px-6 py-4 text-right">
                        <Link href={`/paciente/${patient.id}`}>
                          <button className="inline-flex items-center justify-center gap-2 text-[#008bcd] bg-[#008bcd]/10 hover:bg-[#008bcd] hover:text-white transition-all font-bold px-4 py-2 rounded-xl text-xs border border-[#008bcd]/20 hover:shadow-md">
                            <FileText className="w-3.5 h-3.5" /> Ficha Clínica <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-border shadow-xs">
                        <Search className="w-8 h-8 text-muted-foreground opacity-50" />
                      </div>
                      <p className="text-foreground font-black text-base">No se encontraron pacientes</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">
                        {searchTerm ? `No hay coincidencias para "${searchTerm}".` : "Aún no hay pacientes registrados."}
                      </p>
                      {searchTerm && (
                        <Button variant="outline" onClick={() => { setSearchTerm(""); setCurrentPage(1) }} className="rounded-xl text-xs font-bold border-border">
                          Limpiar búsqueda
                        </Button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* --- PAGINACIÓN PREMIUM --- */}
          {!isLoading && totalItems > 0 && (
            <div className="border-t border-border/60 bg-muted/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground font-bold">
                Mostrando del {startIndex + 1} al {Math.min(endIndex, totalItems)} de {totalItems} paciente(s)
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-xs text-foreground font-black">
                  Página {currentPage} de {totalPages}
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-background border-border text-foreground hover:bg-muted" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-background border-border text-foreground hover:bg-muted" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-background border-border text-foreground hover:bg-muted" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-background border-border text-foreground hover:bg-muted" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
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