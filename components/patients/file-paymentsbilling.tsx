"use client"

import React, { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { PaymentsTable } from "@/components/patients-file/payments/payments-table"

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
        id: p.id,
        paymentNumber: p.receiptNumber || p.number || `#REC-${p.id?.slice(-6) || idx + 1}`,
        treatmentId: p.treatmentPlan?.name || p.treatmentPlanId?.slice(-4) || "General",
        paymentMethod: p.method || p.paymentMethod || "Efectivo",
        receivedBy: p.user?.name || p.receivedBy || "Administración",
        invoiceNumber: p.invoiceNumber || "-",
        receiptDate: p.createdAt || p.receiptDate || new Date(),
        dueDate: p.createdAt || new Date(),
        amount: Number(p.amount || p.paidAmount || 0),
        transactionRef: p.transactionRef || p.reference || null
      }))

      setPaymentsList(formatted)
    }
  } catch (error) {
    console.error("Error al cargar historial de pagos:", error)
  } finally {
    setIsLoadingPayments(false)
  }
}

  useEffect(() => {
    fetchPayments()
  }, [patientId, plans])

  return (
    <div className="space-y-6 font-sans antialiased">
      <div className="flex items-center gap-1 border-b border-border/80 overflow-x-auto custom-scrollbar pb-px">
        {[
          { id: "pagos", label: "Pagos" },
          { id: "documentos_emitidos", label: "Documentos emitidos" },
          { id: "devoluciones", label: "Devoluciones" },
          { id: "eliminados", label: "Pagos Eliminados" },
          { id: "balance", label: "Balance" },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-5 py-3 font-semibold text-sm whitespace-nowrap transition-all border-b-[3px] cursor-pointer ${
                isActive
                  ? "border-[#008bcd] text-[#008bcd] dark:text-blue-400 bg-blue-500/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium"
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="pt-2">
        {isLoadingPayments ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#008bcd]">
            <Loader2 className="w-7 h-7 animate-spin mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Cargando historial de pagos...</p>
          </div>
        ) : activeSubTab === "pagos" ? (
          <PaymentsTable 
            paymentsList={paymentsList} 
            patient={patient} 
            onRefresh={fetchPayments}
          />
        ) : activeSubTab === "documentos_emitidos" ? (
          <div className="p-8 text-center text-sm font-medium text-muted-foreground bg-card border border-border/80 rounded-2xl">
            Historial de Facturas y Boletas electrónicas emitidas al paciente.
          </div>
        ) : activeSubTab === "devoluciones" ? (
          <div className="p-8 text-center text-sm font-medium text-muted-foreground bg-card border border-border/80 rounded-2xl">
            Registro de Notas de Crédito y Devoluciones aplicadas.
          </div>
        ) : activeSubTab === "eliminados" ? (
          <div className="p-8 text-center text-sm font-medium text-muted-foreground bg-card border border-border/80 rounded-2xl">
            Auditoría de Pagos Anulados o Eliminados.
          </div>
        ) : (
          <div className="p-8 text-center text-sm font-medium text-muted-foreground bg-card border border-border/80 rounded-2xl">
            Resumen del Balance Financiero general del paciente.
          </div>
        )}
      </div>
    </div>
  )
}