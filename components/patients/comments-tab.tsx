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

export function ComentariosTab({ patientId }: { patientId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  // --- REGLAS DE ROL ---
  const currentUser = session?.user as any
  const canDelete = currentUser?.role === "ADMIN" || currentUser?.role === "DOCTOR"

  const { comments, isLoading } = useGetPatientComments(patientId)
  const { createComment, isLoading: isSubmitting } = useCreatePatientComment()
  const [nuevoComentario, setNuevoComentario] = useState("")

  const handleAgregar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoComentario.trim()) return
    createComment({ patientId, text: nuevoComentario, authorId: currentUser?.id }, {
      onSuccess: () => { setNuevoComentario(""); toast({ title: "Nota agregada", variant: "success" }) },
      onError: () => toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" })
    })
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/patient-comments/${id}`, { method: "DELETE" })
      toast({ title: "Comentario eliminado", variant: "success" })
      window.location.reload() // O usa el refetch() de tu hook si lo tienes
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" })
    }
  }

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Comentarios Internos</h2>
          <p className="text-muted-foreground mt-1">Notas administrativas y recordatorios sobre el paciente (No visibles en la historia clínica).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <form onSubmit={handleAgregar} className="bg-card rounded-2xl shadow-sm border border-border p-6 sticky top-24">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-[#008bcd]" /> Nuevo Comentario
            </h3>
            <textarea
              className="w-full bg-background border border-border rounded-xl p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#008bcd] resize-none min-h-[140px] mb-4 placeholder:text-muted-foreground"
              placeholder="Escribe una nota interna aquí..."
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting || !nuevoComentario.trim()} className="w-full bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl h-11 font-bold">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} 
              {isSubmitting ? "Guardando..." : "Agregar Nota"}
            </Button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#008bcd]" /></div>
          ) : comments.length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center shadow-sm">
              <MessageSquare className="w-10 h-10 text-muted-foreground opacity-20 mx-auto mb-3" />
              <p className="text-foreground font-medium">No hay comentarios aún</p>
            </div>
          ) : (
            comments.map((com: any) => (
              <div key={com.id} className="bg-card rounded-2xl shadow-sm border border-border p-5 hover:border-[#008bcd]/30 transition-colors">
                <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{com.text}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><User className="w-3.5 h-3.5" /> {com.author?.name || "Usuario"}</div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Clock className="w-3.5 h-3.5" /> {formatDistanceToNow(new Date(com.createdAt), { addSuffix: true, locale: es })}</div>
                  </div>
                  {/* BOTÓN ELIMINAR PROTEGIDO */}
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600 h-7 px-2"><Trash2 className="w-3.5 h-3.5"/></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-background border-border">
                        <AlertDialogHeader><AlertDialogTitle>¿Eliminar comentario?</AlertDialogTitle><AlertDialogDescription>Se borrará permanentemente de este perfil.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border rounded-xl">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(com.id)} className="bg-red-600 text-white rounded-xl">Eliminar</AlertDialogAction>
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