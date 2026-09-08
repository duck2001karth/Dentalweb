"use client"

import React, { useState, useMemo } from "react"
import { 
  Receipt, CheckCircle2, XCircle, Clock, Trash2, 
  Ban, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  SlidersHorizontal, AlertCircle, FileText, Printer, Eye 
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog"

import { ExportIssuedDocuments } from "./export-issued-documents"

const formatSriStatus = (status?: string, isAuthorized?: boolean) => {
  if (isAuthorized) return "AUTORIZADO"
  if (!status) return "PENDIENTE"
  
  const s = status.toUpperCase()
  switch (s) {
    case "AUTHORIZED": case "AUTORIZADO": return "AUTORIZADO"
    case "VOIDED": case "CANCELLED": case "CANCELED": case "ANULADO": return "ANULADO"
    case "REJECTED": case "DEVUELTA": case "RECHAZADO": return "RECHAZADO"
    case "PENDING": case "PENDIENTE": case "EN PROCESO": return "PENDIENTE"
    default: return s
  }
}

interface IssuedDocumentsViewProps {
  documents: any[]
  patient?: any
  patientFullName?: string
  patientDocId?: string
  patientAge?: string | number
  onRefresh?: () => void
}

export function IssuedDocumentsView({
  documents = [],
  patient,
  patientFullName,
  patientDocId,
  patientAge,
  onRefresh,
}: IssuedDocumentsViewProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const currentUser = session?.user as any
  const userRole = currentUser?.role || "DOCTOR"
  const canHardDelete = userRole === "ADMIN"
  const canCancelDoc = userRole === "ADMIN" || userRole === "RECEPTIONIST"

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [docToCancel, setDocToCancel] = useState<any | null>(null)
  const [docToDelete, setDocToDelete] = useState<any | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const resolvedFullName = patientFullName || (patient?.firstName ? `${patient.firstName} ${patient.lastName || ''}`.trim() : "Paciente Registrado")
  const resolvedDocId = patientDocId || patient?.ci || "No registrado"
  const resolvedAge = patientAge || (patient?.birthDate ? new Date().getFullYear() - new Date(patient.birthDate).getFullYear() : "--")

  const totalItems = documents.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1

  const paginatedDocs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return documents.slice(startIndex, startIndex + pageSize)
  }, [documents, currentPage, pageSize])
  const handleViewInvoicePDF = (doc: any) => {
    const targetId = doc.paymentId || doc.id
    window.open(`/comprobantes/${targetId}`, "_blank")
  }
  const handleCancelInvoice = async () => {
    if (!docToCancel) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/sri/invoices/${docToCancel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ANULADO" }),
      })
      if (!res.ok) throw new Error()

      toast({ variant: "success", title: "Comprobante Anulado", description: "El documento ha sido marcado como ANULADO." })
      setDocToCancel(null)
      if (onRefresh) onRefresh()
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo anular el comprobante." })
    } finally {
      setIsProcessing(false)
    }
  }
  const handlePermanentDelete = async () => {
    if (!docToDelete) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/sri/invoices/${docToDelete.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()

      toast({ variant: "success", title: "Documento eliminado", description: "Comprobante purgado de la base de datos." })
      setDocToDelete(null)
      if (onRefresh) onRefresh()
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el documento." })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6 font-sans antialiased animate-in fade-in duration-200">
      
      {/* CABECERA (Visible para Doctor, Recepción y Admin) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <div className="bg-[#008bcd]/10 p-1.5 rounded-lg border border-[#008bcd]/20">
              <Receipt className="w-5 h-5 text-[#008bcd]" />
            </div>
            Comprobantes y Facturas Electrónicas (SRI)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Historial de documentos tributarios registrados y autorizados ante el SRI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportIssuedDocuments
            data={documents}
            patientFullName={resolvedFullName}
            patientDocId={resolvedDocId}
            patientAge={resolvedAge}
            issuedBy={currentUser?.name || "Administrador"}
          />
        </div>
      </div>

      {/* TABLA DE COMPROBANTES */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-4 px-5">Tipo & N° Factura</th>
                <th className="py-4 px-5">Receptor</th>
                <th className="py-4 px-5">Autorización SRI / Clave</th>
                <th className="py-4 px-5">Fecha Emisión</th>
                <th className="py-4 px-5 text-center">Estado SRI</th>
                <th className="py-4 px-5 text-right">Total Factura</th>
                <th className="py-4 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-muted-foreground font-medium">
                    No se han emitido facturas o notas tributarias para este paciente.
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc, idx) => {
                  const docNum = doc.invoiceNumber || doc.number || doc.secuencial || `#FAC-${doc.id?.slice(-6) || idx + 1}`
                  const docType = doc.documentType || "FACTURA ELECTRÓNICA (01)"
                  const authKey = doc.accessKey || doc.authorizationNumber || "Sin clave registrada"
                  const emissionDate = doc.emissionDate || doc.createdAt ? new Date(doc.emissionDate || doc.createdAt) : new Date()
                  
                  const statusStr = formatSriStatus(doc.status, doc.isAuthorized)
                  const isAuthorized = statusStr === "AUTORIZADO"
                  const isAnulado = statusStr === "ANULADO"
                  const totalAmount = Math.abs(Number(doc.totalAmount || doc.amount || doc.total || 0))

                  return (
                    <tr key={doc.id || idx} className="hover:bg-muted/15 transition-colors">
                      <td className="py-4 px-5 align-middle whitespace-nowrap">
                        <p className="font-bold text-[#008bcd] text-sm tracking-tight">{docNum}</p>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">{docType}</span>
                      </td>

                      <td className="py-4 px-5 align-middle whitespace-nowrap">
                        <p className="font-bold text-foreground">{resolvedFullName}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">CI/RUC: {resolvedDocId}</p>
                      </td>

                      <td className="py-4 px-5 align-middle font-mono text-[11px] text-muted-foreground max-w-[170px] truncate" title={authKey}>
                        {authKey}
                      </td>

                      <td className="py-4 px-5 align-middle text-muted-foreground whitespace-nowrap">
                        <p className="font-medium text-foreground">{format(emissionDate, "dd MMM yyyy", { locale: es })}</p>
                        <p className="text-[10px]">Por: {doc.issuedBy || "Recepción"}</p>
                      </td>

                      <td className="py-4 px-5 align-middle text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isAuthorized 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                            : isAnulado 
                            ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}>
                          {isAuthorized ? <CheckCircle2 className="w-3 h-3" /> : isAnulado ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {statusStr}
                        </span>
                      </td>

                      <td className="py-4 px-5 align-middle text-right font-black text-foreground text-sm whitespace-nowrap">
                        ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-4 px-5 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleViewInvoicePDF(doc)}
                            className="h-8 w-8 text-[#008bcd] hover:bg-[#008bcd]/10 hover:text-[#0074a6] border-border/80 rounded-lg cursor-pointer transition-colors"
                            title="Ver e Imprimir Factura Electrónica (PDF)"
                          >
                            <FileText size={13} />
                          </Button>
                          {canCancelDoc && !isAnulado && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setDocToCancel(doc)}
                              className="h-8 w-8 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 border-border/80 rounded-lg cursor-pointer transition-colors"
                              title="Anular comprobante ante el SRI"
                            >
                              <Ban size={13} />
                            </Button>
                          )}
                          {canHardDelete && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setDocToDelete(doc)}
                              className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 border-border/80 rounded-lg cursor-pointer transition-colors"
                              title="Eliminar permanentemente de la BD"
                            >
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </div>
                      </td>
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
              <span>Mostrando <b className="text-foreground">{(currentPage - 1) * pageSize + 1}</b> a <b className="text-foreground">{Math.min(currentPage * pageSize, totalItems)}</b> de <b className="text-foreground">{totalItems}</b> comprobantes</span>
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

      {/* MODAL ANULAR */}
      <AlertDialog open={!!docToCancel} onOpenChange={(open) => !open && setDocToCancel(null)}>
        <AlertDialogContent className="bg-card border-border rounded-[24px] sm:max-w-[450px] p-6 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <Ban className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-foreground">¿Anular Comprobante Tributario?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              El comprobante quedará marcado como <b className="text-foreground">ANULADO</b> para auditoría contable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl font-bold text-xs h-10 border-border" disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInvoice} disabled={isProcessing} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs h-10 px-5">
              {isProcessing ? "Anulando..." : "Confirmar Anulación"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL PURGAR */}
      <AlertDialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <AlertDialogContent className="bg-card border-border rounded-[24px] sm:max-w-[450px] p-6 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-foreground">¿Eliminar Comprobante Definitivamente?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Esta acción purgará físicamente el registro de la base de datos. <b className="text-foreground">No se puede deshacer</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl font-bold text-xs h-10 border-border" disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} disabled={isProcessing} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs h-10 px-5 border-none">
              {isProcessing ? "Eliminando..." : "Eliminar Definitivo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}