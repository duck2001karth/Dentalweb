"use client"

import React, { useRef, useEffect } from "react"
import { CheckCircle, Info, AlertTriangle, XOctagon, Copy, TerminalSquare } from "lucide-react"
import { format, isValid } from "date-fns"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export interface SystemLog {
  level: string
  createdAt: string | Date
  message: string
}

export function SystemTerminal({ systemLogs = [] }: { systemLogs: SystemLog[] }) {
  const { toast } = useToast()
  const endOfLogsRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [systemLogs])

  const copyLogs = () => {
    if (systemLogs.length === 0) {
      toast({ title: "Terminal vacía", description: "No hay registros para copiar." })
      return
    }

    const text = systemLogs.map(l => {
      const dateObj = new Date(l.createdAt)
      const dateStr = isValid(dateObj) ? format(dateObj, "yyyy-MM-dd HH:mm:ss") : "Fecha desconocida"
      return `[${l.level?.toUpperCase() || "INFO"}] ${dateStr} - ${l.message}`
    }).join("\n")
    
    navigator.clipboard.writeText(text)
    toast({ title: "Logs copiados", description: "Contenido copiado al portapapeles." })
  }

  const getLogColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "ERROR": 
      case "FATAL": 
        return "text-rose-400"
      case "WARN": 
      case "WARNING": 
        return "text-amber-400"
      case "INFO": 
        return "text-sky-400"
      default: 
        return "text-slate-300"
    }
  }

  const getLogIcon = (level: string) => {
    switch (level?.toUpperCase()) {
      case "ERROR": 
      case "FATAL": 
        return <XOctagon size={14} className="text-rose-400 shrink-0 mt-0.5" />
      case "WARN": 
      case "WARNING": 
        return <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
      case "INFO": 
        return <Info size={14} className="text-sky-400 shrink-0 mt-0.5" />
      default: 
        return <TerminalSquare size={14} className="text-slate-500 shrink-0 mt-0.5" />
    }
  }

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-[24px] shadow-sm overflow-hidden flex flex-col h-[650px] relative">
      {/* Cabecera de Terminal */}
      <div className="bg-[#1e293b] px-4 py-3 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 mr-3">
            <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">server@carmo-dental:~/logs</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={copyLogs} 
          className="h-7 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar Salida
        </Button>
      </div>

      {/* Cuerpo de Terminal */}
      <div className="p-5 font-mono text-xs overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="flex items-center gap-2 text-emerald-400 mb-6 pb-4 border-b border-slate-800/50">
          <CheckCircle size={16}/> 
          <span>Conexión establecida. Monitoreo en tiempo real activado.</span>
        </div>

        {systemLogs.length === 0 ? (
          <div className="flex items-start gap-3 py-2 text-slate-500">
            <Info size={14} className="shrink-0 mt-0.5"/> 
            <p>[INFO] No se registran fallas ni advertencias críticas en el servidor.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {systemLogs.map((sysLog, idx) => {
              const dateObj = new Date(sysLog.createdAt)
              const dateStr = isValid(dateObj) ? format(dateObj, "yyyy-MM-dd HH:mm:ss") : "Fecha inválida"

              return (
                <div key={idx} className="flex items-start gap-2.5 hover:bg-slate-800/30 px-1 -mx-1 rounded transition-colors">
                  {getLogIcon(sysLog.level)}
                  <div className="break-all">
                    <span className="text-slate-500 mr-2">[{dateStr}]</span>
                    <span className={`font-bold mr-2 ${getLogColor(sysLog.level)}`}>
                      [{sysLog.level?.toUpperCase() || "LOG"}]
                    </span>
                    <span className="text-slate-300">{sysLog.message}</span>
                  </div>
                </div>
              )
            })}
            
            {/* Cursor parpadeante simulado */}
            <div className="flex items-center mt-2">
              <span className="text-emerald-400 font-bold animate-pulse">_</span>
            </div>
            <div ref={endOfLogsRef} />
          </div>
        )}
      </div>
    </div>
  )
}