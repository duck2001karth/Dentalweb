"use client"

import React, { useState } from "react"
import { AlertTriangle, Loader2, XCircle, ShieldAlert } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface VoidTaxDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  document: any
  onSuccess?: () => void
}

export function VoidTaxDocumentModal({
  isOpen,
  onClose,
  document: taxDoc,
  onSuccess,
}: VoidTaxDocumentModalProps) {
  const { toast } = useToast()
  const [reasonCategory, setReasonCategory] = useState("ERROR_DATOS")
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleVoidDocument = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!comments.trim() || comments.trim().length < 5) {
      toast({
        title: "Justificación requerida",
        description: "Ingresa un comentario detallando el motivo de la anulación.",
        variant: "warning",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/sri/invoices/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxDocumentId: taxDoc?.id,
          reasonCategory,
          comments: comments.trim(),
        }),
      })

      if (res.ok) {
        toast({
          title: "Factura Anulada",
          description: `El comprobante ${taxDoc?.secuencial} ha sido marcado como anulado.`,
          variant: "success",
        })
        if (onSuccess) onSuccess()
        onClose()
      } else {
        const data = await res.json()
        throw new Error(data.error || "No se pudo anular la factura.")
      }
    } catch (err: any) {
      toast({
        title: "Error al anular",
        description: err.message || "Ocurrió un error al procesar la solicitud.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] bg-card text-foreground border border-border/80 shadow-2xl rounded-3xl p-0 overflow-hidden font-sans antialiased">
        {/* CABECERA */}
        <DialogHeader className="px-6 py-4 border-b border-border/70 bg-red-500/5 flex flex-row items-center gap-3 text-left">
          <div className="p-2.5 bg-red-500/15 text-red-600 dark:text-red-400 rounded-2xl shrink-0 border border-red-500/20">
            <XCircle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
              Anular Comprobante Electrónico
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground mt-0.5">
              Factura: <b className="text-foreground">{taxDoc?.secuencial}</b> — Total:{" "}
              <b className="text-foreground">${Number(taxDoc?.total || 0).toFixed(2)} USD</b>
            </DialogDescription>
          </div>
        </DialogHeader>
        <form onSubmit={handleVoidDocument} className="p-6 space-y-4">
          <div className="p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed bg-[#008bcd]/8 dark:bg-[#008bcd]/12 border border-[#008bcd]/25 dark:border-[#008bcd]/30
      text-slate-900 dark:text-slate-500"
    >
      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#008bcd] dark:text-[#38bdf8]" />

      <div>
        <span className="font-bold text-[#0077ad] dark:text-[#38bdf8]">
          Nota fiscal:
        </span>{" "}
        Esta acción dará de baja el registro en el sistema clínico. Si el documento
        ya fue autorizado en el portal del SRI, recuerda tramitar la anulación
        tributaria o emitir la respectiva Nota de Crédito.
      </div>
    </div>

          {/* MOTIVO CATEGORÍA */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">Motivo de Anulación *</Label>
            <Select value={reasonCategory} onValueChange={setReasonCategory}>
              <SelectTrigger className="rounded-xl text-xs h-10 bg-background font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ERROR_DATOS">Error en datos del paciente (RUC / Cédula / Nombre)</SelectItem>
                <SelectItem value="ERROR_VALOR">Error en valor o cálculo de prestación</SelectItem>
                <SelectItem value="TRATAMIENTO_CANCELADO">Cancelación / Devolución de tratamiento</SelectItem>
                <SelectItem value="DUPLICADO">Emisión duplicada de comprobante</SelectItem>
                <SelectItem value="OTRO">Otro motivo justificado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* COMENTARIO OBLIGATORIO */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">
              Comentarios y Justificación <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Explica detalladamente la razón por la cual se procede a la anulación..."
              rows={3}
              className="rounded-xl text-xs bg-background resize-none"
            />
          </div>

          {/* FOOTER */}
          <DialogFooter className="pt-3 border-t border-border/70 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl text-xs font-bold h-10 px-4 hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !comments.trim()}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold h-10 px-5 shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
              )}
              Confirmar Anulación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}