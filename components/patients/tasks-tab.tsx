"use client"

import { useState } from "react"
import { CheckCircle2, Circle, CalendarIcon, Plus, User, Loader2, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

import { useGetPatientTasks, useCreatePatientTask, useUpdateTaskStatus } from "@/hooks/patients"

export function TareasTab({ patientId }: { patientId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any
  const canDelete = currentUser?.role === "ADMIN" || currentUser?.role === "DOCTOR"

  const { tasks, isLoading } = useGetPatientTasks(patientId)
  const { createTask, isLoading: isSubmitting } = useCreatePatientTask()
  const { toggleTask } = useUpdateTaskStatus()

  const [nuevaTarea, setNuevaTarea] = useState("")

  const handleAgregar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaTarea.trim()) return
    createTask({ patientId, title: nuevaTarea, creatorId: currentUser?.id, assignedToId: null }, {
      onSuccess: () => { setNuevaTarea(""); toast({ title: "Tarea creada", variant: "success" }) },
      onError: () => toast({ title: "Error al crear", variant: "destructive" })
    })
  }

  const handleToggle = (taskId: string, currentState: boolean) => {
    toggleTask({ patientId, taskId, isCompleted: !currentState }, {
      onError: () => toast({ title: "Error al actualizar", variant: "destructive" })
    })
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/patient-tasks/${id}`, { method: "DELETE" })
      toast({ title: "Tarea eliminada", variant: "success" })
      window.location.reload() // O el refetch de tu hook
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" })
    }
  }

  const tareasPendientes = tasks.filter((t: any) => !t.isCompleted)
  const tareasCompletadas = tasks.filter((t: any) => t.isCompleted)

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestor de Tareas</h2>
          <p className="text-muted-foreground mt-1">Acciones pendientes específicas para este paciente.</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-8">
        <form onSubmit={handleAgregar} className="flex gap-3">
          <Input 
            value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} disabled={isSubmitting}
            placeholder="Ej. Cobrar saldo pendiente, Llamar para control..." 
            className="bg-background border-border text-foreground placeholder:text-muted-foreground flex-1 h-12 rounded-xl text-base px-4"
          />
          <Button type="submit" disabled={isSubmitting || !nuevaTarea.trim()} className="bg-[#008bcd] hover:bg-[#0070a8] text-white shrink-0 h-12 rounded-xl font-bold px-6">
            {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />} Crear Tarea
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#008bcd]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pendientes */}
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pendientes ({tareasPendientes.length})
            </h3>
            <div className="space-y-3">
              {tareasPendientes.length === 0 && <p className="text-sm text-muted-foreground italic p-4 text-center border border-dashed border-border rounded-xl bg-card">No hay tareas pendientes.</p>}
              {tareasPendientes.map((tarea: any) => (
                <div key={tarea.id} className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-start gap-3 transition-colors hover:border-[#008bcd]/50 group">
                  <button onClick={() => handleToggle(tarea.id, tarea.isCompleted)} className="mt-0.5 text-muted-foreground hover:text-emerald-500 transition-colors"><Circle className="w-5 h-5" /></button>
                  <div className="flex-1">
                    <p className="text-foreground font-medium text-sm leading-snug">{tarea.title}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-md"><User className="w-3 h-3" /> {tarea.assignedTo?.name || "Sin asignar"}</span>
                      </div>
                      {/* BOTÓN ELIMINAR PROTEGIDO */}
                      {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-background border-border">
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle><AlertDialogDescription>Se borrará permanentemente.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel className="border-border rounded-xl">Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(tarea.id)} className="bg-red-600 text-white rounded-xl">Eliminar</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completadas */}
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2 mb-4 opacity-70">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completadas ({tareasCompletadas.length})
            </h3>
            <div className="space-y-3 opacity-70 hover:opacity-100 transition-opacity">
              {tareasCompletadas.length === 0 && <p className="text-sm text-muted-foreground italic p-4 text-center border border-dashed border-border rounded-xl bg-card">No hay tareas completadas.</p>}
              {tareasCompletadas.map((tarea: any) => (
                <div key={tarea.id} className="bg-muted/50 border border-border rounded-xl p-4 flex items-start gap-3 group">
                  <button onClick={() => handleToggle(tarea.id, tarea.isCompleted)} className="mt-0.5 text-emerald-500"><CheckCircle2 className="w-5 h-5" /></button>
                  <div className="flex-1">
                    <p className="text-muted-foreground font-medium text-sm line-through leading-snug">{tarea.title}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><User className="w-3 h-3" /> {tarea.assignedTo?.name || "Completada"}</span>
                      {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild><button className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button></AlertDialogTrigger>
                          <AlertDialogContent className="bg-background border-border">
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel className="border-border rounded-xl">Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(tarea.id)} className="bg-red-600 text-white rounded-xl">Eliminar</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}