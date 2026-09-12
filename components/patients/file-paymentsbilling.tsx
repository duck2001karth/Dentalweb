"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Loader2 } from "lucide-react"
import { PaymentsTable } from "@/components/patients-file/payments/tab-payments"
import { DeletedPaymentsTab } from "@/components/patients-file/payments/payments-deleted/tab-payments-deleted"
import { RefundsView } from "@/components/patients-file/payments/tab-refunds"
import { FinancialBalanceView } from "@/components/patients-file/payments/tab-balance"
import { IssuedDocumentsView } from "@/components/patients-file/payments/tab-documents"

interface PayBillingLayoutProps {
  patientId: string
  patient: any
  plans?: any[]
  onRefreshData?: () => void
}

export function PayBillingLayout({ patientId, patient, plans = [], onRefreshData }: PayBillingLayoutProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>("pagos")
  const [paymentsList, setPaymentsList] = useState<any[]>([])
  const [issuedDocsList, setIssuedDocsList] = useState<any[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState<boolean>(false)

  const fetchPaymentsAndDocs = useCallback(async () => {
    if (!patientId) return
    setIsLoadingPayments(true)
    try {
      const [resPayments, resDocs] = await Promise.all([
        fetch(`/api/payments?patientId=${patientId}`),
        fetch(`/api/sri/invoices?patientId=${patientId}`)
      ])

      if (resPayments.ok) {
        const data = await resPayments.json()
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

      if (resDocs.ok) {
        const dataDocs = await resDocs.json()
        setIssuedDocsList(Array.isArray(dataDocs) ? dataDocs : (dataDocs.documents || dataDocs.taxDocuments || []))
      }
    } catch (error) {
      console.error("Error al cargar datos financieros:", error)
    } finally {
      setIsLoadingPayments(false)
    }
  }, [patientId])
  useEffect(() => {
    fetchPaymentsAndDocs()
  }, [fetchPaymentsAndDocs])

  const handleRefresh = useCallback(() => {
    fetchPaymentsAndDocs()
    if (onRefreshData) onRefreshData()
  }, [fetchPaymentsAndDocs, onRefreshData])
  const eliminadosList = useMemo(() => {
    return paymentsList.filter((p) => typeof p.notes === "string" && p.notes.includes("[PAGO ELIMINADO"))
  }, [paymentsList])

  const devolucionesList = useMemo(() => {
    return paymentsList.filter((p) => {
      const isDeleted = typeof p.notes === "string" && p.notes.includes("[PAGO ELIMINADO")
      const isNC = Number(p.amount) < 0 || (typeof p.notes === "string" && p.notes.includes("NOTA DE CRÉDITO"))
      return isNC && !isDeleted
    })
  }, [paymentsList])

  const pagosActivosList = useMemo(() => {
    return paymentsList.filter((p) => {
      const isDeleted = typeof p.notes === "string" && p.notes.includes("[PAGO ELIMINADO")
      const isNC = Number(p.amount) < 0 || (typeof p.notes === "string" && p.notes.includes("NOTA DE CRÉDITO"))
      return !isDeleted && !isNC
    })
  }, [paymentsList])

  const totalCobrado = useMemo(() => {
    return pagosActivosList
      .filter((p) => Number(p.amount) > 0)
      .reduce((acc, p) => acc + Number(p.amount), 0)
  }, [pagosActivosList])

  const totalDevuelto = useMemo(() => {
    return Math.abs(devolucionesList.reduce((acc, p) => acc + Number(p.amount), 0))
  }, [devolucionesList])

  const balanceNeto = totalCobrado - totalDevuelto
  
  const totalPresupuesto = useMemo(() => {
    return plans.reduce((acc, plan) => {
      const planTotal = Number(plan.total || plan.cost || plan.price || 0)
      return acc + planTotal
    }, 0)
  }, [plans])

  return (
    <div className="space-y-6 font-sans antialiased">
      <div className="flex items-center gap-1 border-b border-border/80 overflow-x-auto custom-scrollbar pb-px">
        {[
          { id: "pagos", label: "Pagos", count: pagosActivosList.length },
          { id: "documentos_emitidos", label: "Documentos emitidos", count: issuedDocsList.length },
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

      {/* CONTENIDO ACTIVO */}
      <div className="pt-2">
        {isLoadingPayments ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#008bcd]">
            <Loader2 className="w-7 h-7 animate-spin mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Cargando información financiera...</p>
          </div>
        ) : activeSubTab === "pagos" ? (
          <PaymentsTable 
            paymentsList={pagosActivosList} 
            patient={patient} 
            onRefresh={handleRefresh}
          />
        ) : activeSubTab === "documentos_emitidos" ? (
          <IssuedDocumentsView 
            documents={issuedDocsList} 
            patient={patient} 
            patientFullName={`${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || "Paciente Registrado"}
            patientDocId={patient?.ci || patient?.identification || "No registrado"}
            patientAge={patient?.age || (patient?.birthDate ? new Date().getFullYear() - new Date(patient.birthDate).getFullYear() : "--")}
            onRefresh={handleRefresh}
          />
        ) : activeSubTab === "devoluciones" ? (
          <RefundsView 
            refunds={devolucionesList} 
            patient={patient} 
            onRefresh={handleRefresh} 
          />
        ) : activeSubTab === "eliminados" ? (
          <DeletedPaymentsTab
            payments={eliminadosList}
            patientFullName={`${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || "Paciente Registrado"}
            patientDocId={patient?.ci || patient?.identification || "No registrado"}
            patientAge={patient?.age || (patient?.birthDate ? new Date().getFullYear() - new Date(patient.birthDate).getFullYear() : "--")}
            onRefresh={handleRefresh}
          />
        ) : activeSubTab === "balance" ? (
          <FinancialBalanceView
            patientId={patientId}
            patientData={patient}
            totalIncome={totalCobrado}
            totalRefunds={totalDevuelto}
            netBalance={balanceNeto}
            payments={pagosActivosList}
            refunds={devolucionesList}
            totalBudget={totalPresupuesto > 0 ? totalPresupuesto : totalCobrado}
          />
        ) : null}
      </div>
    </div>
  )
}