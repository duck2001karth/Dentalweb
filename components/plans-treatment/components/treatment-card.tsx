"use client"

import React, { useMemo } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Edit2, Trash2, Calendar, Clock, AlertTriangle, 
  User, Users, CheckCircle2, FileText 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { TreatmentPlan } from "@/types/treatments"

interface TreatmentPlanCardProps {
  plan: TreatmentPlan | any
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}

export function TreatmentPlanCard({ plan, onClick, onDelete }: TreatmentPlanCardProps) {
  const items = plan.items || []
  const totalItems = items.length
  const agreementDiscount = Number(plan.discount ?? plan.agreement?.discountValue ?? 0)

  const totalCost = useMemo(() => {
    if (items.length > 0) {
      return items.reduce((acc: number, item: any) => {
        const cost = Number(item.cost || item.price || 0)
        const itemDisc = Number(item.discount || 0)
        const effectiveDisc = itemDisc > 0 ? itemDisc : agreementDiscount
        return acc + (cost - cost * (effectiveDisc / 100))
      }, 0)
    }
    const rawCost = Number(plan.totalCost || 0)
    return Math.max(0, rawCost - rawCost * (agreementDiscount / 100))
  }, [items, plan.totalCost, agreementDiscount])

  const totalPaid = Number(plan.totalPaid ?? items.reduce((acc: number, item: any) => acc + Number(item.paidAmount || 0), 0))
  const debt = Math.max(0, totalCost - totalPaid)

  const totalProgressSum = items.reduce((sum: number, item: any) => {
    const itemProg = item.isCompleted ? 100 : (item.progress || 0)
    return sum + itemProg
  }, 0)

  const progress = totalItems > 0 ? Math.round(totalProgressSum / totalItems) : 0
  const isFullyPaid = plan.status === "COMPLETED" || (debt <= 0.01 && totalCost > 0 && totalPaid > 0)

  const collaboratorsList = useMemo(() => {
    if (!plan.collaborators) return []
    if (Array.isArray(plan.collaborators)) return plan.collaborators
    if (typeof plan.collaborators === "string") {
      try {
        const parsed = JSON.parse(plan.collaborators)
        return Array.isArray(parsed) ? parsed : [plan.collaborators]
      } catch {
        return [plan.collaborators]
      }
    }
    return []
  }, [plan.collaborators])

  let finance = { 
    text: "Diagnóstico", 
    color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20", 
    icon: <FileText className="w-3.5 h-3.5 mr-1" /> 
  }
  
  if (plan.status === "CANCELLED") {
    finance = { 
      text: "Anulado", 
      color: "text-red-500 bg-red-500/10 border-red-500/20", 
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" /> 
    }
  } else if (isFullyPaid) {
    finance = { 
      text: "Pagado", 
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20", 
      icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 
    }
  } else if (debt > 0 && plan.status !== "DRAFT") {
    finance = { 
      text: "Con Saldo", 
      color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20", 
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" /> 
    }
  } else if (plan.status === "DRAFT") {
    finance = { 
      text: "Presupuesto", 
      color: "text-slate-600 dark:text-slate-400 bg-muted border-border/80", 
      icon: <FileText className="w-3.5 h-3.5 mr-1" /> 
    }
  }

  const createdAt = plan.createdAt ? format(new Date(plan.createdAt), "d 'de' MMMM, yyyy", { locale: es }) : "N/A"
  const updatedAt = plan.updatedAt ? format(new Date(plan.updatedAt), "d 'de' MMMM, yyyy, HH:mm", { locale: es }) : "N/A"

  return (
    <div 
      onClick={onClick}
      className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden hover:border-[#008bcd]/60 hover:shadow-md transition-all cursor-pointer group font-sans antialiased"
    >
      <div className="px-6 py-4 flex justify-between items-center border-b border-border/60 bg-muted/20">
        <h4 className="text-base font-bold text-[#008bcd] tracking-tight flex items-center gap-2 group-hover:underline">
          <span className="text-muted-foreground/60 text-xs font-mono">#{plan.id?.slice(-4).toUpperCase()}</span> 
          {plan.name || "Plan de Tratamiento"}
          <Edit2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity stroke-[2]" />
        </h4>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={(e) => {
            e.stopPropagation()
            onDelete(e)
          }} 
          className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl h-8 w-8 transition-colors cursor-pointer"
          title="Eliminar tratamiento"
        >
          <Trash2 className="w-4 h-4 stroke-[2]" />
        </Button>
      </div>

      <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
        {/* PROFESIONAL */}
        <div>
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1.5">Especialista</p>
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-[#008bcd] shrink-0 mt-0.5 stroke-[2]" />
            <div>
              <p className="text-xs font-bold text-foreground">{plan.doctor?.name || "Dr. Asignado"}</p>
              <p className="text-[11px] text-muted-foreground font-medium">({plan.doctor?.specialty || "General"})</p>
            </div>
          </div>
        </div>

        {/* COLABORADORES */}
        <div>
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1.5">Colaboradores</p>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#008bcd] shrink-0 stroke-[2]" />
            {collaboratorsList.length > 0 ? (
              <span className="text-xs font-bold text-[#008bcd] truncate" title={collaboratorsList.join(", ")}>
                {collaboratorsList.join(", ")}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground font-medium">Sin colaboradores</span>
            )}
          </div>
        </div>

        {/* PROGRESO */}
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2">Progreso Clínico</p>
          <div className="flex items-center gap-2.5">
            <div 
              className="w-4 h-4 rounded-full shrink-0 shadow-2xs border border-border"
              style={{ 
                background: `conic-gradient(#008bcd ${progress}%, rgba(200,200,200,0.2) ${progress}%)` 
              }}
            />
            <span className="text-xs font-black text-foreground">{progress}%</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5">{totalItems} {totalItems === 1 ? "prestación" : "prestaciones"}</span>
        </div>

        {/* TOTAL PRESUPUESTO */}
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Presupuesto Total</p>
          <p className="text-sm font-black font-mono text-foreground">
            USD {totalCost.toFixed(2)}
          </p>
          {agreementDiscount > 0 && (
            <span className="text-[10px] text-emerald-600 font-semibold">
              Convenio ({agreementDiscount}%)
            </span>
          )}
        </div>

        {/* SALDO PENDIENTE */}
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 tracking-widest mb-1">Saldo Pendiente</p>
          <p className="text-sm font-black font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
            USD {debt.toFixed(2)}
          </p>
        </div>

        {/* ESTADO FINANCIERO */}
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1.5">Estado</p>
          <div className={cn("flex items-center font-bold text-xs px-2.5 py-1 rounded-lg border", finance.color)}>
            {finance.icon} {finance.text}
          </div>
        </div>
      </div>

      <div className="px-6 py-2.5 bg-muted/20 border-t border-border/60 flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-muted-foreground font-medium">
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#008bcd]" /> Actualizado: <b className="text-foreground">{updatedAt}</b></span>
        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 opacity-50" /> Creado: <b className="text-foreground">{createdAt}</b></span>
      </div>
    </div>
  )
}

export default TreatmentPlanCard