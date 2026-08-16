"use client"

import React, { useState, useMemo } from "react"
import { 
  History, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, SlidersHorizontal, AlertCircle 
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
const formatPaymentMethod = (method?: string) => {
  if (!method) return "Efectivo"
  const m = method.toUpperCase().trim()
  switch (m) {
    case "CASH":
    case "EFECTIVO":
      return "Efectivo"
    case "CREDIT_CARD":
    case "TARJETA_CREDITO":
      return "Tarjeta de Crédito"
    case "DEBIT_CARD":
    case "TARJETA_DEBITO":
      return "Tarjeta de Débito"
    case "TRANSFER":
    case "TRANSFERENCIA":
    case "DEUNA":
      return "Transferencia Bancaria"
    case "CHECK":
    case "CHEQUE":
      return "Cheque"
    default:
      return method
  }
}

const parseRefundReason = (rawNotes?: string) => {
  if (!rawNotes) return { reasonLabel: "Nota de Crédito", detail: "" }

  let reasonLabel = "Nota de Crédito"
  let detail = rawNotes.trim()
  if (rawNotes.includes("[ANULACION]") || rawNotes.includes("Anulación de cobro por error")) {
    reasonLabel = "Anulación de cobro por error"
    detail = rawNotes.replace(/\[ANULACION\]:\s*/gi, "").replace(/Anulación de cobro por error:\s*/gi, "").trim()
  } else if (rawNotes.includes("[DUPLICADO]") || rawNotes.includes("Cobro registrado por duplicado")) {
    reasonLabel = "Cobro registrado por duplicado"
    detail = rawNotes.replace(/\[DUPLICADO\]:\s*/gi, "").replace(/Cobro registrado por duplicado:\s*/gi, "").trim()
  } else if (rawNotes.includes("[DEVOLUCION_PACIENTE]") || rawNotes.includes("Devolución a solicitud del paciente")) {
    reasonLabel = "Devolución a solicitud del paciente"
    detail = rawNotes.replace(/\[DEVOLUCION_PACIENTE\]:\s*/gi, "").replace(/Devolución a solicitud del paciente:\s*/gi, "").trim()
  } else if (rawNotes.includes("[PROCEDIMIENTO_NO_REALIZADO]") || rawNotes.includes("Procedimiento no realizado")) {
    reasonLabel = "Procedimiento no realizado"
    detail = rawNotes.replace(/\[PROCEDIMIENTO_NO_REALIZADO\]:\s*/gi, "").replace(/Procedimiento no realizado:\s*/gi, "").trim()
  } else if (rawNotes.includes("[OTRO]") || rawNotes.includes("Otro motivo")) {
    reasonLabel = "Otro motivo"
    detail = rawNotes.replace(/\[OTRO\]:\s*/gi, "").replace(/Otro motivo:\s*/gi, "").trim()
  } else {
    const match = rawNotes.match(/^NOTA DE CRÉDITO\s*(\[.*?\])?:\s*(.*)/i)
    if (match) {
      reasonLabel = "Nota de Crédito"
      detail = match[2] || ""
    }
  }
  detail = detail.split(" | Historial previo:")[0].trim()

  return { reasonLabel, detail }
}

interface RefundsViewProps {
  refunds: any[]
  patient?: any
  onRefresh?: () => void
}

export function RefundsView({ refunds = [], patient, onRefresh }: RefundsViewProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any

  const canDeleteRefund = currentUser?.role === "ADMIN"

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [refundToDelete, setRefundToDelete] = useState<any | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const totalItems = refunds.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1

  const paginatedRefunds = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return refunds.slice(startIndex, startIndex + pageSize)
  }, [refunds, currentPage, pageSize])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage)
  }

  const handlePageSizeChange = (val: string) => {
    setPageSize(Number(val))
    setCurrentPage(1)
  }

  const handleConfirmDelete = async () => {
    if (!refundToDelete) return
    if (!deleteReason.trim()) {
      toast({ 
        title: "Justificación requerida", 
        description: "Debes escribir el motivo de la anulación.", 
        variant: "destructive" 
      })
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/payments/${refundToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: deleteReason,
          deletedBy: currentUser?.name || "Administrador",
        }),
      })

      if (!res.ok) throw new Error()

      toast({ 
        title: "Nota de Crédito eliminada", 
        description: "El registro ha pasado a la auditoría de eliminados.", 
        variant: "success" 
      })
      setRefundToDelete(null)
      setDeleteReason("")
      if (onRefresh) onRefresh()
    } catch (e) {
      toast({ 
        title: "Error", 
        description: "No se pudo eliminar la nota de crédito.", 
        variant: "destructive" 
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 font-sans antialiased animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <div className="bg-[#008bcd]/10 p-1.5 rounded-lg border border-[#008bcd]/20"> 
            <History className="w-5 h-5 text-[#008bcd]" /> 
            </div>
            Historial de Devoluciones y Notas de Crédito
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro de ajustes contables a favor del paciente, devoluciones y saldos reabiertos.
          </p>
        </div>
        {!canDeleteRefund && (
          <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2.5 py-1 rounded-md border border-border tracking-wider">
            SOLO LECTURA
          </span>
        )}
      </div>

      {/* TABLA DE DEVOLUCIONES */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-4 px-5"># Documento</th>
                <th className="py-4 px-5"># Tratamiento Afectado</th>
                <th className="py-4 px-5">Método Reembolso</th>
                <th className="py-4 px-5 min-w-[280px]">Motivo / Detalle</th>
                <th className="py-4 px-5 whitespace-nowrap">Fecha Emisión</th>
                <th className="py-4 px-5 text-right whitespace-nowrap">Monto Devuelto</th>
                {canDeleteRefund && <th className="py-4 px-5 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {paginatedRefunds.length === 0 ? (
                <tr>
                  <td colSpan={canDeleteRefund ? 7 : 6} className="py-14 text-center text-muted-foreground font-medium">
                    No existen notas de crédito o devoluciones registradas para este paciente.
                  </td>
                </tr>
              ) : (
                paginatedRefunds.map((refund, idx) => {
                  const refundDocNum = refund.paymentNumber || refund.receiptNumber || refund.number || `#REC-${refund.id?.slice(-6) || idx + 1}`
                  const rawAmount = Math.abs(Number(refund.amount || 0))
                  const { reasonLabel, detail } = parseRefundReason(refund.notes || refund.reason || refund.concept)

                  return (
                    <tr key={refund.id || idx} className="hover:bg-muted/15 transition-colors group">
                      <td className="py-4 px-5 align-middle whitespace-nowrap">
                        <p className="font-bold text-amber-600 dark:text-amber-400 text-sm tracking-tight">{refundDocNum}</p>
                        <span className="inline-block bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase mt-0.5 border border-amber-500/20">
                          Nota de Crédito
                        </span>
                      </td>

                      <td className="py-4 px-5 align-middle">
                        <span className="font-bold text-[#008bcd]">{refund.treatmentName || "Tratamiento General"}</span>
                      </td>

                      <td className="py-4 px-5 align-middle font-medium text-foreground whitespace-nowrap">
                        {formatPaymentMethod(refund.method)}
                      </td>
                      <td className="py-4 px-5 align-middle">
                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border space-y-1.5 max-w-[420px]">
                          <span className="inline-block bg-sky-500/10 text-[#008bcd] dark:text-[#38bdf8] text-[10px] font-bold px-2 py-0.5 rounded-md border border-sky-500/20">
                            {reasonLabel}
                          </span>
                          {detail && (
                            <p className="text-xs font-medium text-foreground leading-snug break-words">
                              {detail}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5 align-middle text-muted-foreground whitespace-nowrap">
                        {format(new Date(refund.createdAt), "dd MMM yyyy", { locale: es })}
                      </td>

                      <td className="py-4 px-5 align-middle text-right font-black text-amber-600 dark:text-amber-400 text-sm whitespace-nowrap">
                        -${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      {canDeleteRefund && (
                        <td className="py-4 px-5 align-middle text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 border-border/80 rounded-lg cursor-pointer transition-colors"
                              onClick={() => {
                                setRefundToDelete(refund)
                                setDeleteReason("")
                              }}
                              title="Eliminar Nota de Crédito"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* BARRA DE PAGINACIÓN */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 bg-muted/15 border-t border-border text-xs">
            <div className="flex items-center gap-3 text-muted-foreground font-medium">
              <span>
                Mostrando <b className="text-foreground">{(currentPage - 1) * pageSize + 1}</b> a <b className="text-foreground">{Math.min(currentPage * pageSize, totalItems)}</b> de <b className="text-foreground">{totalItems}</b> devoluciones
              </span>

              <div className="hidden sm:flex items-center gap-2 border-l border-border pl-3">
                <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Filas:</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-8 w-18 rounded-lg bg-background text-xs font-bold border-border">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="5" className="text-xs font-semibold">5</SelectItem>
                    <SelectItem value="10" className="text-xs font-semibold">10</SelectItem>
                    <SelectItem value="20" className="text-xs font-semibold">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border bg-background"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border bg-background"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="px-3 py-1 bg-background border border-border rounded-lg font-bold text-foreground text-xs">
                {currentPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border bg-background"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border bg-background"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <AlertDialog open={!!refundToDelete} onOpenChange={(open) => !open && setRefundToDelete(null)}>
        <AlertDialogContent className="bg-card border-border rounded-[24px] sm:max-w-[460px] p-6 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-foreground">
              ¿Eliminar Nota de Crédito?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Esta acción anulará el ajuste de <b className="text-foreground">${Math.abs(Number(refundToDelete?.amount || 0)).toFixed(2)}</b> y se registrará en la auditoría permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 space-y-2">
            <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Motivo de anulación (Obligatorio)
            </Label>
            <Input
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Ej: Error de digitación, monto duplicado..."
              className="h-10 text-xs rounded-xl bg-background border-border"
            />
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl font-bold text-xs h-10 border-border">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting || !deleteReason.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs h-10 px-5 border-none"
            >
              {isDeleting ? "Anulando..." : "Confirmar Anulación"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}