"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { 
  History, Activity, Search, Loader2, Download, 
  RefreshCw, Filter, FileText, ChevronLeft, ChevronRight, Eye 
} from "lucide-react"
import { format, formatDistanceToNow, isValid } from "date-fns"
import { es } from "date-fns/locale"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuditStats } from "@/components/admin/audit/audit-stats"
import { SystemTerminal } from "@/components/admin/audit/system-terminal"
import { AuditDetailsModal } from "@/components/admin/audit/audit-details-modal"

const ITEMS_PER_PAGE = 15

export function AuditoriaClient() {
  const [activeTab, setActiveTab] = useState<"auditoria" | "sistema">("auditoria")
  const [logs, setLogs] = useState<any[]>([])
  const [systemLogs, setSystemLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("ALL")
  const [currentPage, setCurrentPage] = useState(1)

  // Estados para el Modal de Detalles
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const [resAudit, resSystem] = await Promise.all([
        fetch('/api/admin/audit').catch(() => null),
        fetch('/api/admin/system-logs').catch(() => null)
      ])
      
      if (resAudit?.ok) setLogs(await resAudit.json())
      if (resSystem?.ok) setSystemLogs(await resSystem.json())
    } catch (error) { 
      console.error("Error cargando auditoría", error) 
    } finally { 
      setIsLoading(false) 
    }
  }, [])

  useEffect(() => { 
    fetchLogs() 
  }, [fetchLogs])

  // Resetear página al buscar o filtrar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, actionFilter])

  const openDetails = (log: any) => {
    setSelectedLog(log)
    setIsDetailsModalOpen(true)
  }

  const parseLogDetails = (log: any) => {
    const text = log.details || ""
    
    const match = text.match(/^\[(.*?)\]\s*(.*)$/)
    if (match) {
      return { moduleName: match[1], cleanDetails: match[2] }
    }

    const rawModule = String(log.entity || log.target || "General")
    const normalizedKey = rawModule.toLowerCase()

    const moduleTranslations: Record<string, string> = {
      "inventorymovement": "Bodega / Stock",
      "inventoryitem": "Catálogo Insumos",
      "taxdocument": "Facturación SRI",
      "payment": "Caja y Pagos",
      "patient": "Pacientes",
      "user": "Usuarios",
      "appointment": "Agenda y Citas",
      "treatment": "Tratamientos",
      "treatmentplan": "Planes Clínicos",
      "clinicsettings": "Configuración Clínica",
      "general": "General"
    }

    return { 
      moduleName: moduleTranslations[normalizedKey] || rawModule, 
      cleanDetails: text 
    }
  }

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = 
        log.details?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchAction = actionFilter === "ALL" 
        ? true 
        : log.action?.toUpperCase().includes(actionFilter)
      
      return matchSearch && matchAction
    })
  }, [logs, searchTerm, actionFilter])

  // Paginación
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const exportToCSV = () => {
    const BOM = "\uFEFF"
    const headers = "Fecha,Usuario,Acción,Módulo,Detalles,IP\n"
    const rows = filteredLogs.map(l => {
      const dateObj = new Date(l.createdAt)
      const date = isValid(dateObj) ? format(dateObj, "yyyy-MM-dd HH:mm:ss") : "Fecha inválida"
      const user = l.user?.name || "Sistema"
      const moduleName = l.entity || l.target || "General"
      return `"${date}","${user}","${l.action}","${moduleName}","${l.details?.replace(/"/g, '""')}","${l.ipAddress}"`
    }).join("\n")

    const blob = new Blob([BOM + headers + rows], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `auditoria_sistema_${format(new Date(), "yyyyMMdd_HHmm")}.csv`
    link.click()
  }

  const getInitials = (name: string) => {
    if (!name) return "SI"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const getActionBadge = (action: string) => {
    const upperAction = action?.toUpperCase() || ""

    if (upperAction.includes("CREATE") || upperAction === "INVENTORY_INCOMING") {
      return (
        <span className="text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">
          {upperAction === "INVENTORY_INCOMING" ? "Entrada Stock" : "Creación"}
        </span>
      )
    }
    if (upperAction.includes("UPDATE")) {
      return (
        <span className="text-[#008bcd] bg-[#008bcd]/10 border border-[#008bcd]/20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">
          Edición
        </span>
      )
    }
    if (upperAction.includes("DELETE") || upperAction.includes("PURGE") || upperAction === "INVENTORY_OUTGOING") {
      return (
        <span className="text-rose-600 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">
          {upperAction === "INVENTORY_OUTGOING" ? "Salida Stock" : "Eliminación"}
        </span>
      )
    }
    if (upperAction.includes("DEACTIVATE") || upperAction.includes("ARCHIVE")) {
      return (
        <span className="text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">
          Archivado
        </span>
      )
    }
    if (upperAction.includes("LOGIN")) {
      return (
        <span className="text-purple-600 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">
          Acceso
        </span>
      )
    }
    
    return (
      <span className="text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-md text-[10px] font-black uppercase">
        Sistema
      </span>
    )
  }

  return (
    <div className="w-full space-y-6 font-sans antialiased animate-in fade-in duration-200 pb-10">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-[#008bcd]/15 text-[#008bcd]">
              Trazabilidad y Seguridad
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mt-1">
            Auditoría de Sistema
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Monitorea la actividad de los usuarios y registros técnicos de la base de datos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="icon" onClick={fetchLogs} className="h-10 w-10 rounded-xl border-border bg-card hover:bg-muted shadow-none">
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          
          <Button onClick={exportToCSV} variant="outline" className="h-10 px-4 rounded-xl border-border bg-card hover:bg-muted font-bold text-xs gap-2 transition-all shadow-none">
            <Download className="w-4 h-4 text-[#008bcd]" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIS */}
      <AuditStats logs={logs} />

      {/* PESTAÑAS */}
      <div className="flex gap-2 border-b border-border/60 pb-4">
        <button 
          onClick={() => setActiveTab("auditoria")} 
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === "auditoria" ? "bg-[#008bcd] text-white shadow-md shadow-[#008bcd]/20" : "bg-card border border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
        >
          <History size={16}/> Historial de Acciones
        </button>
        <button 
          onClick={() => setActiveTab("sistema")} 
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === "sistema" ? "bg-[#008bcd] text-white shadow-md shadow-[#008bcd]/20" : "bg-card border border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
        >
          <Activity size={16}/> Logs Técnicos / Servidor
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {activeTab === "auditoria" ? (
        <div className="bg-card border border-border rounded-[24px] shadow-sm overflow-hidden flex flex-col">
          
          {/* BARRA DE FILTROS */}
          <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Buscar en la auditoría..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10 h-10 bg-background border-border rounded-xl text-xs font-medium focus-visible:ring-[#008bcd]/30" 
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-[180px]">
              <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="h-10 rounded-xl bg-background border-border text-xs font-bold focus:ring-[#008bcd]/30 w-full">
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/80">
                  <SelectItem value="ALL" className="text-xs font-bold">Todas las acciones</SelectItem>
                  <SelectItem value="CREATE" className="text-xs font-bold text-emerald-600">Creaciones</SelectItem>
                  <SelectItem value="UPDATE" className="text-xs font-bold text-[#008bcd]">Ediciones</SelectItem>
                  <SelectItem value="DELETE" className="text-xs font-bold text-rose-600">Eliminaciones</SelectItem>
                  <SelectItem value="INCOMING" className="text-xs font-bold text-emerald-600">Entrada Stock</SelectItem>
                  <SelectItem value="OUTGOING" className="text-xs font-bold text-rose-600">Salida Stock</SelectItem>
                  <SelectItem value="LOGIN" className="text-xs font-bold text-purple-600">Accesos (Logins)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-muted/30 border-b border-border text-[11px] uppercase text-muted-foreground font-black">
                <tr>
                  <th className="px-6 py-3.5">Usuario Operador</th>
                  <th className="px-6 py-3.5">Acción</th>
                  <th className="px-6 py-3.5">Módulo Afectado</th>
                  <th className="px-6 py-3.5 w-full">Detalles del Evento</th>
                  <th className="px-6 py-3.5 text-right">Tiempo e IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#008bcd] mx-auto mb-3 stroke-[2.5]" /><p className="text-xs font-bold text-muted-foreground">Analizando bitácora...</p></td></tr>
                ) : paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs font-bold text-foreground">No hay registros coincidentes</p>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                  const { moduleName, cleanDetails } = parseLogDetails(log)
                  const dateObj = new Date(log.createdAt)

                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-all">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 flex items-center justify-center font-black text-[10px] shrink-0">
                            {getInitials(log.user?.name)}
                          </div>
                          <span className="font-bold text-foreground">{log.user?.name || "Sistema Automático"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">{getActionBadge(log.action)}</td>
                      <td className="px-6 py-3">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-[#008bcd]/10 text-[#008bcd] border border-[#008bcd]/20">
                          {moduleName}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-between gap-4 max-w-[450px]">
                          <p className="text-foreground truncate font-medium text-xs flex-1" title={cleanDetails}>
                            {cleanDetails}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openDetails(log)}
                            className="h-7 w-7 rounded-lg shrink-0 text-[#008bcd] hover:text-white hover:bg-[#008bcd] transition-colors bg-[#008bcd]/10"
                            title="Ver detalles completos"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right flex flex-col items-end justify-center">
                        <p className="font-bold text-foreground capitalize">
                          {isValid(dateObj) ? formatDistanceToNow(dateObj, { locale: es, addSuffix: true }) : "Fecha desconocida"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {log.ipAddress === "::1" ? "127.0.0.1" : (log.ipAddress || "Interno")}
                        </p>
                      </td>
                    </tr>
                  )
                })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          {!isLoading && totalPages > 1 && (
            <div className="border-t border-border/60 p-4 flex items-center justify-between bg-muted/10">
              <p className="text-xs text-muted-foreground font-medium">
                Mostrando {paginatedLogs.length} de {filteredLogs.length} registros
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="w-8 h-8 rounded-lg" 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-bold px-2">Pág. {currentPage} de {totalPages}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="w-8 h-8 rounded-lg" 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* PESTAÑA: LOGS DEL SISTEMA */
        <SystemTerminal systemLogs={systemLogs} />
      )}

      {/* MODAL DE DETALLES */}
      <AuditDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        log={selectedLog} 
      />
    </div>
  )
}