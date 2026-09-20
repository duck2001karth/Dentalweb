"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Printer, Loader2, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useGetPatientComments, useCreatePatientComment } from "@/hooks/patients"
import { PrintPatientCommentsModal } from "@/components/patients/prints/print-comments"
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

export function PatientNotesCard({ patient }: { patient: any }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any

  const { comments = [], refetch: refetchComments } = useGetPatientComments(patient?.id)
  const { createComment, isLoading: isCreatingComment } = useCreatePatientComment()
  const [newNoteText, setNewNoteText] = useState("")

  const handleSaveQuickNote = () => {
    if (!newNoteText.trim()) return
    createComment(
      { patientId: patient.id, text: newNoteText, authorId: currentUser?.id },
      {
        onSuccess: () => {
          setNewNoteText("")
          toast({ title: "Nota guardada con éxito" })
          if (refetchComments) refetchComments()
        },
        onError: () => toast({ title: "Error al guardar nota", variant: "destructive" }),
      }
    )
  }

  const handleDeleteNote = async (commentId: string) => {
    try {
      const res = await fetch(`/api/patients/${patient?.id}/comments?commentId=${commentId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Nota eliminada" })
      if (refetchComments) refetchComments()
    } catch {
      toast({ title: "Error al eliminar nota", variant: "destructive" })
    }
  }

  return (
    <div className="bg-card border border-border/85 rounded-[24px] p-5 shadow-xs flex flex-col font-sans">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
        <h3 className="text-sm font-bold text-foreground">Notas</h3>
        
        {/* Botón de Impresión con Icono */}
        <PrintPatientCommentsModal
          patient={patient}
          comments={comments}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#008bcd] hover:text-[#0070a8] hover:bg-[#008bcd]/10 rounded-xl cursor-pointer transition-colors"
              title="Visualizar e Imprimir Historial de Notas"
            >
              <Printer className="w-4 h-4" />
            </Button>
          }
        />
      </div>

      {/* Textarea con el botón de guardar integrado en la esquina inferior derecha */}
      <div className="relative mb-4">
        <textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="- El paciente refiere sensibilidad al frío..."
          className="w-full min-h-[120px] rounded-2xl border border-border/80 bg-muted/10 p-3.5 pb-14 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#008bcd] resize-none shadow-xs"
        />
        <div className="absolute right-3 bottom-3">
          <Button 
            type="button" 
            onClick={handleSaveQuickNote} 
            disabled={isCreatingComment || !newNoteText.trim()} 
            className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl h-8 px-4 text-xs font-bold cursor-pointer transition-all shadow-sm"
          >
            {isCreatingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null} Guardar nota
          </Button>
        </div>
      </div>

      {/* Listado de Notas con altura exacta limitada a 2 notas y scroll interno */}
      <div className="space-y-2.5 max-h-[195px] overflow-y-auto custom-scrollbar pr-1">
        {comments.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-3">No hay notas registradas.</p>
        ) : (
          comments.map((com: any) => {
            const userRole = String(currentUser?.role || "").toUpperCase().trim()
            const isAdmin = userRole === "ADMIN" || userRole === "ADMINISTRADOR" || userRole === "ADMINISTRACION"
            const isAuthor = Boolean(com?.authorId && com.authorId === currentUser?.id)
            const canDeleteNote = isAdmin || isAuthor

            return (
              <div key={com.id} className="p-3.5 bg-muted/20 rounded-2xl border border-border/70 text-xs relative group hover:border-[#008bcd]/40 transition-colors">
                <p className="text-foreground leading-relaxed pr-6">{com.text}</p>
                
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                  <span className="font-semibold">{com.author?.name || "Personal"}</span>
                  <span>{com.createdAt ? format(new Date(com.createdAt), "dd MMM yy", { locale: es }) : ""}</span>
                </div>

                {canDeleteNote && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute top-3 right-3 h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Eliminar nota"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sm:max-w-[420px] bg-background border-border p-6 rounded-[24px] shadow-2xl">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-500 shadow-inner">
                          <Trash2 className="w-7 h-7" />
                        </div>
                        <AlertDialogHeader className="space-y-2">
                          <AlertDialogTitle className="text-xl font-black text-foreground tracking-tight text-center">
                            ¿Eliminar nota?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed text-center px-2">
                            Esta acción borrará la nota permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                      </div>
                      <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6 pt-4 border-t border-border/60">
                        <AlertDialogCancel className="w-full sm:w-1/2 rounded-xl h-11 text-xs font-bold border-border bg-background text-foreground hover:bg-muted cursor-pointer">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteNote(com.id)} className="w-full sm:w-1/2 rounded-xl h-11 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all cursor-pointer">
                          Sí, eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}