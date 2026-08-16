"use client"

import React, { useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Plus, ExternalLink, Receipt, Eye, 
  ChevronLeft, ChevronRight 
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
      return "Transferencia Bancaria"
    case "CHECK":
    case "CHEQUE":
      return "Cheque"
    default:
      return method
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
  const isDoctor = userRole === "DOCTOR"
  const [isElectronicDocOpen, setIsElectronicDocOpen] = useState(false)
  const canCreateDocument = isAdmin || isRecepcion
  const canEditPayment = isAdmin || isRecepcion
  const canDeletePayment = isAdmin || isRecepcion

  const onlyActiveIncomePayments = useMemo(() => {
    return paymentsList.filter((item: any) => {
      const isDeleted = item.notes && typeof item.notes === "string" && item.notes.includes("[PAGO ELIMINADO")
      if (isDeleted) return false
      const amount = Number(item.amount || item.paidAmount || 0)
      const isCreditNote = amount < 0 || (item.notes && typeof item.notes === "string" && item.notes.startsWith("NOTA DE CRÉDITO"))
      return !isCreditNote
    })
  }, [paymentsList])

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

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
    <div className="space-y-4 font-sans antialiased">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border/80 shadow-xs w-full">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Pagos recibidos del paciente
          </h2>
          <p className="text-xs text-muted-foreground font-normal mt-0.5">
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
      {/* TABLA */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 border-b border-border/80 text-muted-foreground uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold"># Pago</th>
                <th className="py-3.5 px-4 font-bold"># Tratamiento</th>
                <th className="py-3.5 px-4 font-bold">Medio de pago</th>
                <th className="py-3.5 px-4 font-bold"># Boleta / Factura</th>
                <th className="py-3.5 px-4 font-bold">Recepción</th>
                <th className="py-3.5 px-4 font-bold">Vencimiento</th>
                <th className="py-3.5 px-4 text-right font-bold">Monto</th>
                <th className="py-3.5 px-4 text-center font-bold">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 text-sm font-normal">
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((item: any, idx: number) => {
                  const paymentNum = item.paymentNumber || item.receiptNumber || item.number || `#REC-${item.id?.slice(-6) || idx + 1}`
                  const treatmentName = item.treatmentPlan?.name || item.treatmentName
                  const targetPlanId = item.treatmentPlanId || item.treatmentPlan?.id || item.planId
                  const isPlanDeleted = !treatmentName && !targetPlanId

                  const methodSpanish = formatPaymentMethod(item.method || item.paymentMethod)
                  const receiverStr = formatReceiverName(item.processedBy || item.user)
                  const rawAmount = Number(item.amount || item.paidAmount || 0)
                  const invoiceStr = item.invoiceNumber || item.receiptNumberFiscal || null

                  const receiptDateStr = item.createdAt || item.receiptDate || new Date()
                  const dueDateStr = item.dueDate || item.createdAt || new Date()

                  return (
                    <tr key={item.id || idx} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 align-middle">
                        <p className="font-bold text-[#008bcd] text-sm leading-none">
                          {paymentNum}
                        </p>
                        {item.reference && (
                          <p className="text-xs text-muted-foreground font-normal mt-1">
                            Ref: {item.reference}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-middle">
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

                      <td className="py-3.5 px-4 align-middle space-y-0.5">
                        <p className="font-semibold text-foreground text-sm">{methodSpanish}</p>
                        <p className="text-xs text-muted-foreground font-normal">
                          Recibido por <b className="text-foreground/90 font-medium">{receiverStr}</b>
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        {invoiceStr ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                            <Receipt className="w-3 h-3" /> {invoiceStr}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-normal italic">
                            Sin comprobante fiscal
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-middle text-sm font-normal text-foreground">
                        {format(new Date(receiptDateStr), "dd MMM yyyy", { locale: es })}
                      </td>

                      <td className="py-3.5 px-4 align-middle text-sm font-normal text-foreground">
                        {format(new Date(dueDateStr), "dd MMM yyyy", { locale: es })}
                      </td>

                      <td className="py-3.5 px-4 align-middle text-right">
                        <p className="font-bold text-foreground text-sm tracking-tight">
                          ${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPaymentForBreakdown(item)
                            setIsBreakdownOpen(true)
                          }}
                          className="text-xs font-semibold text-[#008bcd] hover:underline flex items-center justify-end gap-1 ml-auto mt-0.5 cursor-pointer"
                        >
                          <span>Ver desglose</span>
                          <Eye className="w-3 h-3 stroke-[2]" />
                        </button>
                      </td>

                      <td className="py-3.5 px-4 align-middle text-center">
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
                  <td colSpan={8} className="py-12 text-center text-muted-foreground font-medium text-sm">
                    No hay registros de pagos activos para este paciente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
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

      {/* MODALES */}
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