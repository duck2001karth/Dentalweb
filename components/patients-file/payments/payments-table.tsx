"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  MoreHorizontal, Printer, Mail, FileText, 
  RotateCcw, Edit, Trash2, Plus, ExternalLink, Receipt, Eye
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { PaymentReceiptModal } from "./payment-receipt-modal"
import { PaymentBreakdownModal } from "./payment-breakdown-modal"
import { ManagePaymentModal } from "./manage-payment-modal"

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
    case "NEQUI":
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
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<any>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)

  const [selectedPaymentForBreakdown, setSelectedPaymentForBreakdown] = useState<any>(null)
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)
  const [selectedPaymentForManage, setSelectedPaymentForManage] = useState<any>(null)
  const [manageMode, setManageMode] = useState<"edit" | "delete">("edit")
  const [isManageOpen, setIsManageOpen] = useState(false)

  const handlePrintReceipt = (payment: any) => {
    setSelectedPaymentForReceipt(payment)
    setIsReceiptOpen(true)
  }

  const handleOpenBreakdown = (payment: any) => {
    setSelectedPaymentForBreakdown(payment)
    setIsBreakdownOpen(true)
  }

  const handleOpenManage = (payment: any, mode: "edit" | "delete") => {
    setSelectedPaymentForManage(payment)
    setManageMode(mode)
    setIsManageOpen(true)
  }

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
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            Pagos recibidos del paciente
            {isDoctor && (
              <span className="text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                Solo lectura
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

      {/* TABLA DE PAGOS */}
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
              {paymentsList.length > 0 ? (
                paymentsList.map((item: any, idx: number) => {
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
                        <p className="font-bold text-[#008bcd] text-sm">{paymentNum}</p>
                        {item.reference && (
                          <p className="text-xs text-muted-foreground font-normal">Ref: {item.reference}</p>
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
                            <span>{treatmentName || "Extracción / Cirugía"}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <span className="font-medium text-foreground text-sm">{treatmentName || "Extracción / Cirugía"}</span>
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
                          onClick={() => handleOpenBreakdown(item)}
                          className="text-xs font-semibold text-[#008bcd] hover:underline flex items-center justify-end gap-1 ml-auto mt-0.5 cursor-pointer"
                        >
                          <span>Ver desglose</span>
                          <Eye className="w-3 h-3 stroke-[2]" />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 align-middle text-center">
                        <div className="flex items-center justify-center w-full">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 rounded-full hover:bg-muted/80 flex items-center justify-center cursor-pointer"
                                title="Opciones del pago"
                              >
                                <MoreHorizontal className="w-4 h-4 text-foreground/80" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-xl font-sans text-xs p-1 shadow-xl">
                              
                              <DropdownMenuItem onClick={() => handlePrintReceipt(item)} className="cursor-pointer font-medium py-2">
                                <Printer className="w-4 h-4 mr-2 text-[#008bcd]" /> Imprimir comprobante
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => handlePrintReceipt(item)} className="cursor-pointer font-medium py-2">
                                <FileText className="w-4 h-4 mr-2 text-slate-500" /> Imprimir comprobante diario
                              </DropdownMenuItem>

                              <DropdownMenuItem className="cursor-pointer font-medium py-2">
                                <Mail className="w-4 h-4 mr-2 text-slate-500" /> Enviar comprobante
                              </DropdownMenuItem>
                              {canEditPayment && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleOpenManage(item, "edit")} className="cursor-pointer font-medium py-2 text-blue-600 dark:text-blue-400">
                                    <Edit className="w-4 h-4 mr-2" /> Modificar datos
                                  </DropdownMenuItem>
                                </>
                              )}
                              {canDeletePayment && (
                                <>
                                  <DropdownMenuItem className="cursor-pointer font-medium py-2 text-amber-600 dark:text-amber-400">
                                    <RotateCcw className="w-4 h-4 mr-2" /> Nota de crédito
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleOpenManage(item, "delete")} className="cursor-pointer font-medium py-2 text-red-600 dark:text-red-400">
                                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar pago
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>

                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-muted-foreground font-medium text-sm">
                    No hay registros de pagos recibidos para este paciente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
    </div>
  )
}