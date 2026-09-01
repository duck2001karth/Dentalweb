"use client"

import { useState } from "react"
import { MessageSquare, Plus, User, Clock, Loader2, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useGetPatientComments, useCreatePatientComment } from "@/hooks/patients"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { PrintPatientCommentsModal } from "@/components/patients/print-comments"

export function ComentariosTab({ patientId, patient }: { patientId: string; patient?: any }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any
  const canDelete = currentUser?.role === "ADMIN" || currentUser?.role === "DOCTOR"

  const { comments = [], isLoading } = useGetPatientComments(patientId)
  const { createComment, isLoading: isSubmitting } = useCreatePatientComment()
  const [nuevoComentario, setNuevoComentario] = useState("")

  const handleAgregar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoComentario.trim()) return
    createComment(
      { patientId, text: nuevoComentario, authorId: currentUser?.id },
      {
        onSuccess: () => {
          setNuevoComentario("")
          toast({ title: "Nota agregada" })
        },
        onError: () => toast({ title: "Error", description: "No se pudo guardar la nota.", variant: "destructive" }),
      }
    )
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/patient-comments/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Comentario eliminado" })
      window.location.reload() 
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" })
    }
  }

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      
      {/* Encabezado Superior con Botón de Impresión */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-card p-4 rounded-2xl border border-border/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-[#008bcd]" />
            Comentarios Internos
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">
            Notas administrativas y recordatorios de gestión (no visibles en la historia clínica del paciente).
          </p>
        </div>

        <PrintPatientCommentsModal patient={patient} comments={comments} />
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulario de Nueva Nota */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAgregar} className="bg-card rounded-2xl shadow-xs border border-border/80 p-5 sticky top-24">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-[#008bcd]" /> Nueva Nota
            </h3>
            <textarea
              className="w-full bg-background border border-border/80 rounded-xl p-3.5 text-xs text-foreground focus:outline-none focus:border-[#008bcd] resize-none min-h-[130px] mb-3 placeholder:text-muted-foreground"
              placeholder="Escribe una observación administrativa o recordatorio..."
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              disabled={isSubmitting}
            />
            <Button 
              type="submit" 
              disabled={isSubmitting || !nuevoComentario.trim()} 
              className="w-full bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl h-10 font-bold text-xs cursor-pointer shadow-xs transition-all"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} 
              {isSubmitting ? "Guardando..." : "Agregar Nota"}
            </Button>
          </form>
        </div>

        {/* Listado de Comentarios */}
        <div className="lg:col-span-2 space-y-3.5">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#008bcd]" />
            </div>
          ) : comments.length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-border/80 p-12 text-center shadow-xs">
              <MessageSquare className="w-10 h-10 text-muted-foreground opacity-20 mx-auto mb-3" />
              <p className="text-foreground font-bold text-sm">Sin comentarios registrados</p>
              <p className="text-xs text-muted-foreground mt-1">Agrega notas internas para el seguimiento del equipo.</p>
            </div>
          ) : (
            comments.map((com: any) => (
              <div key={com.id} className="bg-card rounded-2xl shadow-xs border border-border/80 p-4 hover:border-[#008bcd]/40 transition-colors">
                <p className="text-foreground text-xs leading-relaxed whitespace-pre-wrap font-medium">{com.text}</p>
                <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                      <User className="w-3.5 h-3.5 text-[#008bcd]" /> {com.author?.name || "Usuario"}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 opacity-60" /> {formatDistanceToNow(new Date(com.createdAt), { addSuffix: true, locale: es })}
                    </div>
                  </div>
                  
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7 p-0 rounded-lg cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-destructive font-black text-base">¿Eliminar comentario?</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs text-muted-foreground">
                            Se borrará permanentemente de este perfil.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4 gap-2">
                          <AlertDialogCancel className="border-border rounded-xl text-xs font-bold cursor-pointer">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(com.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold cursor-pointer">
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  )
}