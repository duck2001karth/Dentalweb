"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  ClipboardList, Plus, Trash2, RotateCcw, AlertOctagon, 
  User, Clock, Loader2, Users, AlertTriangle 
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
  
  // Estado para controlar el modal de destrucción definitiva (Hard Delete)
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

  // Ejecución de Hard Delete cuando el usuario confirma en el modal estilizado
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

  // Restaurar desde la papelera
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
      case "ACTIVE": return "Tratamientos en ejecución"
      case "DRAFT": return "Borradores y Diagnósticos"
      case "COMPLETED": return "Finalizados"
      case "CANCELLED": return "Papelera de Planes Anulados"
      default: return "Todos los planes"
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* MODAL ESTILIZADO DE CONFIRMACIÓN DE DESTRUCCIÓN DEFINITIVA */}
      <AlertDialog open={!!planToForceDelete} onOpenChange={(open) => !open && setPlanToForceDelete(null)}>
        <AlertDialogContent className="bg-card border-border rounded-2xl shadow-2xl sm:max-w-[420px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 font-extrabold text-lg">
              <AlertTriangle className="w-5 h-5" /> ¿Destruir plan permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs font-medium mt-1">
              Esta acción eliminará de forma irreversible el tratamiento y sus registros clínicos de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isForceDeleting} className="font-bold border-border rounded-xl text-xs h-10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmForceDelete} 
              disabled={isForceDeleting} 
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs h-10 shadow-sm"
            >
              {isForceDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sí, destruir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* BARRA SUPERIOR DE CONTROL */}
      <div className="flex justify-between items-center bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-foreground">Planes de tratamiento</h2>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            Historial de presupuestos y progresos de <b className="text-foreground">{patientName || "Paciente"}</b>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[190px] bg-background border-border text-xs font-bold h-10 rounded-xl focus:ring-[#008bcd]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border rounded-xl shadow-xl text-xs">
              <SelectItem value="ALL" className="font-semibold">Todos los activos</SelectItem>
              <SelectItem value="ACTIVE" className="font-semibold">En ejecución</SelectItem>
              <SelectItem value="DRAFT" className="font-semibold">Borradores</SelectItem>
              <SelectItem value="COMPLETED" className="font-semibold">Finalizados</SelectItem>
              <SelectItem value="CANCELLED" className="font-bold text-red-500">🗑️ Papelera (Anulados)</SelectItem>
            </SelectContent>
          </Select>

          {onNewPlan && (
            <Button 
              onClick={onNewPlan} 
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold h-10 px-5 rounded-xl shadow-xs text-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Nuevo plan
            </Button>
          )}
        </div>
      </div>

      <h3 className="text-sm font-bold text-[#008bcd] uppercase tracking-wider px-1 flex items-center justify-between">
        <span>{getTitleText()}</span>
        <span className="text-xs text-muted-foreground font-semibold">
          {filteredPlans.length} {filteredPlans.length === 1 ? "registro" : "registros"}
        </span>
      </h3>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-[#008bcd] mb-2" />
          <p className="text-xs font-bold text-muted-foreground">Cargando planes de tratamiento...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#008bcd]" />
          <p className="font-bold text-sm text-foreground">No hay planes en esta categoría</p>
          <p className="text-xs text-muted-foreground mt-1">
            {filterStatus === "CANCELLED" 
              ? "La papelera de tratamientos está vacía." 
              : "Cree un nuevo tratamiento o cambie el filtro de selección."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPlans.map((plan: any) => {
            const totalItems = plan.items?.length || 0
            const completedItems = plan.items?.filter((i: any) => i.isCompleted || i.progress === 100).length || 0
            const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

            const baseTotal = plan.totalCost || 0
            const paid = plan.totalPaid || 0
            const debt = Math.max(0, baseTotal - paid)
            const isCancelled = plan.status === "CANCELLED"

            return (
              <div 
                key={plan.id} 
                onClick={() => {
                  if (!isCancelled && onSelectPlan) {
                    onSelectPlan(plan.id)
                  }
                }}
                className={`bg-card border rounded-2xl p-5 shadow-xs transition-all flex flex-col gap-4 group ${
                  isCancelled 
                    ? "border-red-500/30 bg-red-950/10 dark:bg-red-950/20 opacity-80" 
                    : "border-border hover:border-[#008bcd]/60 cursor-pointer"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-extrabold text-[#008bcd] group-hover:underline flex items-center gap-2">
                    <span>#{plan.id.slice(-4).toUpperCase()}:</span>
                    <span>{plan.name}</span>
                    {isCancelled && (
                      <span className="text-[10px] font-bold uppercase bg-red-500/20 text-red-500 border border-red-500/30 px-2 py-0.5 rounded-md">
                        En Papelera
                      </span>
                    )}
                  </h4>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {isCancelled ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRestore(plan.id)}
                          className="text-emerald-500 hover:bg-emerald-500/10 text-xs font-bold h-8 px-3 rounded-lg gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                        </Button>

                        {isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setPlanToForceDelete(plan.id)}
                            className="text-red-500 hover:bg-red-500/10 text-xs font-bold h-8 px-3 rounded-lg gap-1.5"
                            title="Eliminar permanentemente de la Base de Datos"
                          >
                            <AlertOctagon className="w-3.5 h-3.5" /> Destruir
                          </Button>
                        )}
                      </>
                    ) : (
                      onDeletePlan && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onDeletePlan(plan.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                          title="Mover a la papelera"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-border/50 text-xs items-center">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">Profesional</p>
                    <p className="font-bold text-foreground text-sm mt-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#008bcd]" /> {plan.doctor?.name || "Dr. Asignado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">Colaboradores</p>
                    <p className="font-medium text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 opacity-40" /> Sin colaboradores
                    </p>
                  </div>

                  <div className="flex flex-col items-start">
                    <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider mb-1">(Progreso)</p>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center relative shadow-2xs"
                        style={{ background: `conic-gradient(#008bcd ${progressPercent}%, transparent 0)`, backgroundColor: "var(--muted)" }}
                      >
                        <div className="w-4 h-4 bg-card rounded-full flex items-center justify-center">
                          <span className="text-[8px] font-bold text-foreground">{progressPercent}%</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-foreground text-sm">{progressPercent}%</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">Estado Financiero</p>
                    {isCancelled ? (
                      <p className="font-bold text-red-500 text-sm mt-1">Anulado</p>
                    ) : plan.status === "DRAFT" ? (
                      <p className="font-extrabold text-emerald-400 text-sm mt-1 flex items-center justify-end gap-1">
                        ✓ Diagnóstico
                      </p>
                    ) : debt > 0 ? (
                      <p className="font-extrabold text-amber-500 text-sm mt-1">
                        ${debt.toLocaleString("en-US", { minimumFractionDigits: 2 })} Deuda
                      </p>
                    ) : (
                      <p className="font-extrabold text-amber-400 text-sm mt-1">
                        $ No hay saldo
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-5 text-xs text-muted-foreground/90 font-medium pt-2 border-t border-dashed border-border/40">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#008bcd]" /> 
                    Última actividad: <span className="font-bold text-foreground">{format(new Date(plan.updatedAt || plan.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}</span>
                  </span>
                  <span>
                    Fecha de creación: <span className="font-bold text-foreground">{format(new Date(plan.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}</span>
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