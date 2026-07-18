"use client"

import React, { useState, useEffect, useCallback } from "react"
import { History, Activity, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react"
import { format } from "date-fns"

export function AuditoriaClient() {
  const [activeTab, setActiveTab] = useState<"auditoria" | "sistema">("auditoria")
  const [logs, setLogs] = useState<any[]>([])
  const [systemLogs, setSystemLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const resAudit = await fetch('/api/admin/audit')
      if (resAudit.ok) setLogs(await resAudit.json())
      const resSystem = await fetch('/api/admin/system-logs')
      if (resSystem.ok) setSystemLogs(await resSystem.json())
    } catch (error) { console.error(error) } 
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE": return <span className="text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase">Creación</span>
      case "UPDATE": return <span className="text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-[10px] font-black uppercase">Edición</span>
      case "DELETE": return <span className="text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded text-[10px] font-black uppercase">Eliminación</span>
      default: return <span className="text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded text-[10px] font-black uppercase">Sistema</span>
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Auditoría de Sistema</h1>
        <p className="text-muted-foreground mt-1 font-medium">Monitorea la actividad de los usuarios y registros técnicos de la base de datos.</p>
      </div>

      <div className="flex gap-2 border-b border-border pb-4">
        <button onClick={() => setActiveTab("auditoria")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "auditoria" ? "bg-card text-primary shadow-sm border border-border" : "text-muted-foreground hover:bg-card/40"}`}><History size={16}/> Historial de Acciones</button>
        <button onClick={() => setActiveTab("sistema")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "sistema" ? "bg-card text-primary shadow-sm border border-border" : "text-muted-foreground hover:bg-card/40"}`}><Activity size={16}/> Logs Técnicos</button>
      </div>

      {activeTab === "auditoria" ? (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/30 border-b border-border text-muted-foreground">
              <tr>
                <th className="p-4 font-black uppercase text-xs">Fecha / Hora</th>
                <th className="p-4 font-black uppercase text-xs">Usuario</th>
                <th className="p-4 font-black uppercase text-xs">Acción</th>
                <th className="p-4 font-black uppercase text-xs">Módulo</th>
                <th className="p-4 font-black uppercase text-xs w-full">Detalles</th>
                <th className="p-4 font-black uppercase text-xs text-right">Dirección IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                 <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></td></tr>
              ) : logs.length === 0 ? (
                 <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No hay registros de auditoría.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-accent/40 text-foreground">
                    <td className="p-4 text-muted-foreground font-medium">{format(new Date(log.createdAt), "dd/MM/yyyy HH:mm")}</td>
                    <td className="p-4 font-bold">{log.user?.name || "Sistema"}</td>
                    <td className="p-4">{getActionBadge(log.action)}</td>
                    <td className="p-4 text-muted-foreground font-semibold">{log.target || "---"}</td>
                    <td className="p-4 text-muted-foreground">{log.details}</td>
                    <td className="p-4 text-muted-foreground font-mono text-xs text-right">{log.ipAddress || "0.0.0.0"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-950 dark:bg-black border border-border rounded-2xl shadow-sm p-6 text-slate-300 font-mono text-sm h-[600px] overflow-y-auto">
          <div className="flex items-center gap-2 text-emerald-400 mb-6 pb-4 border-b border-border/20"><CheckCircle size={16}/> <span>Servidor en ejecución. Monitoreo activado.</span></div>
          {systemLogs.length === 0 ? (
            <div className="flex items-start gap-3 py-2"><Info className="text-blue-400 shrink-0 mt-0.5" size={14}/> <p>[INFO] No se registran fallas críticas.</p></div>
          ) : (
            systemLogs.map((sysLog) => (
              <div key={sysLog.id} className="flex items-start gap-3 py-2 border-b border-border/10">
                <p><span className="opacity-40">[{sysLog.level}] {format(new Date(sysLog.createdAt), "yyyy-MM-dd HH:mm:ss")} -</span> {sysLog.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}