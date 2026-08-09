"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Edit2, Trash2, Calendar, Clock, AlertTriangle, User, Users, CheckCircle2, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function TreatmentPlanCard({ plan, onClick, onDelete }: { plan: any, onClick: () => void, onDelete: (e: React.MouseEvent) => void }) {
  const items = plan.items || []
  const totalItems = items.length
  const totalCost = plan.totalCost || items.reduce((acc: number, item: any) => {
    const cost = item.cost || 0
    const dscto = item.discount || 0
    return acc + (cost - (cost * (dscto / 100)))
  }, 0)

  const totalPaid = plan.totalPaid || items.reduce((acc: number, item: any) => acc + (item.paidAmount || 0), 0)
  const debt = Math.max(0, totalCost - totalPaid)
  const totalProgressSum = items.reduce((sum: number, item: any) => {
    const itemProg = item.isCompleted ? 100 : (item.progress || 0)
    return sum + itemProg
  }, 0)

  const progress = totalItems > 0 ? Math.round(totalProgressSum / totalItems) : 0
  const isFullyPaid = plan.status === "COMPLETED" || (debt <= 0.01 && totalCost > 0)

  let finance = { text: "Diagnóstico", color: "text-emerald-600 dark:text-emerald-400", icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> }
  
  if (plan.status !== "DRAFT" && !isFullyPaid && debt > 0) {
    finance = { text: "Deudas", color: "text-red-600 dark:text-red-400", icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" /> }
  } else if (isFullyPaid) {
    finance = { text: "Pagado", color: "text-emerald-600 dark:text-emerald-400", icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> }
  } else if (plan.status === "DRAFT" && debt > 0) {
    finance = { text: "No hay saldo", color: "text-amber-500", icon: <DollarSign className="w-3.5 h-3.5 mr-1" /> }
  }

  const createdAt = plan.createdAt ? format(new Date(plan.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es }) : "N/A"
  const updatedAt = plan.updatedAt ? format(new Date(plan.updatedAt), "d 'de' MMMM 'de' yyyy, 'a las' HH:mm:ss", { locale: es }) : "N/A"

  return (
    <div 
      onClick={onClick}
      className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden hover:border-[#008bcd]/60 hover:shadow-md transition-all cursor-pointer group font-sans antialiased"
    >
      <div className="px-6 py-4 flex justify-between items-center border-b border-border/60 bg-muted/20">
        <h4 className="text-base font-bold text-[#008bcd] tracking-normal flex items-center gap-2 group-hover:underline">
          #{plan.id?.slice(-4).toUpperCase()}: {plan.name} 
          <Edit2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity stroke-[2]" />
        </h4>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onDelete} 
          className="text-red-400 hover:text-red-600 hover:bg-red-500/10 rounded-xl h-8 w-8 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4 stroke-[2]" />
        </Button>
      </div>

      <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-center">
        <div>
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1.5">Profesional</p>
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-[#008bcd] shrink-0 mt-0.5 stroke-[2]" />
            <div>
              <p className="text-sm font-bold text-foreground tracking-normal">{plan.doctor?.name || "Dr. Asignado"}</p>
              <p className="text-xs text-muted-foreground font-semibold">({plan.doctor?.specialty || "General"})</p>
            </div>
          </div>
        </div>
          <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Colaboradores
          </p>
          <p className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-[#008bcd] shrink-0" />
            {Array.isArray(plan.collaborators) && plan.collaborators.length > 0 ? (
              <span className="font-bold text-[#008bcd]">
                {plan.collaborators.join(", ")}
              </span>
            ) : (
              <span className="text-muted-foreground font-medium">Sin colaboradores</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1.5">Última Cita</p>
          {plan.lastAppointment ? (
             <div className="flex flex-col text-xs font-bold text-foreground tracking-normal">
               <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#008bcd]" /> {plan.lastAppointment.split(" ")[0]}</span>
               <span className="flex items-center gap-1.5 mt-1 text-muted-foreground font-semibold"><Clock className="w-3.5 h-3.5" /> {plan.lastAppointment.split(" ")[1]}</span>
             </div>
          ) : (
             <p className="text-xs font-semibold text-muted-foreground">Sin registro</p>
          )}
        </div>
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2">Progreso</p>
          <div className="flex items-center gap-2.5">
            <div 
              className="w-4 h-4 rounded-full shrink-0 shadow-xs"
              style={{ 
                background: `conic-gradient(#008bcd ${progress}%, rgba(200,200,200,0.3) ${progress}%)` 
              }}
            />
            <span className="text-sm font-bold text-foreground tracking-normal">{progress}%</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1.5">Estado Financiero</p>
          <div className={cn("flex items-center font-bold text-xs px-2.5 py-1 rounded-lg border", finance.color, "bg-muted/20 border-border/60")}>
            {finance.icon} {finance.text}
          </div>
        </div>
      </div>
      <div className="px-6 py-2.5 bg-muted/20 border-t border-border/60 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground font-semibold">
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Última actividad: <b className="text-foreground">{updatedAt}</b></span>
        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fecha de creación: <b className="text-foreground">{createdAt}</b></span>
      </div>
      
    </div>
  )
}