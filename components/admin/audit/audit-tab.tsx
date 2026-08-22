"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { 
  History, Activity, Search, Loader2, Download, RefreshCw, Filter, FileText
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AuditStats } from "@/components/admin/audit/audit-stats"
import { SystemTerminal } from "@/components/admin/audit/system-terminal"

export function AuditoriaClient() {
  const [activeTab, setActiveTab] = useState<"auditoria" | "sistema">("auditoria")
  const [logs, setLogs] = useState<any[]>([])
  const [systemLogs, setSystemLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("ALL")

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

  const parseLogDetails = (log: any) => {
  const text = log.details || ""
  const match = text.match(/^\[(.*?)\]\s*(.*)$/)
  
  if (match) {
    return {
      moduleName: match[1], 
      cleanDetails: match[2] 
    }
  }

  return {
    moduleName: log.target || "General",
    cleanDetails: text
  }
}

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = 
        log.details?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchAction = actionFilter === "ALL" || log.action === actionFilter
      
      return matchSearch && matchAction
    })
  }, [logs, searchTerm, actionFilter])

  const exportToCSV = () => {
    const BOM = "\uFEFF"
    const headers = "Fecha,Usuario,Acción,Módulo,Detalles,IP\n"
    const rows = filteredLogs.map(l => {
      const date = format(new Date(l.createdAt), "yyyy-MM-dd HH:mm:ss")
      const user = l.user?.name || "Sistema"
      return `"${date}","${user}","${l.action}","${l.target}","${l.details?.replace(/"/g, '""')}","${l.ipAddress}"`
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
    switch (action) {
      case "CREATE": return <span className="text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">Creación</span>
      case "UPDATE": return <span className="text-[#008bcd] bg-[#008bcd]/10 border border-[#008bcd]/20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">Edición</span>
      case "DELETE": return <span className="text-rose-600 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">Eliminación</span>
      case "LOGIN": return <span className="text-purple-600 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">Acceso</span>
      default: return <span className="text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-md text-[10px] font-black uppercase">Sistema</span>
    }
  }

  return (
    <div className="w-full space-y-6 font-sans antialiased animate-in fade-in duration-200">
      
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

      {/* KPIS Y TABS */}
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
        <div className="bg-card border border-border rounded-[24px] shadow-xs overflow-hidden flex flex-col">
          
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
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <select 
                value={actionFilter} 
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full sm:w-auto h-10 px-3 rounded-xl border border-border bg-background text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-[#008bcd]/30 transition-all"
              >
                <option value="ALL">Todas las acciones</option>
                <option value="CREATE">Creación</option>
                <option value="UPDATE">Edición</option>
                <option value="DELETE">Eliminación</option>
                <option value="LOGIN">Acceso (Logins)</option>
              </select>
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
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs font-bold text-foreground">No hay registros coincidentes</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                  const { moduleName, cleanDetails } = parseLogDetails(log)

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
                        <p className="text-foreground max-w-[450px] truncate font-medium text-xs" title={cleanDetails}>
                          {cleanDetails}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-right flex flex-col items-end justify-center">
                        <p className="font-bold text-foreground capitalize">
                          {formatDistanceToNow(new Date(log.createdAt), { locale: es, addSuffix: true })}
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
        </div>
      ) : (
        /* PESTAÑA: LOGS DEL SISTEMA */
        <SystemTerminal systemLogs={systemLogs} />
      )}
    </div>
  )
}