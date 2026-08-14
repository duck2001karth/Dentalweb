"use client"

import React, { useState, useEffect } from "react"
import { Loader2, Receipt } from "lucide-react"
import { PaymentsTable } from "@/components/patients-file/payments/tab-payments"
import { DeletedPaymentsTable } from "@/components/patients-file/payments/tab-deleted-payments"
import { RefundsView } from "@/components/patients-file/payments/tab-refunds"
import { FinancialBalanceView } from "@/components/patients-file/payments/tab-balance"

interface PayBillingLayoutProps {
  patientId: string
  patient: any
  plans?: any[]
  onRefreshData?: () => void
}

export function PayBillingLayout({ patientId, patient, plans = [], onRefreshData }: PayBillingLayoutProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>("pagos")
  const [paymentsList, setPaymentsList] = useState<any[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState<boolean>(false)

  const fetchPayments = async () => {
    if (!patientId) return
    setIsLoadingPayments(true)
    try {
      const res = await fetch(`/api/payments?patientId=${patientId}`)
      if (res.ok) {
        const data = await res.json()
        const rawPayments = Array.isArray(data) ? data : (data.payments || data.data || [])
        
        const formatted = rawPayments.map((p: any, idx: number) => ({
          ...p,
          id: p.id,
          paymentNumber: p.receiptNumber || p.number || `#REC-${p.id?.slice(-6) || idx + 1}`,
          treatmentName: p.treatmentPlan?.name || "Tratamiento Odontológico",
          treatmentPlanId: p.treatmentPlanId || p.treatmentPlan?.id || null,
          method: p.method || p.paymentMethod || "CASH",
          user: p.processedBy || p.user || null,
          invoiceNumber: p.invoiceNumber || p.receiptNumberFiscal || null,
          createdAt: p.createdAt || p.receiptDate || new Date(),
          dueDate: p.dueDate || p.createdAt || new Date(),
          amount: Number(p.amount || p.paidAmount || 0),
          reference: p.reference || p.transactionRef || null,
          notes: p.notes || "",
        }))

        setPaymentsList(formatted)
      }
    } catch (error) {
      console.error("Error al cargar pagos:", error)
    } finally {
      setIsLoadingPayments(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [patientId, plans])

  const handleRefresh = () => {
    fetchPayments()
    if (onRefreshData) onRefreshData()
  }

  const eliminadosList = paymentsList.filter((p) => {
    return typeof p.notes === "string" && p.notes.includes("[PAGO ELIMINADO")
  })

  const devolucionesList = paymentsList.filter((p) => {
    const isDeleted = typeof p.notes === "string" && p.notes.includes("[PAGO ELIMINADO")
    const isNC = Number(p.amount) < 0 || (typeof p.notes === "string" && p.notes.includes("NOTA DE CRÉDITO"))
    return isNC && !isDeleted
  })

  const pagosActivosList = paymentsList.filter((p) => {
    const isDeleted = typeof p.notes === "string" && p.notes.includes("[PAGO ELIMINADO")
    return !isDeleted
  })

  const totalCobrado = pagosActivosList
    .filter((p) => Number(p.amount) > 0)
    .reduce((acc, p) => acc + Number(p.amount), 0)

  const totalDevuelto = Math.abs(
    devolucionesList.reduce((acc, p) => acc + Number(p.amount), 0)
  )

  const balanceNeto = totalCobrado - totalDevuelto

  return (
    <div className="space-y-6 font-sans antialiased">
      <div className="flex items-center gap-1 border-b border-border/80 overflow-x-auto custom-scrollbar pb-px">
        {[
          { id: "pagos", label: "Pagos", count: pagosActivosList.length },
          { id: "documentos_emitidos", label: "Documentos emitidos" },
          { id: "devoluciones", label: "Devoluciones", count: devolucionesList.length },
          { id: "eliminados", label: "Pagos Eliminados", count: eliminadosList.length },
          { id: "balance", label: "Balance" },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-5 py-3 font-semibold text-sm whitespace-nowrap transition-all border-b-[3px] cursor-pointer flex items-center gap-2 ${
                isActive
                  ? "border-[#008bcd] text-[#008bcd] dark:text-blue-400 bg-blue-500/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isActive 
                    ? "bg-[#008bcd] text-white" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="pt-2">
        {isLoadingPayments ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#008bcd]">
            <Loader2 className="w-7 h-7 animate-spin mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Cargando historial de pagos...</p>
          </div>
        ) : activeSubTab === "pagos" ? (
          <PaymentsTable 
            paymentsList={pagosActivosList} 
            patient={patient} 
            onRefresh={handleRefresh}
          />
        ) : activeSubTab === "devoluciones" ? (
          <RefundsView 
            refunds={devolucionesList} 
            patient={patient} 
            onRefresh={handleRefresh} 
          />
        ) : activeSubTab === "eliminados" ? (
          <DeletedPaymentsTable 
            payments={eliminadosList} 
          />
        ) : activeSubTab === "balance" ? (
          <FinancialBalanceView 
            totalIncome={totalCobrado} 
            totalRefunds={totalDevuelto} 
            netBalance={balanceNeto} 
          />
        ) : (
          <div className="p-12 text-center text-sm font-medium text-muted-foreground bg-card border border-border/80 rounded-2xl">
            <Receipt className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            Historial de Facturas y Boletas electrónicas emitidas al paciente.
          </div>
        )}
      </div>

    </div>
  )
}