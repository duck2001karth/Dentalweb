"use client"

import React, { useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Plus, ExternalLink, Receipt, Eye, 
  ChevronLeft, ChevronRight, WalletCards 
} from "lucide-react"

import { Button } from "@/components/ui/button"

import { PaymentActionsMenu } from "./payment-actions-menu"
import { PaymentReceiptModal } from "./payment-receipt-modal"
import { PaymentBreakdownModal } from "./payment-breakdown-modal"
import { ManagePaymentModal } from "./modify-payment-modal"
import { SendEmailModal } from "./send-email-modal"
import { CreditNoteModal } from "./credit-note-modal"
import { DailyReceiptModal } from "./daily-receipt-modal"
import { NewElectronicDocModal } from "./new-electronic-doc-modal"

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

const formatReceiverName = (user?: any) => {
  if (!user) return "Administrador"
  const role = (user.role || "").toUpperCase()
  if (role === "ADMIN" || role === "RECEPTIONIST" || role === "RECEPCION") return "Administrador"
  const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Dr. Especialista"
  const spec = user.specialty ? ` — ${user.specialty}` : ""
  return `Dr. ${name}${spec}`
}

export function PaymentsTable({ 
  paymentsList = [], 
  patient, 
  onRefresh,
  onOpenNewElectronicDoc 
}: any) {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || "DOCTOR"
  const isAdmin = userRole === "ADMIN"
  const isRecepcion = userRole === "RECEPTIONIST" || userRole === "RECEPCION"
  
  const canEditPayment = isAdmin || isRecepcion
  const canDeletePayment = isAdmin || isRecepcion

  const [isElectronicDocOpen, setIsElectronicDocOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const onlyActiveIncomePayments = useMemo(() => {
    return paymentsList.filter((item: any) => {
      const isDeleted = item.notes && typeof item.notes === "string" && item.notes.includes("[PAGO ELIMINADO")
      if (isDeleted) return false
      const amount = Number(item.amount || item.paidAmount || 0)
      const isCreditNote = amount < 0 || (item.notes && typeof item.notes === "string" && item.notes.startsWith("NOTA DE CRÉDITO"))
      return !isCreditNote
    })
  }, [paymentsList])

  const totalPages = Math.ceil(onlyActiveIncomePayments.length / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, onlyActiveIncomePayments.length)

  const paginatedPayments = useMemo(() => {
    return onlyActiveIncomePayments.slice(startIndex, endIndex)
  }, [onlyActiveIncomePayments, startIndex, endIndex])

  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<any>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [selectedPaymentForBreakdown, setSelectedPaymentForBreakdown] = useState<any>(null)
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)
  const [selectedPaymentForManage, setSelectedPaymentForManage] = useState<any>(null)
  const [manageMode, setManageMode] = useState<"edit" | "delete">("edit")
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [selectedPaymentForEmail, setSelectedPaymentForEmail] = useState<any>(null)
  const [isEmailOpen, setIsEmailOpen] = useState(false)
  const [selectedPaymentForCreditNote, setSelectedPaymentForCreditNote] = useState<any>(null)
  const [isCreditNoteOpen, setIsCreditNoteOpen] = useState(false)
  const [selectedPaymentForDaily, setSelectedPaymentForDaily] = useState<any>(null)
  const [isDailyOpen, setIsDailyOpen] = useState(false)

  const navigateToTreatment = (e: React.MouseEvent, targetPlanId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    const activePatientId = patient?.id || (paymentsList.length > 0 ? paymentsList[0]?.patientId : null)

    if (activePatientId && targetPlanId) {
      router.push(`/paciente/${activePatientId}?tab=planes&planId=${targetPlanId}`)
    } else if (activePatientId) {
      router.push(`/paciente/${activePatientId}?tab=planes`)
    }
  }

  return (
    <div className="space-y-4 font-sans antialiased animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border/80 shadow-xs w-full">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <div className="bg-[#008bcd]/10 p-1.5 rounded-lg border border-[#008bcd]/20">
              <WalletCards className="w-5 h-5 text-[#008bcd]" />
            </div>
            Pagos recibidos del paciente
          </h2>
          <p className="text-xs text-muted-foreground font-normal mt-1">
            Historial de transacciones, boletas y comprobantes registrados.
          </p>
        </div>

        <Button 
          type="button"
          onClick={() => setIsElectronicDocOpen(true)}
          className="bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold text-xs rounded-xl h-10 px-4 shadow-sm flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nuevo documento electrónico
        </Button>
      </div>
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 border-b border-border/80 text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-4 px-5"># Pago</th>
                <th className="py-4 px-5"># Tratamiento</th>
                <th className="py-4 px-5">Medio de pago</th>
                <th className="py-4 px-5 min-w-[160px]"># Boleta / Factura</th>
                <th className="py-4 px-5">Recepción</th>
                <th className="py-4 px-5">Vencimiento</th>
                <th className="py-4 px-5 text-right">Monto</th>
                <th className="py-4 px-5 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 text-sm font-normal">
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((item: any, idx: number) => {
                  const rawNumber = String(item.paymentNumber || item.receiptNumber || item.number || "")
                  const isSriFormat = rawNumber.includes("-") && !rawNumber.toUpperCase().includes("REC")
                  const invoiceStr = 
                    item.invoiceNumber || 
                    item.taxDocuments?.[0]?.secuencial || 
                    item.taxDocuments?.[0]?.authorizationNum ||
                    item.sriDocument?.number || 
                    item.sriDocument?.secuencial ||
                    item.invoiceId || 
                    item.receiptNumberFiscal || 
                    (isSriFormat ? rawNumber : null) || 
                    (item.isFiscal ? "Factura Emitida" : null)

                  let displayPaymentNum = `#REC-${item.id?.slice(-6)?.toUpperCase() || idx + 1}`
                  if (!isSriFormat && rawNumber) {
                    displayPaymentNum = rawNumber.toUpperCase().startsWith("REC") || rawNumber.startsWith("#") 
                      ? rawNumber 
                      : `#REC-${rawNumber}`
                  }
                  
                  const treatmentName = item.treatmentPlan?.name || item.treatmentName
                  const targetPlanId = item.treatmentPlanId || item.treatmentPlan?.id || item.planId
                  const isPlanDeleted = !treatmentName && !targetPlanId
                  const methodSpanish = formatPaymentMethod(item.method || item.paymentMethod)
                  const receiverStr = formatReceiverName(item.processedBy || item.user)
                  const rawAmount = Number(item.amount || item.paidAmount || 0)
                  const receiptDateStr = item.createdAt || item.receiptDate || new Date()
                  const dueDateStr = item.dueDate || item.createdAt || new Date()

                  return (
                    <tr key={item.id || idx} className="hover:bg-muted/20 transition-colors">
                      {/* COLUMNA PAGO INTERNO */}
                      <td className="py-4 px-5 align-middle whitespace-nowrap">
                        <p className="font-bold text-[#008bcd] text-sm tracking-tight">{displayPaymentNum}</p>
                        {invoiceStr && (
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Ref: SRI Autorizado
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 align-middle">
                        {isPlanDeleted ? (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 italic">
                            Plan eliminado
                          </span>
                        ) : targetPlanId ? (
                          <button
                            type="button"
                            onClick={(e) => navigateToTreatment(e, targetPlanId)}
                            className="font-semibold text-[#008bcd] hover:text-[#0070a8] text-sm hover:underline cursor-pointer flex items-center gap-1.5 text-left group"
                          >
                            <span>{treatmentName || "Rehabilitación Oral"}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <span className="font-medium text-foreground text-sm">{treatmentName || "Rehabilitación Oral"}</span>
                        )}
                      </td>
                      <td className="py-4 px-5 align-middle space-y-0.5 whitespace-nowrap">
                        <p className="font-semibold text-foreground text-sm">{methodSpanish}</p>
                        <p className="text-[11px] text-muted-foreground font-normal">
                          Por: <b className="text-foreground/90 font-medium">{receiverStr}</b>
                        </p>
                      </td>
                      <td className="py-4 px-5 align-middle">
                        {invoiceStr ? (
                          <button
                            type="button"
                            onClick={() => window.open(`/comprobantes/${item.id}`, "_blank")}
                            className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer shadow-sm"
                            title="Ver Factura Electrónica (PDF)"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>{invoiceStr}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-muted-foreground/70 italic bg-muted/50 px-2.5 py-1 rounded-md border border-border">
                            Sin comprobante fiscal
                          </span>
                        )}
                      </td>

                      {/* FECHAS */}
                      <td className="py-4 px-5 align-middle text-sm font-medium text-muted-foreground whitespace-nowrap">
                        {format(new Date(receiptDateStr), "dd MMM yyyy", { locale: es })}
                      </td>
                      <td className="py-4 px-5 align-middle text-sm font-medium text-muted-foreground whitespace-nowrap">
                        {format(new Date(dueDateStr), "dd MMM yyyy", { locale: es })}
                      </td>

                      {/* MONTO */}
                      <td className="py-4 px-5 align-middle text-right whitespace-nowrap">
                        <p className="font-black text-foreground text-[15px] tracking-tight">
                          ${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPaymentForBreakdown(item)
                            setIsBreakdownOpen(true)
                          }}
                          className="text-[10px] font-bold text-[#008bcd] hover:underline flex items-center justify-end gap-1 ml-auto mt-0.5 cursor-pointer uppercase tracking-wider"
                        >
                          <span>Ver detalle</span>
                          <Eye className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </td>

                      {/* ACCIONES */}
                      <td className="py-4 px-5 align-middle text-center">
                        <div className="flex items-center justify-center w-full">
                          <PaymentActionsMenu
                            payment={item}
                            canEdit={canEditPayment}
                            canDelete={canDeletePayment}
                            onPrintReceipt={(p) => {
                              setSelectedPaymentForReceipt(p)
                              setIsReceiptOpen(true)
                            }}
                            onPrintDaily={(p) => {
                              setSelectedPaymentForDaily(p)
                              setIsDailyOpen(true)
                            }}
                            onSendEmail={(p) => {
                              setSelectedPaymentForEmail(p)
                              setIsEmailOpen(true)
                            }}
                            onEdit={(p) => {
                              setSelectedPaymentForManage(p)
                              setManageMode("edit")
                              setIsManageOpen(true)
                            }}
                            onCreditNote={(p) => {
                              setSelectedPaymentForCreditNote(p)
                              setIsCreditNoteOpen(true)
                            }}
                            onDelete={(p) => {
                              setSelectedPaymentForManage(p)
                              setManageMode("delete")
                              setIsManageOpen(true)
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 px-5 text-center text-muted-foreground">
                    No hay pagos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {onlyActiveIncomePayments.length > 0 && (
          <div className="px-5 py-3.5 border-t border-border/80 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-muted-foreground font-medium">
              Mostrando <span className="font-bold text-foreground">{startIndex + 1}</span> a{" "}
              <span className="font-bold text-foreground">{endIndex}</span> de{" "}
              <span className="font-bold text-foreground">{onlyActiveIncomePayments.length}</span> pagos
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 rounded-lg border-border/80 text-xs font-semibold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? "bg-[#008bcd] text-white shadow-xs"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 rounded-lg border-border/80 text-xs font-semibold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Modales */}
      {selectedPaymentForReceipt && (
        <PaymentReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          payment={selectedPaymentForReceipt}
          patient={patient}
        />
      )}

      {selectedPaymentForBreakdown && (
        <PaymentBreakdownModal
          isOpen={isBreakdownOpen}
          onClose={() => setIsBreakdownOpen(false)}
          payment={selectedPaymentForBreakdown}
          patient={patient}
        />
      )}

      {selectedPaymentForManage && (
        <ManagePaymentModal
          isOpen={isManageOpen}
          onClose={() => setIsManageOpen(false)}
          payment={selectedPaymentForManage}
          mode={manageMode}
          onSuccess={onRefresh}
        />
      )}

      {selectedPaymentForEmail && (
        <SendEmailModal
          isOpen={isEmailOpen}
          onClose={() => setIsEmailOpen(false)}
          payment={selectedPaymentForEmail}
          patient={patient}
        />
      )}

      {selectedPaymentForCreditNote && (
        <CreditNoteModal
          isOpen={isCreditNoteOpen}
          onClose={() => setIsCreditNoteOpen(false)}
          payment={selectedPaymentForCreditNote}
          onSuccess={onRefresh}
        />
      )}

      {selectedPaymentForDaily && (
        <DailyReceiptModal
          isOpen={isDailyOpen}
          onClose={() => setIsDailyOpen(false)}
          payment={selectedPaymentForDaily}
          patient={patient}
          allPaymentsOfDay={onlyActiveIncomePayments}
        />
      )}

      <NewElectronicDocModal
        isOpen={isElectronicDocOpen}
        onClose={() => setIsElectronicDocOpen(false)}
        patient={patient}
        paymentsList={paymentsList}
        onSuccess={onRefresh}
      />
    </div>
  )
}