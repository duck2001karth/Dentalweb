"use client"

import React from "react"
import { format, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { 
  FileText, User, Clock, Monitor, Database, ArrowRight, X 
} from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface AuditDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  log: any | null
}

export function AuditDetailsModal({ isOpen, onClose, log }: AuditDetailsModalProps) {
  if (!log) return null

  const dateObj = new Date(log.createdAt)
  const formattedDate = isValid(dateObj) 
    ? format(dateObj, "dd 'de' MMMM, yyyy - HH:mm:ss", { locale: es }) 
    : "Fecha desconocida"

  const rawModule = String(log.entity || log.target || "General").toLowerCase()
  const moduleTranslations: Record<string, string> = {
    inventorymovement: "Bodega / Stock",
    inventoryitem: "Catálogo Insumos",
    taxdocument: "Facturación SRI",
    payment: "Caja y Pagos",
    patient: "Pacientes",
    user: "Usuarios",
    appointment: "Agenda y Citas",
    treatment: "Tratamientos",
    treatmentplan: "Planes Clínicos",
    clinicsettings: "Configuración Clínica",
  }
  const displayModuleName = moduleTranslations[rawModule] || log.entity || log.target || "General"

  const CodeBlock = ({ title, data, type }: { title: string, data: any, type: "old" | "new" }) => {
    if (!data || Object.keys(data).length === 0) return null
    
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <span className={cn(
          "text-[10px] font-black uppercase tracking-wider",
          type === "old" ? "text-rose-500" : "text-emerald-500"
        )}>
          {title}
        </span>
        <div className="bg-[#0f172a] rounded-2xl p-4 border border-slate-800 shadow-inner">
          <pre className={cn(
            "text-xs font-mono leading-relaxed whitespace-pre-wrap break-all",
            type === "old" ? "text-rose-300" : "text-emerald-300"
          )}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[760px] bg-card border-border/80 rounded-[28px] p-0 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* CABECERA */}
        <DialogHeader className="px-7 py-5 border-b border-border/60 bg-muted/20 relative shrink-0">        
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-3 pr-10">
            <div className="w-10 h-10 rounded-xl bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center border border-[#008bcd]/20 shadow-xs shrink-0">
              <FileText className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span>Detalles del Evento de Auditoría</span>
              <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                ID: {log.id}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* CUERPO DEL MODAL (Sin barras toscas de scroll) */}
        <div className="p-7 overflow-y-auto space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          
          {/* Tarjeta de Metadatos Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Usuario Operador</span>
                <span className="text-sm font-bold text-foreground">{log.user?.name || "Sistema Automático"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Módulo / Entidad</span>
                <span className="text-sm font-bold text-foreground">{displayModuleName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fecha y Hora</span>
                <span className="text-sm font-bold text-foreground">{formattedDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground shrink-0">
                <Monitor className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dirección IP</span>
                <span className="text-sm font-bold text-foreground font-mono">{log.ipAddress === "::1" ? "127.0.0.1 (Localhost)" : (log.ipAddress || "Interno")}</span>
              </div>
            </div>
          </div>

          {/* Descripción de la Operación */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Descripción de la Operación
            </span>
            <div className="bg-background border border-border/80 rounded-2xl p-4 text-sm font-medium text-foreground leading-relaxed shadow-xs">
              {log.details || "Sin descripción detallada."}
            </div>
          </div>

          {/* Carga de Datos (Payload) */}
          {(log.oldData || log.newData) && (
            <div className="space-y-3 pt-1">
              <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5" /> Carga de Datos (Payload)
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {log.oldData ? (
                  <CodeBlock title="Datos Anteriores" data={log.oldData} type="old" />
                ) : (
                  <div className="border border-dashed border-border rounded-2xl bg-muted/10 flex items-center justify-center p-6 min-h-[120px]">
                    <span className="text-xs text-muted-foreground font-medium">Sin datos previos</span>
                  </div>
                )}
                
                {log.newData ? (
                  <CodeBlock title="Datos Nuevos / Actuales" data={log.newData} type="new" />
                ) : (
                  <div className="border border-dashed border-border rounded-2xl bg-muted/10 flex items-center justify-center p-6 min-h-[120px]">
                    <span className="text-xs text-muted-foreground font-medium">Sin datos nuevos</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}