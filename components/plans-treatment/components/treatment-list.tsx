"use client"

import React, { useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  ClipboardList, Plus, Trash2, RotateCcw,
  User, Clock, Loader2, Users, AlertTriangle, FileText,
  CheckCircle2, ChevronRight, Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog"
import { useToast } from "@/hooks/use-toast"
import { useClinicSettings } from "@/config/clinic-settings"

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
  const { settings } = useClinicSettings()

  const rawCurrency = (settings as any)?.currencySymbol || (settings as any)?.currency || "USD"
  const currencySymbol = rawCurrency.endsWith(" ") ? rawCurrency : `${rawCurrency} `
  const userRole = String((session?.user as any)?.role || "").toUpperCase().trim()
  const isAdmin = userRole === "ADMIN" || userRole === "ADMINISTRADOR"

  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [planToForceDelete, setPlanToForceDelete] = useState<string | null>(null)
  const [isForceDeleting, setIsForceDeleting] = useState(false)

  const filteredPlans = useMemo(() => {
    return (plans || []).filter((plan: any) => {
      if (filterStatus === "CANCELLED") return plan.status === "CANCELLED"
      if (plan.status === "CANCELLED") return false
      if (filterStatus === "ALL") return true
      if (filterStatus === "ACTIVE") return plan.status === "ACTIVE"
      if (filterStatus === "DRAFT") return plan.status === "DRAFT"
      if (filterStatus === "COMPLETED") return plan.status === "COMPLETED"
      return true
    })
  }, [plans, filterStatus])

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
    } catch {
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
    } catch {
      toast({ title: "Error al restaurar el plan", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans antialiased">
      {/* Modal Eliminación Definitiva Unificado */}
      <ConfirmDestructiveDialog
        isOpen={!!planToForceDelete}
        onClose={() => setPlanToForceDelete(null)}
        onConfirm={confirmForceDelete}
        isLoading={isForceDeleting}
        title="¿Destruir plan permanentemente?"
        description="Esta acción eliminará de forma irreversible el tratamiento y sus registros clínicos de la base de datos."
        confirmText="Sí, destruir definitivo"
        iconType="warning"
      />

      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/80 backdrop-blur-xl p-6 rounded-[24px] border border-border shadow-xs">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex w-12 h-12 bg-[#008bcd]/10 rounded-2xl border border-[#008bcd]/20 items-center justify-center text-[#008bcd]">
            <Activity className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Planes de Tratamiento</h2>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">
              Historial clínico y presupuestario de <b className="text-foreground">{patientName || "Paciente"}</b>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[220px] bg-background border-border text-xs font-bold h-11 rounded-xl focus:ring-[#008bcd]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border rounded-xl shadow-xl text-xs font-semibold">
              <SelectItem value="ALL" className="py-2.5">Todos los activos</SelectItem>
              <SelectItem value="ACTIVE" className="py-2.5">En ejecución</SelectItem>
              <SelectItem value="DRAFT" className="py-2.5">Borradores</SelectItem>
              <SelectItem value="COMPLETED" className="py-2.5">Finalizados</SelectItem>
              <SelectItem value="CANCELLED" className="text-red-500 py-2.5">Papelera (Anulados)</SelectItem>
            </SelectContent>
          </Select>

          {onNewPlan && (
            <Button
              onClick={onNewPlan}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-5 rounded-xl shadow-xs text-xs cursor-pointer active:scale-[0.98] transition-all shrink-0 border-none"
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Nuevo Plan
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-2 pt-1">
        <h3 className="text-xs font-bold text-[#008bcd] uppercase tracking-widest">
          Historial de Tratamientos
        </h3>
        <span className="text-[11px] bg-muted text-muted-foreground font-bold px-3 py-1 rounded-full border border-border">
          {filteredPlans.length} {filteredPlans.length === 1 ? "Registro" : "Registros"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-[24px] border border-border border-dashed">
          <Loader2 className="w-10 h-10 animate-spin text-[#008bcd] mb-4" />
          <p className="text-sm font-bold text-muted-foreground">Cargando planes de tratamiento...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-card/50 backdrop-blur-md border-2 border-dashed border-border/80 rounded-[24px] p-16 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
            <ClipboardList className="w-10 h-10 text-muted-foreground/60" />
          </div>
          <p className="font-black text-xl text-foreground tracking-tight">No se encontraron planes</p>
          <p className="text-xs text-muted-foreground mt-2 font-medium max-w-md mx-auto">
            {filterStatus === "CANCELLED"
              ? "La papelera está vacía."
              : "No hay registros bajo este filtro. Crea un nuevo plan para comenzar."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPlans.map((plan: any) => {
            const items = plan.items || []
            const totalItems = items.length
            const totalProgressSum = items.reduce((sum: number, item: any) => sum + (item.isCompleted ? 100 : Number(item.progress || 0)), 0)
            const progressPercent = totalItems > 0 ? Math.round(totalProgressSum / totalItems) : 0

            const baseTotal = Number(plan.totalCost || 0)
            const paid = Number(plan.totalPaid || 0)
            const debt = Math.max(0, baseTotal - paid)

            const isCancelled = plan.status === "CANCELLED"
            const isFullyPaid = plan.status === "COMPLETED" || (debt <= 0.01 && baseTotal > 0 && paid > 0)

            const rawUpdatedAt = plan.updatedAt || plan.createdAt
            const validUpdatedAt = rawUpdatedAt ? new Date(rawUpdatedAt) : new Date()
            const rawCreatedAt = plan.createdAt
            const validCreatedAt = rawCreatedAt ? new Date(rawCreatedAt) : new Date()

            return (
              <div
                key={plan.id}
                onClick={(e) => {
                  e.preventDefault()
                  if (!isCancelled && onSelectPlan) {
                    onSelectPlan(String(plan.id))
                  }
                }}
                className={`group relative bg-card border rounded-[24px] p-6 transition-all duration-300 flex flex-col gap-5 overflow-hidden ${
                  isCancelled
                    ? "border-red-500/20 bg-red-50/50 dark:bg-red-950/10 opacity-80"
                    : "border-border shadow-xs hover:shadow-lg hover:border-[#008bcd]/50 cursor-pointer"
                }`}
              >
                <div className="flex justify-between items-start sm:items-center relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className={`hidden sm:flex w-10 h-10 rounded-xl items-center justify-center shrink-0 ${isCancelled ? 'bg-red-100 text-red-500 dark:bg-red-900/30' : 'bg-sky-50 text-[#008bcd] dark:bg-sky-900/20'}`}>
                      <FileText className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-foreground group-hover:text-[#008bcd] transition-colors flex items-center gap-2 tracking-tight">
                        <span className="text-muted-foreground/50 text-xs font-bold font-mono">#{String(plan.id).slice(-4).toUpperCase()}</span>
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
                          className="text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold h-9 rounded-xl transition-all"
                        >
                          <RotateCcw className="w-4 h-4 mr-1.5" /> Restaurar
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPlanToForceDelete(plan.id)}
                            className="text-red-500 hover:bg-red-100 h-9 w-9 rounded-xl transition-colors cursor-pointer"
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
                              e.stopPropagation()
                              onDeletePlan(plan.id)
                            }}
                            className="h-9 w-9 text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                            title="Mover a papelera"
                          >
                            <Trash2 className="w-4 h-4 stroke-[2]" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (onSelectPlan) onSelectPlan(String(plan.id))
                          }}
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 group-hover:bg-[#008bcd]/15 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#008bcd]" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 border-t border-border/60 text-sm relative z-10">
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Especialista</p>
                      <p className="font-bold text-foreground text-xs flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#008bcd]" />
                        <span className="truncate">{plan.doctor?.name || "Dr. Asignado"}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Colaboradores</p>
                      <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#008bcd]" />
                        {Array.isArray(plan.collaborators) && plan.collaborators.length > 0 ? (
                          <span className="truncate" title={plan.collaborators.join(", ")}>
                            {plan.collaborators.join(", ")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/70 italic text-[11px]">Sin colaboradores</span>
                        )}
                      </p>
                    </div>
                  </div>

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
                            className="text-[#008bcd] transition-all duration-500 ease-out"
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
                        <p className="text-sm font-bold text-foreground font-mono">
                          {currencySymbol}{baseTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      {isCancelled ? (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-xs">
                          <AlertTriangle className="w-4 h-4" /> Anulado
                        </div>
                      ) : isFullyPaid ? (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 stroke-[3]" /> Pagado
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 text-amber-600 px-4 py-1.5 rounded-xl text-right">
                          <p className="text-[10px] uppercase font-bold opacity-80">Saldo Pendiente</p>
                          <p className="text-[14px] font-black font-mono">
                            {currencySymbol}{debt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-[11px] text-muted-foreground font-medium pt-3 border-t border-dashed border-border/60 relative z-10">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#008bcd]" />
                    Actualizado: <b className="text-foreground/80">{format(validUpdatedAt, "dd MMM yyyy, HH:mm", { locale: es })}</b>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 opacity-50" />
                    Creado: <b className="text-foreground/80">{format(validCreatedAt, "dd MMM yyyy", { locale: es })}</b>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TreatmentPlanList