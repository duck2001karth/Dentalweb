"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Edit2, Trash2, Calendar, Clock, AlertTriangle, User, Users, CheckCircle2, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function TreatmentPlanCard({ plan, onClick, onDelete }: { plan: any, onClick: () => void, onDelete: (e: React.MouseEvent) => void }) {
  const totalCost = plan.totalCost || 0
  const totalPaid = plan.totalPaid || 0
  const debt = totalCost - totalPaid
  
  const totalItems = plan.items?.length || 0
  const completedItems = plan.items?.filter((i: any) => i.isCompleted).length || 0
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  let finance = { text: "Diagnóstico", color: "text-emerald-600", icon: <CheckCircle2 className="w-4 h-4 mr-1" /> }
  if (plan.status !== "DRAFT" && debt > 0) {
    finance = { text: "Deudas", color: "text-red-600", icon: <AlertTriangle className="w-4 h-4 mr-1" /> }
  } else if (plan.status !== "DRAFT" && debt <= 0 && totalCost > 0) {
    finance = { text: "Pagado", color: "text-emerald-600", icon: <CheckCircle2 className="w-4 h-4 mr-1" /> }
  } else if (plan.status === "DRAFT" && debt > 0) {
    finance = { text: "No hay saldo", color: "text-amber-500", icon: <DollarSign className="w-4 h-4 mr-1" /> }
  }

  const createdAt = plan.createdAt ? format(new Date(plan.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es }) : "N/A"
  const updatedAt = plan.updatedAt ? format(new Date(plan.updatedAt), "d 'de' MMMM 'de' yyyy, 'a las' HH:mm:ss", { locale: es }) : "N/A"

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-card border border-border shadow-sm rounded-xl overflow-hidden hover:border-[#008bcd]/50 transition-colors cursor-pointer group"
    >
      {/* HEADER DE LA TARJETA */}
      <div className="px-6 py-4 flex justify-between items-center border-b border-border/50 bg-slate-50/50 dark:bg-muted/10">
        <h4 className="text-lg font-bold text-[#008bcd] flex items-center gap-2 group-hover:underline">
          #{plan.id.slice(-4).toUpperCase()}: {plan.name} <Edit2 className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
        </h4>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-center">
        
        <div>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">Profesional</p>
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">{plan.doctor?.name || "Dr. Asignado"}</p>
              <p className="text-[11px] text-muted-foreground font-medium">({plan.doctor?.specialty || "General"})</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">Colaboradores</p>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-sm font-semibold text-foreground">{plan.collaborators || "Sin colaboradores"}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">Última Cita</p>
          {plan.lastAppointment ? (
             <div className="flex flex-col text-sm font-semibold text-foreground">
               <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {plan.lastAppointment.split(" ")[0]}</span>
               <span className="flex items-center gap-1.5 mt-1 text-muted-foreground"><Clock className="w-3.5 h-3.5" /> {plan.lastAppointment.split(" ")[1]}</span>
             </div>
          ) : (
             <p className="text-sm font-medium text-muted-foreground">Sin registro</p>
          )}
        </div>

        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">(Progreso)</p>
          <div className="w-12 h-12 rounded-full flex items-center justify-center relative shadow-inner" style={{ background: `conic-gradient(#008bcd ${progress}%, transparent 0)`, backgroundColor: "var(--muted)" }}>
            <div className="w-10 h-10 bg-white dark:bg-card rounded-full flex items-center justify-center absolute shadow-sm">
              <span className="text-[11px] font-black text-[#008bcd]">{progress}%</span>
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">Estado Financiero</p>
          <div className={cn("flex items-center font-black text-sm", finance.color)}>
            {finance.icon} {finance.text}
          </div>
        </div>
      </div>

      <div className="px-6 py-3 bg-muted/20 border-t border-border/50 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground font-medium">
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Última actividad: {updatedAt}</span>
        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fecha de creación: {createdAt}</span>
      </div>
      
    </div>
  )
}
