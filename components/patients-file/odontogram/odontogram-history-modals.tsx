"use client"

import React from "react"
import { MessageSquare, Edit3, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface OdontogramHistoryModalsProps {
  selectedRecordForDetail: any
  setSelectedRecordForDetail: (record: any) => void
  isEditingNote: boolean
  setIsEditingNote: (editing: boolean) => void
  editedNote: string
  setEditedNote: (note: string) => void
  isSavingNote: boolean
  handleSaveObservation: () => Promise<void>
  recordToDelete: any
  setRecordToDelete: (record: any) => void
  confirmDeleteRecord: (record: any) => Promise<void>
  canEdit: boolean
  getStatusLabel: (status: string) => string
}

export function OdontogramHistoryModals({
  selectedRecordForDetail,
  setSelectedRecordForDetail,
  isEditingNote,
  setIsEditingNote,
  editedNote,
  setEditedNote,
  isSavingNote,
  handleSaveObservation,
  recordToDelete,
  setRecordToDelete,
  confirmDeleteRecord,
  canEdit,
  getStatusLabel,
}: OdontogramHistoryModalsProps) {
  return (
    <>
      {/* MODAL DETALLE Y EDICIÓN DE OBSERVACIÓN CLÍNICA */}
      <Dialog
        open={!!selectedRecordForDetail}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRecordForDetail(null)
            setIsEditingNote(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px] bg-card border-border/80 rounded-2xl shadow-xl p-6">
          <DialogHeader className="border-b border-border/70 pb-3">
            <DialogTitle className="text-sm font-black uppercase text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#008bcd]" /> Observación • Pieza #{selectedRecordForDetail?.toothNumber}
              </span>
              <span className="text-xs font-mono text-muted-foreground font-normal">
                {selectedRecordForDetail && getStatusLabel(selectedRecordForDetail.status)}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-3">
            {isEditingNote ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                  Editar Nota Clínica:
                </p>
                <textarea
                  rows={4}
                  value={editedNote}
                  onChange={(e) => setEditedNote(e.target.value)}
                  placeholder="Detalles del diagnóstico, profundidad, pronóstico o indicaciones..."
                  className="w-full text-xs font-medium rounded-xl p-3 bg-background border border-border/80 text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[#008bcd]"
                />
              </div>
            ) : (
              <div className="p-4 bg-muted/20 border border-border/70 rounded-xl text-xs font-medium text-foreground whitespace-pre-wrap leading-relaxed">
                {selectedRecordForDetail?.notes || "Sin observaciones clínicas registradas."}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-between border-t border-border/70 pt-3">
            {isEditingNote ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingNote(false)}
                  className="h-8 rounded-xl text-xs font-bold cursor-pointer"
                  disabled={isSavingNote}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveObservation}
                  disabled={isSavingNote}
                  className="h-8 rounded-xl text-xs font-bold bg-[#008bcd] hover:bg-[#0070a8] text-white cursor-pointer"
                >
                  {isSavingNote && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Guardar Cambios
                </Button>
              </>
            ) : (
              <>
                {canEdit ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingNote(true)}
                    className="h-8 rounded-xl text-xs font-bold text-[#008bcd] hover:bg-[#008bcd]/10 border-[#008bcd]/30 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Editar Nota
                  </Button>
                ) : <div />}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedRecordForDetail(null)}
                  className="h-8 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cerrar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMACIÓN PARA ANULAR REGISTRO */}
      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <AlertDialogContent className="bg-card border-border/80 rounded-2xl sm:max-w-[420px] p-6 shadow-2xl">
          <AlertDialogHeader className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center border border-destructive/20 mb-1">
              <Trash2 className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-base font-black text-foreground">
              ¿Anular hallazgo de la pieza #{recordToDelete?.toothNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Se anulará el registro <b className="text-foreground">&quot;{getStatusLabel(recordToDelete?.status || "")}&quot;</b> y se restaurará el estado anatómico de la pieza en el odontograma.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="w-full flex sm:justify-center gap-2 pt-3">
            <AlertDialogCancel className="rounded-xl h-9 px-4 border-border/80 font-bold text-xs cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmDeleteRecord(recordToDelete)
                setRecordToDelete(null)
              }}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-xl h-9 px-4 text-xs font-bold shadow-xs cursor-pointer"
            >
              Sí, Anular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}