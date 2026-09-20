"use client"

import { useState } from "react"
import { CheckSquare, Plus, User, Loader2, Trash2, Eye, Circle, CheckCircle2 } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
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

import { useGetPatientTasks, useCreatePatientTask, useUpdateTaskStatus } from "@/hooks/patients"
import { PrintPatientTasksModal } from "@/components/patients/prints/print-tasks"
import { cn } from "@/lib/utils"

export function TareasTab({ patientId, patient }: { patientId: string; patient?: any }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any
  const role = currentUser?.role as string
  const canDelete = role === "ADMIN" || role === "ADMINISTRACION" || role === "RECEPCION" || role === "RECEPTIONIST" || role === "DOCTOR"

  const { tasks = [], isLoading, refetch } = useGetPatientTasks(patientId)
  const { createTask, isLoading: isSubmitting } = useCreatePatientTask()
  const { toggleTask } = useUpdateTaskStatus()

  const [nuevaTarea, setNuevaTarea] = useState("")

  const handleAgregar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaTarea.trim()) return
    createTask(
      { patientId, title: nuevaTarea, creatorId: currentUser?.id, assignedToId: null },
      {
        onSuccess: () => {
          setNuevaTarea("")
          toast({ title: "Tarea registrada con éxito" })
          if (refetch) refetch()
        },
        onError: () => toast({ title: "Error al crear la tarea", variant: "destructive" }),
      }
    )
  }

  const handleToggle = (taskId: string, currentState: boolean) => {
    toggleTask(
      { patientId, taskId, isCompleted: !currentState },
      {
        onSuccess: () => {
          if (refetch) refetch()
        },
        onError: () => toast({ title: "Error al actualizar estado", variant: "destructive" }),
      }
    )
  }

  const handleDelete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/tasks/${taskId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Tarea eliminada definitivamente" })
      if (refetch) refetch()
    } catch {
      toast({ title: "Error al eliminar la tarea", variant: "destructive" })
    }
  }

  const tareasPendientes = tasks.filter((t: any) => !t.isCompleted)
  const tareasCompletadas = tasks.filter((t: any) => t.isCompleted)

  return (
    <div className="animate-in fade-in duration-300 pb-20 space-y-6 font-sans">
      
      {/* TARJETA UNIFICADA MODERNA */}
      <div className="bg-card border border-border/85 rounded-[24px] shadow-xs relative overflow-hidden">
        
        {/* Cabecera integrada */}
        <div className="px-6 py-4.5 border-b border-border/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#008bcd]" />
            Gestor de Tareas y Pendientes ({tasks.length})
          </h3>

          <PrintPatientTasksModal 
            patient={patient} 
            tasks={tasks}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-9 px-3.5 text-xs font-bold border-border hover:bg-muted gap-1.5 cursor-pointer text-foreground"
              >
                <Eye className="w-3.5 h-3.5 text-[#008bcd]" /> Visualizar Tareas
              </Button>
            }
          />
        </div>

        {/* Formulario de Creación */}
        <div className="p-6 border-b border-border/60 bg-muted/10">
          <form onSubmit={handleAgregar} className="flex gap-3">
            <Input 
              value={nuevaTarea} 
              onChange={(e) => setNuevaTarea(e.target.value)} 
              disabled={isSubmitting}
              placeholder="Ej. Recordar traer placa panorámica, confirmar presupuesto..." 
              className="bg-background border-border/80 text-foreground placeholder:text-muted-foreground flex-1 h-11 rounded-xl text-xs px-4 shadow-xs"
            />
            <Button 
              type="submit" 
              disabled={isSubmitting || !nuevaTarea.trim()} 
              className="bg-[#008bcd] hover:bg-[#0070a8] text-white shrink-0 h-11 rounded-xl font-bold px-6 cursor-pointer shadow-xs transition-all text-xs"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />} 
              Agregar Tarea
            </Button>
          </form>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#008bcd]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* COLUMNA PENDIENTES */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Pendientes ({tareasPendientes.length})
                  </h4>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                  {tareasPendientes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-6 text-center border border-dashed border-border/80 rounded-2xl bg-muted/20">
                      No hay tareas pendientes.
                    </p>
                  ) : (
                    tareasPendientes.map((tarea: any) => (
                      <div 
                        key={tarea.id} 
                        className="bg-muted/20 border border-border/70 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 transition-all hover:border-[#008bcd]/50 group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <button 
                            type="button"
                            onClick={() => handleToggle(tarea.id, false)} 
                            className="text-muted-foreground hover:text-[#008bcd] transition-colors cursor-pointer shrink-0"
                            title="Marcar como completada"
                          >
                            <Circle className="w-5 h-5" />
                          </button>

                          <div className="flex flex-col min-w-0">
                            <p className="text-xs font-semibold text-foreground leading-relaxed break-words">{tarea.title}</p>
                            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                              {tarea.assignedTo?.name || "Sin Asignar"}
                            </span>
                          </div>
                        </div>

                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-xl opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                                title="Eliminar tarea"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            
                            <AlertDialogContent className="sm:max-w-[420px] bg-background border-border p-6 rounded-[24px] shadow-2xl">
                              <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-500 shadow-inner">
                                  <Trash2 className="w-7 h-7" />
                                </div>
                                <AlertDialogHeader className="space-y-2">
                                  <AlertDialogTitle className="text-xl font-black text-foreground tracking-tight text-center">
                                    ¿Eliminar tarea?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed text-center px-2">
                                    Estás a punto de borrar permanentemente esta tarea. Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                              </div>

                              <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6 pt-4 border-t border-border/60">
                                <AlertDialogCancel className="w-full sm:w-1/2 rounded-xl h-11 text-xs font-bold border-border bg-background text-foreground hover:bg-muted cursor-pointer">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(tarea.id)} 
                                  className="w-full sm:w-1/2 rounded-xl h-11 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all cursor-pointer"
                                >
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* COLUMNA COMPLETADAS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider opacity-80">
                    Completadas ({tareasCompletadas.length})
                  </h4>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1 opacity-85 hover:opacity-100 transition-opacity">
                  {tareasCompletadas.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-6 text-center border border-dashed border-border/80 rounded-2xl bg-muted/20">
                      No hay tareas completadas.
                    </p>
                  ) : (
                    tareasCompletadas.map((tarea: any) => (
                      <div 
                        key={tarea.id} 
                        className="bg-muted/30 border border-border/70 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <button 
                            type="button"
                            onClick={() => handleToggle(tarea.id, true)} 
                            className="text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer shrink-0"
                            title="Marcar como pendiente"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>

                          <div className="flex flex-col min-w-0">
                            <p className="text-xs font-semibold text-muted-foreground line-through leading-relaxed break-words">{tarea.title}</p>
                            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                              Completada
                            </span>
                          </div>
                        </div>

                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-xl opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                                title="Eliminar tarea"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            
                            <AlertDialogContent className="sm:max-w-[420px] bg-background border-border p-6 rounded-[24px] shadow-2xl">
                              <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-500 shadow-inner">
                                  <Trash2 className="w-7 h-7" />
                                </div>
                                <AlertDialogHeader className="space-y-2">
                                  <AlertDialogTitle className="text-xl font-black text-foreground tracking-tight text-center">
                                    ¿Eliminar tarea?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed text-center px-2">
                                    Estás a punto de borrar permanentemente esta tarea. Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                              </div>

                              <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6 pt-4 border-t border-border/60">
                                <AlertDialogCancel className="w-full sm:w-1/2 rounded-xl h-11 text-xs font-bold border-border bg-background text-foreground hover:bg-muted cursor-pointer">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(tarea.id)} 
                                  className="w-full sm:w-1/2 rounded-xl h-11 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all cursor-pointer"
                                >
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  )
}