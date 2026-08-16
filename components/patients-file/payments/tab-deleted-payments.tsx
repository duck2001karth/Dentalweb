"use client"

import React, { useState, useMemo } from "react"
import { 
  Trash2, Calendar, Receipt, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Search, SlidersHorizontal, AlertCircle, ShieldAlert 
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog"

import { ExportDeletedPayments } from "./export-deleted-payments"

const formatPaymentMethod = (method?: string) => {
  if (!method) return "Efectivo"
  const m = method.toUpperCase()
  switch (m) {
    case "CASH": case "EFECTIVO": return "Efectivo"
    case "CREDIT_CARD": case "TARJETA_CREDITO": return "Tarjeta de Crédito"
    case "DEBIT_CARD": case "TARJETA_DEBITO": return "Tarjeta de Débito"
    case "TRANSFER": case "TRANSFERENCIA": case "DEUNA": return "Transferencia Bancaria"
    case "CHECK": case "CHEQUE": return "Cheque"
    default: return method
  }
}

interface DeletedPaymentsTabProps {
  payments: any[]
  patientFullName?: string
  patientDocId?: string
  patientAge?: string | number
  onRefresh?: () => void
}

export function DeletedPaymentsTab({ 
  payments = [], 
  patientFullName = "Paciente Registrado", 
  patientDocId = "No registrado",
  patientAge = "--",
  onRefresh 
}: DeletedPaymentsTabProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const currentUser = session?.user as any
  const canHardDelete = currentUser?.role === "ADMIN"

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null)

  const formatDeletionNote = (notes: string) => {
    if (!notes) return "Sin justificación registrada."
    return notes.replace(/^\[PAGO ELIMINADO\/ANULADO[^\]]*\]:\s*/, "").split(" | Historial previo:")[0].trim()
  }

  const getDeletedBy = (item: any) => {
    if (item.notes && typeof item.notes === "string") {
      const match = item.notes.match(/por ([^\]]+)\]/)
      if (match) return match[1]
    }
    return item.processedBy?.name || item.user?.name || "Administrador"
  }

  const filteredPayments = useMemo(() => {
    if (!searchTerm.trim()) return payments
    const term = searchTerm.toLowerCase()
    return payments.filter((item: any) => {
      const paymentNum = (item.paymentNumber || item.receiptNumber || item.number || `#REC-${item.id?.slice(-6) || ""}`).toLowerCase()
      const methodStr = formatPaymentMethod(item.method || item.paymentMethod).toLowerCase()
      const deletedBy = getDeletedBy(item).toLowerCase()
      const reasonText = formatDeletionNote(item.notes).toLowerCase()
      return paymentNum.includes(term) || methodStr.includes(term) || deletedBy.includes(term) || reasonText.includes(term)
    })
  }, [payments, searchTerm])

  const totalItems = filteredPayments.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredPayments.slice(startIndex, startIndex + pageSize)
  }, [filteredPayments, currentPage, pageSize])

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedData.map((p) => p.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const executeHardDelete = async () => {
    const idsToDelete = singleDeleteId ? [singleDeleteId] : selectedIds
    if (idsToDelete.length === 0) return

    setIsDeleting(true)
    try {
      await Promise.all(
        idsToDelete.map(id => 
          fetch(`/api/payments/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ permanent: true })
          })
        )
      )

      toast({
        title: "Registros purgados",
        description: `Se eliminaron definitivamente ${idsToDelete.length} registro(s).`,
        variant: "success",
      })

      setSelectedIds([])
      setSingleDeleteId(null)
      setShowConfirmDelete(false)

      if (onRefresh) onRefresh()
    } catch (error) {
      toast({ title: "Error", description: "Ocurrió un error al purgar los registros.", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }
  return (
    <div className="space-y-6 font-sans antialiased animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="bg-[#008bcd]/10 p-1.5 rounded-lg border border-[#008bcd]/20"> 
              <ShieldAlert className="w-5 h-5 text-[#008bcd]" />
            </div>
            Pagos Anulados y Auditoría
            <span className="text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              {payments.length} {payments.length === 1 ? "registro" : "registros"}
            </span>
          </h2>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            Historial inalterable de auditoría con la justificación obligatoria ingresada por caja.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar anulación..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 bg-background border-border text-xs font-medium h-10 rounded-xl"
            />
          </div>

          <ExportDeletedPayments 
            data={filteredPayments} 
            patientFullName={patientFullName}
            patientDocId={patientDocId}
            patientAge={patientAge}
            issuedBy={currentUser?.name || "Administrador"}
          />

          {canHardDelete && selectedIds.length > 0 && (
            <Button
              onClick={() => setShowConfirmDelete(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 px-4 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Purgar ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      {/*TABLA DE AUDITORÍA */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
              <tr>
                {canHardDelete && (
                  <th className="py-4 px-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-border text-rose-600 focus:ring-rose-600 cursor-pointer accent-rose-600"
                      checked={selectedIds.length === paginatedData.length && paginatedData.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="py-4 px-4"># Pago</th>
                <th className="py-4 px-4">Tipo / Medio</th>
                <th className="py-4 px-4"># Documento</th>
                <th className="py-4 px-4">Fecha Anulación</th>
                <th className="py-4 px-4">Eliminado por</th>
                <th className="py-4 px-4">Comentario / Motivo</th>
                <th className="py-4 px-4 text-right">Monto</th>
                {canHardDelete && <th className="py-4 px-4 text-right">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={canHardDelete ? 9 : 8} className="py-14 text-center text-muted-foreground font-medium">
                    No existen registros de auditoría o pagos eliminados para este paciente.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: any, idx: number) => {
                  const paymentNum = item.paymentNumber || item.receiptNumber || item.number || `#REC-${item.id?.slice(-6) || idx + 1}`
                  const methodStr = formatPaymentMethod(item.method || item.paymentMethod)
                  const docStr = item.invoiceNumber || item.receiptNumberFiscal || "-"
                  const deletedDate = item.updatedAt ? new Date(item.updatedAt) : new Date(item.createdAt)
                  const deletedBy = getDeletedBy(item)
                  const reasonText = formatDeletionNote(item.notes)
                  const rawAmount = Math.abs(Number(item.amount || item.paidAmount || 0))
                  const isSelected = selectedIds.includes(item.id)

                  return (
                    <tr key={item.id || idx} className={`transition-colors group ${isSelected ? 'bg-rose-500/5' : 'hover:bg-muted/15'}`}>
                      {canHardDelete && (
                        <td className="py-4 px-4 text-center align-middle">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-border text-rose-600 focus:ring-rose-600 cursor-pointer accent-rose-600"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(item.id)}
                          />
                        </td>
                      )}

                      <td className="py-4 px-4 align-middle">
                        <p className="font-bold text-[#008bcd] text-sm tracking-tight">{paymentNum}</p>
                      </td>

                      <td className="py-4 px-4 align-middle font-semibold text-foreground">
                        {methodStr}
                      </td>

                      <td className="py-4 px-4 align-middle">
                        {docStr !== "-" ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                            <Receipt className="w-3 h-3" /> {docStr}
                          </span>
                        ) : <span className="text-muted-foreground/70 font-medium">-</span>}
                      </td>

                      <td className="py-4 px-4 align-middle font-medium text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{format(deletedDate, "dd MMM yyyy • HH:mm", { locale: es })}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0 border border-border">
                            {deletedBy.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-foreground text-xs">{deletedBy}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-middle max-w-[200px]">
                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border text-foreground font-medium text-xs leading-snug">
                          <p className="line-clamp-2" title={reasonText}>{reasonText}</p>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-middle text-right whitespace-nowrap">
                        <p className="font-black text-foreground text-sm tracking-tight">
                          ${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                        <span className="inline-block text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider mt-0.5">
                          Anulado
                        </span>
                      </td>

                      {canHardDelete && (
                        <td className="py-4 px-4 align-middle text-right">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSingleDeleteId(item.id)
                              setShowConfirmDelete(true)
                            }}
                            className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 border-border/80 rounded-lg cursor-pointer transition-colors"
                            title="Borrar permanentemente de BD"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 bg-muted/15 border-t border-border text-xs">
            <div className="flex items-center gap-3 text-muted-foreground font-medium">
              <span>
                Mostrando <b className="text-foreground">{(currentPage - 1) * pageSize + 1}</b> a <b className="text-foreground">{Math.min(currentPage * pageSize, totalItems)}</b> de <b className="text-foreground">{totalItems}</b> registros
              </span>
              <div className="hidden sm:flex items-center gap-2 border-l border-border pl-3">
                <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Filas:</span>
                <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
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
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border bg-background" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border bg-background" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 bg-background border border-border rounded-lg font-bold text-foreground text-xs">
                {currentPage} / {totalPages}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border bg-background" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border bg-background" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CONFIRMACIÓN */}
      <AlertDialog open={showConfirmDelete} onOpenChange={(open) => {
        if (!open) {
          setShowConfirmDelete(false)
          setSingleDeleteId(null)
        }
      }}>
        <AlertDialogContent className="bg-card border-border rounded-[24px] sm:max-w-[450px] shadow-2xl p-6">
          <AlertDialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-foreground">
              {singleDeleteId ? "¿Purgar este registro?" : `¿Purgar ${selectedIds.length} registros?`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Esta acción es un <b className="text-foreground">borrado definitivo</b>. Los registros seleccionados serán eliminados permanentemente de la base de datos y de la auditoría.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl font-bold text-xs h-10 border-border" disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); executeHardDelete(); }}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs h-10 px-5 border-none"
            >
              {isDeleting ? "Purgando..." : "Sí, Eliminar Definitivo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}