"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, CalendarIcon, Clock, Trash2, User, Eye } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { appointmentStatuses, getReasonLabel } from "@/constants/status"
import { PrintPatientAppointmentsModal } from "@/components/patients/prints/print-appointments"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"

export function AppointmentsHistory({
  appointments = [],
  isLoading,
  patient
}: {
  appointments: any[]
  isLoading: boolean
  patient?: any
}) {
  const { data: session } = useSession()
  const { toast } = useToast()

  const currentUser = session?.user as any
  const role = currentUser?.role as string
  const isAdmin = role === "ADMIN" || role === "ADMINISTRACION"
  const isReception = role === "RECEPCION" || role === "RECEPTIONIST"
  const isDoctor = role === "DOCTOR"

  const canDeleteAppointment = (cita: any) => {
    if (isAdmin || isReception) return true
    if (isDoctor && cita.doctorId === currentUser?.id) return true
    return false
  }

  const today = new Date()
  const pastList = useMemo(() => {
    return (appointments || [])
      .filter((a: any) => new Date(a.date) < today || a.status === "COMPLETED")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [appointments, today])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Cita eliminada del historial" })
      window.location.reload()
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Tarjeta unificada idéntica a la sección de próximas citas */}
      <div className="bg-card border border-border/85 rounded-[24px] shadow-xs relative overflow-hidden">
        
        {/* Cabecera integrada dentro de la tarjeta con título y botón de visualizar alineados */}
        <div className="px-6 py-4.5 border-b border-border/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Historial de Citas Pasadas ({pastList.length})
          </h3>

          <PrintPatientAppointmentsModal
            patient={patient}
            appointments={pastList}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-9 px-3.5 text-xs font-bold border-border hover:bg-muted gap-1.5 cursor-pointer text-foreground"
              >
                <Eye className="w-3.5 h-3.5 text-[#008bcd]" /> Visualizar Historial
              </Button>
            }
          />
        </div>

        {/* Contenido de la línea de tiempo */}
        <div className="p-6">
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-[8px] top-2 bottom-2 w-[2px] bg-[#008bcd]/30" />

            {isLoading ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-[#008bcd]" /></div>
            ) : pastList.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-3 border border-border/60 text-muted-foreground">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-foreground">Sin citas pasadas</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">No hay registros históricos de consultas previas.</p>
              </div>
            ) : (
              pastList.map((cita: any, idx: number) => {
                const statusCfg = appointmentStatuses[cita.status] || { 
                  label: cita.status, 
                  badgeColor: "text-slate-600 bg-slate-100 border-slate-200" 
                }
                const canDelete = canDeleteAppointment(cita)

                return (
                  <div key={cita.id || idx} className="relative flex items-center group">
                    <div className="absolute -left-[22px] w-3.5 h-3.5 rounded-full border-2 border-background bg-[#008bcd] ring-4 ring-[#008bcd]/15 z-10" />
                    
                    <div className="w-full flex flex-col md:flex-row md:items-center justify-between p-4.5 bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border/70 transition-all gap-4">
                      <div className="min-w-[130px]">
                        <p className="text-xs font-extrabold text-foreground tracking-tight">
                          {format(new Date(cita.date), "dd MMM yy", { locale: es })}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#008bcd]" /> {cita.startTime || "09:00"} - {cita.endTime || "10:00"}
                        </p>
                      </div>

                      <div className="flex-1 md:px-4 md:border-l md:border-border/60">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block">Tratamiento / Motivo</span>
                        <p className="text-xs font-bold text-foreground mt-0.5">{getReasonLabel(cita.reason) || "Consulta General"}</p>
                      </div>

                      <div className="md:px-4 md:border-l md:border-border/60">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block">Dentista Asignado</span>
                        <p className="text-xs font-semibold text-foreground mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3 text-[#008bcd]" /> {cita.doctor?.name || cita.doctorName || "Dr. Asignado"}
                        </p>
                      </div>

                      <div className="md:px-4 md:border-l md:border-border/60">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block">Ubicación</span>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded border text-[11px] font-mono font-bold bg-background border-border/80 text-foreground">
                          {cita.box || "Box 1"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn("text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider border", statusCfg.badgeColor)}>
                          {statusCfg.label}
                        </span>

                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-xl opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Eliminar Cita"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-destructive font-black text-lg">¿Eliminar Cita?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs text-muted-foreground">
                                  Esta acción borrará permanentemente este registro del historial.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-4 gap-2">
                                <AlertDialogCancel className="border-border rounded-xl text-xs font-bold cursor-pointer">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(cita.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                  Sí, Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>

                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}