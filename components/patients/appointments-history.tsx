"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { Loader2, CalendarIcon, Clock, Trash2, User, Stethoscope, Filter } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { appointmentStatuses, getReasonLabel } from "@/constants/status"
import { PrintPatientAppointmentsModal } from "@/components/patients/print-appointments"
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

const calcularDuracion = (start: string, end: string) => {
  if (!start || !end) return "30 min"
  const [startH, startM] = start.split(":").map(Number)
  const [endH, endM] = end.split(":").map(Number)
  const diff = (endH * 60 + endM) - (startH * 60 + startM)
  return diff > 0 ? `${diff} min` : "30 min"
}

export function AppointmentsHistory({
  appointments,
  isLoading,
  patient
}: {
  appointments: any[]
  isLoading: boolean
  patient?: any
}) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [onlyMine, setOnlyMine] = useState(false)

  const currentUser = session?.user as any
  const role = currentUser?.role as string
  const isAdmin = role === "ADMIN"
  const isDoctor = role === "DOCTOR"
  
  const canDeleteAppointment = (cita: any) => {
    if (isAdmin) return true
    if (isDoctor && cita.doctorId === currentUser?.id) return true
    return false
  }

  const sortedAppointments = useMemo(() => {
    const list = [...(appointments || [])].sort((a, b) => {
      const dateA = new Date(`${a.date?.split("T")[0]}T${a.startTime || "00:00"}`).getTime()
      const dateB = new Date(`${b.date?.split("T")[0]}T${b.startTime || "00:00"}`).getTime()
      return dateB - dateA
    })

    if (isDoctor && onlyMine) {
      return list.filter((cita: any) => cita.doctorId === currentUser?.id)
    }

    return list
  }, [appointments, isDoctor, onlyMine, currentUser?.id])

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Cita eliminada del historial" })
      window.location.reload()
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-card p-4 rounded-2xl border border-border/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5">
            <Stethoscope className="w-5 h-5 text-[#008bcd]" />
            Historial de Citas
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">
            Registro de todas las consultas del paciente con cualquier especialista.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isDoctor && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOnlyMine(!onlyMine)}
              className={cn(
                "rounded-xl h-10 px-3 text-xs font-bold border-border/80 transition-all cursor-pointer",
                onlyMine && "bg-[#008bcd]/10 text-[#008bcd] border-[#008bcd]/30"
              )}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              {onlyMine ? "Mostrando: Solo Mis Citas" : "Filtrar: Solo Mis Citas"}
            </Button>
          )}

          <PrintPatientAppointmentsModal
            patient={patient}
            appointments={sortedAppointments}
          />
        </div>
      </div>

      {/* Tabla del Historial en UI */}
      <div className="bg-card rounded-2xl shadow-xs border border-border/80 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px] text-xs">
            <thead className="bg-muted/40 border-b border-border/80">
              <tr className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <th className="px-5 py-3.5 w-16"># Trat.</th>
                <th className="px-5 py-3.5">Doctor Asignado</th>
                <th className="px-5 py-3.5">Fecha y Hora</th>
                <th className="px-5 py-3.5">Box</th>
                <th className="px-5 py-3.5">Motivo / Tto.</th>
                <th className="px-5 py-3.5 text-center">Estado</th>
                {(isAdmin || isDoctor) && <th className="px-5 py-3.5 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto text-[#008bcd]" />
                  </td>
                </tr>
              ) : sortedAppointments.length > 0 ? (
                sortedAppointments.map((cita: any, index: number) => {
                  const isMyAppointment = cita.doctorId === currentUser?.id
                  const statusConfig = appointmentStatuses[cita.status] || {
                    label: cita.status,
                    badgeColor: "text-slate-600 bg-slate-100 border-slate-200",
                  }
                  const canDelete = canDeleteAppointment(cita)

                  return (
                    <tr key={cita.id} className="hover:bg-muted/30 transition-colors group">
                      {/* # Tratamiento */}
                      <td className="px-5 py-3.5 align-middle">
                        <span className="font-bold text-foreground text-sm font-mono">
                          {(sortedAppointments.length - index).toString().padStart(2, "0")}
                        </span>
                      </td>

                      {/* Doctor Asignado */}
                      <td className="px-5 py-3.5 align-middle">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className={cn("font-bold text-sm", isMyAppointment ? "text-[#008bcd]" : "text-foreground")}>
                            {cita.doctor?.name || cita.doctorName || "Dr. Asignado"}
                          </span>
                          {isMyAppointment ? (
                            <span className="text-[10px] font-semibold bg-[#008bcd]/10 text-[#008bcd] px-2 py-0.5 rounded-md uppercase tracking-wider border border-[#008bcd]/20">
                              Atendido por ti
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                              <User className="w-3 h-3" /> Otro Especialista
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fecha y Hora */}
                      <td className="px-5 py-3.5 align-middle">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-sm">
                            {format(new Date(cita.date), "dd/MM/yyyy")}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-[#008bcd]" />
                            {cita.startTime} <span className="opacity-70">({calcularDuracion(cita.startTime, cita.endTime)})</span>
                          </span>
                        </div>
                      </td>

                      {/* Box */}
                      <td className="px-5 py-3.5 align-middle text-sm text-muted-foreground font-medium">
                        <span className="inline-block px-2 py-0.5 rounded border text-xs font-bold bg-muted/40 border-border/80">
                          {cita.box || "Box 1"}
                        </span>
                      </td>

                      {/* Motivo */}
                      <td className="px-5 py-3.5 align-middle text-sm text-foreground font-medium max-w-[220px] truncate" title={getReasonLabel(cita.reason)}>
                        {getReasonLabel(cita.reason)}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-3.5 align-middle text-center">
                        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border", statusConfig.badgeColor)}>
                          {statusConfig.label}
                        </span>
                      </td>

                      {/* Acciones */}
                      {(isAdmin || isDoctor) && (
                        <td className="px-5 py-3.5 align-middle text-center">
                          {canDelete ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-xl opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-border rounded-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-destructive font-black text-lg">¿Eliminar Cita?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-xs text-muted-foreground">
                                    Esta acción borrará permanentemente este registro del historial del paciente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-4 gap-2">
                                  <AlertDialogCancel className="border-border rounded-xl text-xs font-bold cursor-pointer">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(cita.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold cursor-pointer"
                                  >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, Eliminar"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                    <div className="bg-muted/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border/70">
                      <CalendarIcon className="w-8 h-8 text-[#008bcd] opacity-60" />
                    </div>
                    <p className="font-bold text-base text-foreground">Sin citas registradas</p>
                    <p className="text-xs mt-1">
                      {onlyMine ? "No tienes citas registradas con este paciente." : "Este paciente aún no tiene citas en su historial."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}