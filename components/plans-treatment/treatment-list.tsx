"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  ClipboardList, Plus, Trash2, RotateCcw, AlertOctagon, 
  User, Clock, Loader2, Users, AlertTriangle, FileText, 
  CheckCircle2, ChevronRight, Activity 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface TreatmentPlanListProps {
  plans: any[]
  isLoading?: boolean
  patientName?: string
  onNewPlan?: () => void
  onSelectPlan?: (id: string) => void
  onDeletePlan?: (id: string) => void
  refetchPlans?: () => void
}

export function TreatmentPlanList({
  plans = [],
  isLoading = false,
  patientName = "",
  onNewPlan,
  onSelectPlan,
  onDeletePlan,
  refetchPlans
}: TreatmentPlanListProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const isAdmin = session?.user?.role === "ADMIN"
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  
  const [planToForceDelete, setPlanToForceDelete] = useState<string | null>(null)
  const [isForceDeleting, setIsForceDeleting] = useState(false)
  const filteredPlans = plans.filter((plan: any) => {
    if (filterStatus === "CANCELLED") return plan.status === "CANCELLED"
    if (plan.status === "CANCELLED") return false

    if (filterStatus === "ALL") return true
    if (filterStatus === "ACTIVE") return plan.status === "ACTIVE"
    if (filterStatus === "DRAFT") return plan.status === "DRAFT"
    if (filterStatus === "COMPLETED") return plan.status === "COMPLETED"
    return true
  })
  const confirmForceDelete = async () => {
    if (!planToForceDelete) return
    setIsForceDeleting(true)

    try {
      const res = await fetch(`/api/treatments/${planToForceDelete}?force=true`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Plan eliminado definitivamente", variant: "success" })
        if (refetchPlans) refetchPlans()
      } else {
        throw new Error()
      }
    } catch (e) {
      toast({ title: "Error al eliminar definitivamente", variant: "destructive" })
    } finally {
      setIsForceDeleting(false)
      setPlanToForceDelete(null)
    }
  }
  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/treatments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESTORE" })
      })
      if (res.ok) {
        toast({ title: "Plan restaurado con éxito", variant: "success" })
        if (refetchPlans) refetchPlans()
      } else {
        throw new Error()
      }
    } catch (e) {
      toast({ title: "Error al restaurar el plan", variant: "destructive" })
    }
  }

  const getTitleText = () => {
    switch (filterStatus) {
      case "ACTIVE": return "Tratamientos en Ejecución"
      case "DRAFT": return "Borradores y Diagnósticos"
      case "COMPLETED": return "Tratamientos Finalizados"
      case "CANCELLED": return "Papelera de Reciclaje"
      default: return "Historial Completo"
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans antialiased">
      <AlertDialog open={!!planToForceDelete} onOpenChange={(open) => !open && setPlanToForceDelete(null)}>
        <AlertDialogContent className="bg-card border-border rounded-[24px] shadow-2xl sm:max-w-[440px] p-6">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center border border-red-500/20 mb-3">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-foreground tracking-tight">
              ¿Destruir plan permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm font-medium mt-2 leading-relaxed">
              Esta acción eliminará de forma irreversible el tratamiento y sus registros clínicos de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 gap-2">
            <AlertDialogCancel disabled={isForceDeleting} className="font-bold border-border/80 rounded-xl text-sm h-11 px-5 hover:bg-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmForceDelete} 
              disabled={isForceDeleting} 
              className="bg-red-600 hover:bg-red-700 text-white border-none font-bold rounded-xl text-sm h-11 px-6 shadow-sm cursor-pointer transition-colors"
            >
              {isForceDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sí, destruir definitivo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/80 backdrop-blur-xl p-6 rounded-[24px] border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex w-12 h-12 bg-[#008bcd]/10 rounded-2xl border border-[#008bcd]/20 items-center justify-center text-[#008bcd]">
            <Activity className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Planes de Tratamiento</h2>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">
              Historial clínico y financiero de <b className="text-foreground">{patientName || "Paciente"}</b>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[220px] bg-background border-border text-sm font-bold h-12 rounded-xl focus:ring-[#008bcd]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border rounded-xl shadow-xl text-sm">
              <SelectItem value="ALL" className="font-bold py-2.5">Todos los activos</SelectItem>
              <SelectItem value="ACTIVE" className="font-bold py-2.5">En ejecución</SelectItem>
              <SelectItem value="DRAFT" className="font-bold py-2.5">Borradores</SelectItem>
              <SelectItem value="COMPLETED" className="font-bold py-2.5">Finalizados</SelectItem>
              <SelectItem value="CANCELLED" className="font-bold text-red-500 py-2.5">🗑️ Papelera (Anulados)</SelectItem>
            </SelectContent>
          </Select>

          {onNewPlan && (
            <Button 
              onClick={onNewPlan} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-6 rounded-xl shadow-sm text-sm cursor-pointer active:scale-[0.98] transition-all shrink-0 border-none"
            >
              <Plus className="w-5 h-5 mr-1.5 stroke-[2.5]" /> Nuevo Plan
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-2 pt-2">
        <h3 className="text-sm font-bold text-[#008bcd] uppercase tracking-widest">
          {getTitleText()}
        </h3>
        <span className="text-xs bg-muted text-muted-foreground font-bold px-3 py-1 rounded-full border border-border">
          {filteredPlans.length} {filteredPlans.length === 1 ? "Registro" : "Registros"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-[24px] border border-border border-dashed">
          <Loader2 className="w-10 h-10 animate-spin text-[#008bcd] mb-4" />
          <p className="text-sm font-bold text-muted-foreground">Cargando expediente clínico...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-card/50 backdrop-blur-md border-2 border-dashed border-border/80 rounded-[24px] p-16 text-center transition-all hover:bg-card">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
            <ClipboardList className="w-10 h-10 text-muted-foreground/60" />
          </div>
          <p className="font-black text-xl text-foreground tracking-tight">No se encontraron planes</p>
          <p className="text-sm text-muted-foreground mt-2 font-medium max-w-md mx-auto">
            {filterStatus === "CANCELLED" 
              ? "La papelera de tratamientos está vacía. No hay registros anulados." 
              : "No hay registros bajo este filtro. Puedes crear un nuevo tratamiento para comenzar."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPlans.map((plan: any) => {
            const items = plan.items || []
            const totalItems = items.length
            const totalProgressSum = items.reduce((sum: number, item: any) => {
              const itemProg = item.isCompleted ? 100 : (item.progress || 0)
              return sum + itemProg
            }, 0)

            const progressPercent = totalItems > 0 ? Math.round(totalProgressSum / totalItems) : 0
           const baseTotal = Number(plan.totalCost) || items.reduce((acc: number, item: any) => {
            const cost = Number(item.cost || item.price || 0)
            const dscto = Number(item.discount || 0)
            return acc + (cost - (cost * (dscto / 100)))
          }, 0)
            let paid = 0
            if (Array.isArray(plan.payments)) {
              paid = plan.payments.reduce((acc: number, p: any) => {
                const isDeleted = p.notes && typeof p.notes === "string" && p.notes.includes("[PAGO ELIMINADO")
                if (isDeleted) return acc
                return acc + Number(p.amount || p.paidAmount || 0)
              }, 0)
            } else if (plan.totalPaid !== undefined && plan.totalPaid !== null) {
              paid = Number(plan.totalPaid)
            } else {
              paid = items.reduce((acc: number, item: any) => acc + Number(item.paidAmount || 0), 0)
            }
            const debt = Math.max(0, baseTotal - paid)
            const isCancelled = plan.status === "CANCELLED"
            const isFullyPaid = plan.status === "COMPLETED" || (debt <= 0.01 && baseTotal > 0 && paid > 0)

            return (
              <div 
                key={plan.id} 
                onClick={() => {
                  if (!isCancelled && onSelectPlan) {
                    onSelectPlan(plan.id)
                  }
                }}
                className={`group relative bg-card border rounded-[24px] p-6 transition-all duration-300 flex flex-col gap-5 overflow-hidden ${
                  isCancelled 
                    ? "border-red-500/20 bg-red-50/50 dark:bg-red-950/10 opacity-80" 
                    : "border-border shadow-xs hover:shadow-lg hover:border-[#008bcd]/30 cursor-pointer"
                }`}
              >
                <div className="flex justify-between items-start sm:items-center relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className={`hidden sm:flex w-10 h-10 rounded-xl items-center justify-center shrink-0 ${isCancelled ? 'bg-red-100 text-red-500 dark:bg-red-900/30' : 'bg-sky-50 text-[#008bcd] dark:bg-sky-900/20'}`}>
                      <FileText className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-foreground group-hover:text-[#008bcd] transition-colors flex items-center gap-2 tracking-tight">
                        <span className="text-muted-foreground/50 text-sm font-bold">#{plan.id?.slice(-4).toUpperCase()}</span>
                        {plan.name || "Plan de Tratamiento General"}
                      </h4>
                      {isCancelled && (
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-500/30">
                          Plan Anulado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {isCancelled ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRestore(plan.id)}
                          className="text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 text-xs font-bold h-9 rounded-xl transition-all"
                        >
                          <RotateCcw className="w-4 h-4 mr-1.5" /> Restaurar
                        </Button>
                        {isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setPlanToForceDelete(plan.id)}
                            className="text-red-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 h-9 w-9 rounded-xl transition-colors"
                            title="Eliminar de la Base de Datos"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        {onDeletePlan && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePlan(plan.id);
                            }}
                            className="h-9 w-9 text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl cursor-pointer transition-colors"
                            title="Mover a papelera"
                          >
                            <Trash2 className="w-4 h-4 stroke-[2]" />
                          </Button>
                        )}
                        <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 group-hover:bg-[#008bcd]/10 transition-colors">
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#008bcd]" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 border-t border-border/60 text-sm relative z-10">
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Especialista</p>
                      <p className="font-bold text-foreground text-[13px] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#008bcd]" /> 
                        <span className="truncate">{plan.doctor?.name || "Dr. Asignado"}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Colaboradores</p>
                      <p className="font-semibold text-foreground text-[13px] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#008bcd]" />
                        {Array.isArray(plan.collaborators) && plan.collaborators.length > 0 ? (
                          <span className="truncate" title={plan.collaborators.join(", ")}>
                            {plan.collaborators.join(", ")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/70 italic">Sin colaboradores</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* PROGRESO CLÍNICO */}
                  <div className="flex flex-col justify-center sm:justify-start">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Progreso Clínico</p>
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted" />
                          <circle 
                            cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" 
                            strokeDasharray={125.6} 
                            strokeDashoffset={125.6 - (125.6 * progressPercent) / 100}
                            strokeLinecap="round"
                            className="text-[#008bcd] transition-all duration-1000 ease-out" 
                          />
                        </svg>
                        <span className="absolute text-[11px] font-black text-foreground">{progressPercent}%</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium leading-tight">
                        {totalItems} {totalItems === 1 ? 'prestación' : 'prestaciones'} <br/> en total
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex flex-col justify-center items-start sm:items-end">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Estado Financiero</p>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-3">
                        <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Presupuesto Total</p>
                        <p className="text-[13px] font-bold text-foreground">
                          ${baseTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      {isCancelled ? (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm">
                          <AlertTriangle className="w-4 h-4" /> Anulado
                        </div>
                      ) : plan.status === "DRAFT" && debt <= 0 && baseTotal === 0 ? (
                        <div className="bg-sky-50 border border-sky-200 text-[#008bcd] dark:bg-[#008bcd]/10 dark:border-[#008bcd]/20 dark:text-[#38bdf8] px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm">
                          <FileText className="w-4 h-4" /> Diagnóstico
                        </div>
                      ) : isFullyPaid ? (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 px-4 py-2 rounded-xl font-black text-sm flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-4 h-4 stroke-[3]" /> Pagado
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-500 px-4 py-1.5 rounded-xl text-right shadow-sm">
                          <p className="text-[10px] uppercase font-bold opacity-80">Saldo Pendiente</p>
                          <p className="text-[15px] font-black tracking-tight">
                            ${debt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-[11px] text-muted-foreground font-medium pt-3 border-t border-dashed border-border/60 relative z-10">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#008bcd]" /> 
                    Actualizado: <b className="text-foreground/80">{format(new Date(plan.updatedAt || plan.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}</b>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 opacity-50" />
                    Creado: <b className="text-foreground/80">{format(new Date(plan.createdAt), "dd MMM yyyy", { locale: es })}</b>
                  </span>
                </div>

                {/* Decoración de fondo suave en Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-sky-50/30 dark:to-sky-900/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-[24px]" />
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}