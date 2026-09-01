"use client"

import { useState } from "react"
import { CheckSquare, Plus, User, Loader2, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

import { useGetPatientTasks, useCreatePatientTask, useUpdateTaskStatus } from "@/hooks/patients"
import { taskStatuses } from "@/constants/status"
import { PrintPatientTasksModal } from "@/components/patients/print-tasks"

export function TareasTab({ patientId, patient }: { patientId: string; patient?: any }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any
  const canDelete = currentUser?.role === "ADMIN" || currentUser?.role === "DOCTOR"

  const { tasks = [], isLoading } = useGetPatientTasks(patientId)
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
          toast({ title: "Tarea creada" })
        },
        onError: () => toast({ title: "Error al crear", variant: "destructive" }),
      }
    )
  }

  const handleToggle = (taskId: string, currentState: boolean) => {
    toggleTask(
      { patientId, taskId, isCompleted: !currentState },
      {
        onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
      }
    )
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/patient-tasks/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Tarea eliminada" })
      window.location.reload()
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" })
    }
  }

  const tareasPendientes = tasks.filter((t: any) => !t.isCompleted)
  const tareasCompletadas = tasks.filter((t: any) => t.isCompleted)

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      
      {/* Encabezado con Botón de Visualización e Impresión */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-card p-4 rounded-2xl border border-border/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-[#008bcd]" />
            Gestor de Tareas
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">
            Acciones pendientes y seguimiento específico para este paciente.
          </p>
        </div>

        <PrintPatientTasksModal patient={patient} tasks={tasks} />
      </div>

      {/* Formulario de Nueva Tarea */}
      <div className="bg-card rounded-2xl shadow-xs border border-border/80 p-5 mb-8">
        <form onSubmit={handleAgregar} className="flex gap-3">
          <Input 
            value={nuevaTarea} 
            onChange={(e) => setNuevaTarea(e.target.value)} 
            disabled={isSubmitting}
            placeholder="Ej. Cobrar saldo pendiente, llamar para control, coordinar prótesis..." 
            className="bg-background border-border/80 text-foreground placeholder:text-muted-foreground flex-1 h-11 rounded-xl text-sm px-4"
          />
          <Button 
            type="submit" 
            disabled={isSubmitting || !nuevaTarea.trim()} 
            className="bg-[#008bcd] hover:bg-[#0070a8] text-white shrink-0 h-11 rounded-xl font-bold px-6 cursor-pointer shadow-xs transition-all"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} 
            Crear Tarea
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#008bcd]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* COLUMNA PENDIENTES */}
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2 mb-3 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 
              Pendientes ({tareasPendientes.length})
            </h3>
            
            <div className="space-y-3">
              {tareasPendientes.length === 0 && (
                <p className="text-xs text-muted-foreground italic p-6 text-center border border-dashed border-border/80 rounded-2xl bg-card">
                  No hay tareas pendientes.
                </p>
              )}
              
              {tareasPendientes.map((tarea: any) => {
                const config = taskStatuses.PENDING
                const StatusIcon = config.icon

                return (
                  <div 
                    key={tarea.id} 
                    className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex items-start gap-3 transition-all hover:border-[#008bcd]/50 group"
                  >
                    <button 
                      onClick={() => handleToggle(tarea.id, tarea.isCompleted)} 
                      className="mt-0.5 text-muted-foreground hover:text-[#008bcd] transition-colors cursor-pointer"
                    >
                      <StatusIcon className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-foreground font-semibold text-sm leading-snug">{tarea.title}</p>
                        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${config.badgeColor}`}>
                          {config.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                          <User className="w-3 h-3 text-[#008bcd]" /> {tarea.assignedTo?.name || "Sin asignar"}
                        </span>
                        
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="text-destructive hover:text-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-destructive font-black">¿Eliminar tarea?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs text-muted-foreground">
                                  Esta acción borrará la tarea definitivamente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-4 gap-2">
                                <AlertDialogCancel className="border-border rounded-xl text-xs font-bold">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(tarea.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold">
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* COLUMNA COMPLETADAS */}
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2 mb-3 text-sm opacity-80">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 
              Completadas ({tareasCompletadas.length})
            </h3>
            
            <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
              {tareasCompletadas.length === 0 && (
                <p className="text-xs text-muted-foreground italic p-6 text-center border border-dashed border-border/80 rounded-2xl bg-card">
                  No hay tareas completadas.
                </p>
              )}
              
              {tareasCompletadas.map((tarea: any) => {
                const config = taskStatuses.COMPLETED
                const StatusIcon = config.icon

                return (
                  <div 
                    key={tarea.id} 
                    className="bg-muted/30 border border-border/70 rounded-2xl p-4 flex items-start gap-3 group"
                  >
                    <button 
                      onClick={() => handleToggle(tarea.id, tarea.isCompleted)} 
                      className="mt-0.5 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                    >
                      <StatusIcon className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-muted-foreground font-medium text-sm line-through leading-snug">{tarea.title}</p>
                        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${config.badgeColor}`}>
                          {config.label}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/40">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <User className="w-3 h-3" /> {tarea.assignedTo?.name || "Completada"}
                        </span>
                        
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="text-destructive hover:text-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-destructive font-black">¿Eliminar tarea?</AlertDialogTitle>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-4 gap-2">
                                <AlertDialogCancel className="border-border rounded-xl text-xs font-bold">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(tarea.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold">
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  )
}