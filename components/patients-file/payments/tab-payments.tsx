"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Plus, ExternalLink, Receipt, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"

import { PaymentActionsMenu } from "./payment-actions-menu"
import { PaymentReceiptModal } from "./payment-receipt-modal"
import { PaymentBreakdownModal } from "./payment-breakdown-modal"
import { ManagePaymentModal } from "./modify-payment-modal"
import { SendEmailModal } from "./send-email-modal"
import { CreditNoteModal } from "./credit-note-modal"
import { DailyReceiptModal } from "./daily-receipt-modal"

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

export function PaymentsTable({ paymentsList = [], patient, onRefresh }: any) {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || "DOCTOR"
  const isAdmin = userRole === "ADMIN"
  const isRecepcion = userRole === "RECEPTIONIST" || userRole === "RECEPCION"
  const isDoctor = userRole === "DOCTOR"

  const canCreateDocument = isAdmin || isRecepcion
  const canEditPayment = isAdmin || isRecepcion
  const canDeletePayment = isAdmin || isRecepcion

  const activePayments = paymentsList.filter((item: any) => {
    const isDeleted = item.notes && typeof item.notes === "string" && item.notes.includes("[PAGO ELIMINADO")
    return !isDeleted
  })

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
    <div className="space-y-5 font-sans antialiased">
      {/* CABECERA DE SECCIÓN */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            Pagos recibidos del paciente
            {isDoctor && (
              <span className="text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                Vista de Doctor (Solo Lectura)
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground font-normal mt-0.5">
            Historial de transacciones, boletas y comprobantes registrados.
          </p>
        </div>

        {canCreateDocument && (
          <Button className="bg-[#008bcd] hover:bg-[#0073a8] text-white font-semibold text-xs rounded-xl h-10 px-4 shadow-xs flex items-center gap-2 cursor-pointer transition-all">
            <Plus className="w-4 h-4 stroke-[2]" />
            Nuevo documento electrónico
          </Button>
        )}
      </div>

      {/* TABLA DE TRANSACCIONES */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 border-b border-border/80 text-muted-foreground uppercase font-bold text-xs tracking-wider">
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
              {activePayments.length > 0 ? (
                activePayments.map((item: any, idx: number) => {
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
                      {/* # PAGO */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex flex-col items-start gap-1">
                          <p className="font-bold text-[#008bcd] text-sm leading-none">
                            {paymentNum}
                          </p>
                          {rawAmount < 0 && (
                            <span className="inline-block text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                              Nota de Crédito
                            </span>
                          )}
                          {item.notes && typeof item.notes === "string" && item.notes.startsWith("NOTA DE CRÉDITO") ? (
                            <p 
                              className="text-[11px] text-amber-600/90 dark:text-amber-400/90 font-medium truncate max-w-[180px] mt-0.5" 
                              title={item.notes}
                            >
                              {item.notes.replace(/^NOTA DE CRÉDITO \[[^\]]+\]:\s*/, "")}
                            </p>
                          ) : item.reference ? (
                            <p className="text-xs text-muted-foreground font-normal">
                              Ref: {item.reference}
                            </p>
                          ) : null}
                        </div>
                      </td>

                      {/* # TRATAMIENTO */}
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
                            <span>{treatmentName || "Extracción / Cirugía"}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <span className="font-medium text-foreground text-sm">{treatmentName || "Extracción / Cirugía"}</span>
                        )}
                      </td>

                      {/* MEDIO DE PAGO */}
                      <td className="py-3.5 px-4 align-middle space-y-0.5">
                        <p className="font-semibold text-foreground text-sm">{methodSpanish}</p>
                        <p className="text-xs text-muted-foreground font-normal">
                          Recibido por <b className="text-foreground/90 font-medium">{receiverStr}</b>
                        </p>
                      </td>

                      {/* # BOLETA / FACTURA */}
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

                      {/* RECEPCIÓN */}
                      <td className="py-3.5 px-4 align-middle text-sm font-normal text-foreground">
                        {format(new Date(receiptDateStr), "dd MMM yyyy", { locale: es })}
                      </td>

                      {/* VENCIMIENTO */}
                      <td className="py-3.5 px-4 align-middle text-sm font-normal text-foreground">
                        {format(new Date(dueDateStr), "dd MMM yyyy", { locale: es })}
                      </td>

                      {/* MONTO Y DESGLOSE */}
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

                      {/* 📍 ACCIONES CON EL NUEVO COMPONENTE EXTRAÍDO */}
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
                  <td colSpan={8} className="py-14 text-center text-muted-foreground font-medium text-sm">
                    No hay registros de pagos activos para este paciente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
          allPaymentsOfDay={activePayments}
        />
      )}
    </div>
  )
}