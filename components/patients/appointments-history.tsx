"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, CalendarIcon, Clock, Printer, Trash2, User } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const calcularDuracion = (start: string, end: string) => {
  if (!start || !end) return "30 min"
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  const diff = (endH * 60 + endM) - (startH * 60 + startM)
  return diff > 0 ? `${diff} min` : "30 min"
}

export function AppointmentsHistory({ appointments, isLoading }: { appointments: any[], isLoading: boolean }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const currentUser = session?.user as any
  const canDelete = currentUser?.role === "ADMIN" || currentUser?.role === "RECEPTIONIST"

  const sortedAppointments = [...(appointments || [])].sort((a, b) => {
    const dateA = new Date(`${a.date.split('T')[0]}T${a.startTime || '00:00'}`).getTime();
    const dateB = new Date(`${b.date.split('T')[0]}T${b.startTime || '00:00'}`).getTime();
    return dateB - dateA;
  });

  const handleDelete = async (id: string) => {
    if (!canDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Cita eliminada del historial", variant: "success" })
      window.location.reload() 
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-card p-4 rounded-xl border border-border shadow-sm sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
            Historial de Citas
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Registro de todas las consultas del paciente con cualquier especialista.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()} className="bg-background text-foreground hover:bg-accent border-border shadow-sm rounded-xl font-bold">
            <Printer className="w-4 h-4 mr-2" /> Imprimir historial
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4"># Tratamiento</th>
                <th className="px-6 py-4">Doctor Asignado</th>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Box</th>
                <th className="px-6 py-4">Motivo / Tto.</th>
                <th className="px-6 py-4 text-center">Estado</th>
                {/* Oculta la columna a los doctores */}
                {canDelete && <th className="px-6 py-4 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto text-[#008bcd] dark:text-blue-400" />
                  </td>
                </tr>
              ) : sortedAppointments.length > 0 ? (
                sortedAppointments.map((cita: any, index: number) => {
                  const isMyAppointment = cita.doctorId === currentUser?.id;

                  return (
                    <tr key={cita.id} className="hover:bg-muted/30 transition-colors group">
                      
                      {/* # Tratamiento */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-foreground text-base">
                          {(sortedAppointments.length - index).toString().padStart(2, '0')}
                        </span>
                      </td>

                      {/* Profesional (Diseño Suave Premium) */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={cn("font-bold text-sm", isMyAppointment ? "text-[#008bcd] dark:text-blue-400" : "text-foreground")}>
                            {cita.doctor?.name || "Dr. Asignado"}
                          </span>
                          {isMyAppointment ? (
                            <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded-md uppercase tracking-wider border border-blue-100 dark:border-blue-800">
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
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-sm">
                            {format(new Date(cita.date), "dd/MM/yyyy")}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                            <Clock className="w-3 h-3"/> {cita.startTime} <span className="opacity-60 ml-0.5">({calcularDuracion(cita.startTime, cita.endTime)})</span>
                          </span>
                        </div>
                      </td>

                      {/* Box */}
                      <td className="px-6 py-4 text-sm text-muted-foreground font-medium">
                        {cita.box || "Box 1"}
                      </td>

                      {/* Motivo */}
                      <td className="px-6 py-4 text-sm text-foreground font-medium max-w-[200px] truncate" title={cita.reason || "Consulta General"}>
                        {cita.reason || "Consulta General"}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 text-center">
                        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border", 
                          cita.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                          cita.status === "SCHEDULED" ? "bg-muted text-foreground border-border" :
                          cita.status === "IN_PROGRESS" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" :
                          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        )}>
                          {cita.status === "SCHEDULED" ? "Agendada" : 
                           cita.status === "WAITING" ? "En Sala" : 
                           cita.status === "IN_PROGRESS" ? "En Box" : 
                           cita.status === "COMPLETED" ? "Atendida" : cita.status}
                        </span>
                      </td>

                      {/* Acciones */}
                      {canDelete && (
                        <td className="px-6 py-4 text-center">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 rounded-lg opacity-50 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-background border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-600">¿Eliminar Cita?</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción borrará este registro del historial general de citas. No se puede deshacer.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-border rounded-xl">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(cita.id)} className="bg-red-600 text-white hover:bg-red-700 rounded-xl">
                                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Eliminar"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      )}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                    <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                      <CalendarIcon className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="font-bold text-lg text-foreground">Sin citas registradas</p>
                    <p className="text-sm mt-1">Este paciente aún no tiene citas en su historial general.</p>
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