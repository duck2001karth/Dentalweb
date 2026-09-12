"use client"

import React, { useEffect, useState, useMemo } from "react"
import { Plus, RefreshCw, ArrowUpRight, Lock } from "lucide-react"
import { useSession } from "next-auth/react"
import { isToday, isYesterday, startOfWeek, startOfMonth } from "date-fns"

import { Button } from "@/components/ui/button"
import { usePayments } from "@/hooks/use-payments"
import { useGetPatients } from "@/hooks/patients"
import type { PaymentRecord } from "@/types/billing"
import { useToast } from "@/hooks/use-toast"

import { BillingStats } from "./billing-stats"
import { PaymentModal } from "./payment-modal"
import { ExpenseModal } from "./expense-modal"
import { CashCloseModal } from "./cash-close-modal"
import { DeletePaymentAlert } from "./delete-payment-alert"
import { PrintArqueoTemplate } from "./print-arqueo-template"
import { CashCloseSuccessDialog } from "./cash-close-success"
import { BillingTable } from "./billing-table"

export function BillingTab({ searchTerm: externalSearch }: { searchTerm?: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUserId = (session?.user as any)?.id

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [isCloseSuccessOpen, setIsCloseSuccessOpen] = useState(false)
  const [lastCloseSummary, setLastCloseSummary] = useState<any>(null)

  const { 
    payments = [], 
    lastClose, 
    setLastClose, 
    isLoading, 
    isSaving, 
    fetchPayments, 
    createPayment, 
    updatePayment, 
    deletePayment 
  } = usePayments()
  
  const { patients: apiPatients = [] } = useGetPatients({})

  const [localSearch, setLocalSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("TODAY")
  const [methodFilter, setMethodFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ACTIVE")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExpenseOpen, setIsExpenseOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const safePaymentsList = useMemo(() => {
    if (Array.isArray(payments)) return payments
    if (payments && Array.isArray((payments as any).payments)) return (payments as any).payments
    return []
  }, [payments])

  const totalEfectivoCalculado = useMemo(() => {
    return safePaymentsList
      .filter((p: any) => {
        const isCash = p.method === "CASH"
        const isCompleted = p.status === "COMPLETED"
        const isNotVoided = !(typeof p.notes === "string" && p.notes.includes("[PAGO ELIMINADO"))
        const isAfterLastClose = lastClose?.createdAt
          ? new Date(p.createdAt) > new Date(lastClose.createdAt)
          : true
        return isCash && isCompleted && isNotVoided && isAfterLastClose
      })
      .reduce((acc: number, cur: any) => acc + Number(cur.amount || 0), 0)
  }, [safePaymentsList, lastClose])

  // 2. Filtrado para la tabla
  const searchEffective = externalSearch !== undefined ? externalSearch : localSearch
  const filteredTablePayments = useMemo(() => {
    return safePaymentsList.filter((p: any) => {
      const isVoided = typeof p.notes === "string" && p.notes.includes("[PAGO ELIMINADO")
      if (statusFilter === "ACTIVE" && isVoided) return false
      if (statusFilter === "VOIDED" && !isVoided) return false

      const q = (searchEffective || "").toLowerCase()
      const patientName = `${p.patient?.firstName || ""} ${p.patient?.lastName || ""}`.toLowerCase()
      const matchesSearch =
        (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q)) ||
        patientName.includes(q) ||
        (p.patient?.ci && p.patient.ci.includes(q))

      if (!matchesSearch) return false
      if (methodFilter !== "ALL" && p.method !== methodFilter) return false

      if (!p.createdAt) return true
      const pDate = new Date(p.createdAt)
      if (dateFilter === "TODAY" && !isToday(pDate)) return false
      if (dateFilter === "YESTERDAY" && !isYesterday(pDate)) return false
      if (dateFilter === "THIS_WEEK" && pDate < startOfWeek(new Date(), { weekStartsOn: 1 })) return false
      if (dateFilter === "THIS_MONTH" && pDate < startOfMonth(new Date())) return false

      return true
    })
  }, [safePaymentsList, searchEffective, dateFilter, methodFilter, statusFilter])

  // 3. Pagos activos para métricas superiores (KPIs)
  const activePaymentsForKPIs = useMemo(() => {
    return safePaymentsList.filter((p: any) => {
      const isVoided = typeof p.notes === "string" && p.notes.includes("[PAGO ELIMINADO")
      if (isVoided) return false
      if (methodFilter !== "ALL" && p.method !== methodFilter) return false

      if (!p.createdAt) return true
      const pDate = new Date(p.createdAt)
      if (dateFilter === "TODAY" && !isToday(pDate)) return false
      if (dateFilter === "YESTERDAY" && !isYesterday(pDate)) return false
      if (dateFilter === "THIS_WEEK" && pDate < startOfWeek(new Date(), { weekStartsOn: 1 })) return false
      if (dateFilter === "THIS_MONTH" && pDate < startOfMonth(new Date())) return false

      return true
    })
  }, [safePaymentsList, dateFilter, methodFilter])

  // Paginación
  const totalItems = filteredTablePayments.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentPayments = filteredTablePayments.slice(startIndex, startIndex + itemsPerPage)

  return (
    <>
      <div className="space-y-6 font-sans antialiased animate-in fade-in duration-300 print:hidden">
        {/* ENCABEZADO Y BOTONES DE ACCIÓN */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Arqueo y Facturación</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              Control continuo de ingresos, egresos de caja chica y arqueo de turnos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fetchPayments()}
              className="h-10 w-10 rounded-xl border-border hover:bg-muted bg-card shadow-none transition-colors"
              title="Refrescar transacciones"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
            </Button>

            <Button
              type="button"
              onClick={() => setIsExpenseOpen(true)}
              variant="outline"
              className="h-10 px-4 rounded-xl text-rose-600 border-rose-200/60 hover:bg-rose-500/10 hover:border-rose-500/30 bg-card font-bold text-xs shadow-none transition-all"
            >
              <ArrowUpRight className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Registrar Egreso
            </Button>

            <Button
              type="button"
              onClick={() => setIsCloseModalOpen(true)}
              variant="outline"
              className="h-10 px-4 rounded-xl text-foreground border-border hover:bg-accent bg-card font-bold text-xs shadow-none transition-all"
            >
              <Lock className="w-4 h-4 mr-1.5 text-[#008bcd]" /> Corte / Arqueo
            </Button>

            <Button
              type="button"
              onClick={() => {
                setEditingPayment(null)
                setIsModalOpen(true)
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 rounded-xl shadow-xs text-xs transition-all border-none flex items-center"
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Nuevo Cobro
            </Button>
          </div>
        </div>

        {/* MÉTRICAS */}
        <BillingStats payments={activePaymentsForKPIs} />

        {/* TABLA EXTRAÍDA */}
        <BillingTable
          isLoading={isLoading}
          payments={filteredTablePayments}
          currentPayments={currentPayments}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          methodFilter={methodFilter}
          setMethodFilter={setMethodFilter}
          localSearch={localSearch}
          setLocalSearch={setLocalSearch}
          externalSearch={externalSearch}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          onEdit={(payment) => {
            setEditingPayment(payment)
            setIsModalOpen(true)
          }}
          onDelete={(id) => setItemToDelete(id)}
        />
      </div>

      {/* PLANTILLA DE IMPRESIÓN */}
      <PrintArqueoTemplate
        payments={safePaymentsList}
        dateFilter={dateFilter}
        cashierName={session?.user?.name || "Recepción"}
      />

      {/* MODAL NUEVO COBRO / EDITAR */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingPayment(null)
        }}
        editingPayment={editingPayment}
        patients={apiPatients}
        isSaving={isSaving}
        onSave={async (data) => {
          const ok = editingPayment
            ? await updatePayment(editingPayment.id, data)
            : await createPayment(data, currentUserId)
          if (ok) {
            toast({ title: editingPayment ? "Cobro Actualizado" : "Cobro Registrado", variant: "success" })
            fetchPayments()
          }
          return ok
        }}
      />

      {/* MODAL EGRESO */}
      <ExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        onSave={async (data) => {
          toast({ title: "Egreso Registrado", description: `Salida de caja por $${data.amount} completada.`, variant: "success" })
          return true
        }}
      />

      {/* MODAL CORTE Y ARQUEO */}
      <CashCloseModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        expectedCash={totalEfectivoCalculado}
        onConfirmClose={async (closeData) => {
          try {
            const res = await fetch("/api/payments/close", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(closeData),
            })

            if (res.ok) {
              const json = await res.json()

              if (json?.data) {
                setLastClose(json.data)
              }

              setLastCloseSummary({
                expectedCash: closeData.expectedCash,
                countedCash: closeData.countedCash,
                difference: closeData.difference,
                status:
                  Math.abs(closeData.difference) < 0.01
                    ? "BALANCED"
                    : closeData.difference > 0
                    ? "SURPLUS"
                    : "DEFICIT",
              })

              await fetchPayments()
              setIsCloseModalOpen(false)
              setIsCloseSuccessOpen(true)
              return true
            }
            return false
          } catch (error) {
            console.error("Error al procesar arqueo:", error)
            return false
          }
        }}
      />

      {/* MODAL CONFIRMACIÓN ARQUEO */}
      <CashCloseSuccessDialog
        isOpen={isCloseSuccessOpen}
        onClose={() => {
          setIsCloseSuccessOpen(false)
          fetchPayments()
        }}
        summaryData={lastCloseSummary}
        onPrintArqueo={() => window.print()}
      />

      {/* MODAL ANULAR PAGO */}
      <DeletePaymentAlert
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            await deletePayment(itemToDelete)
            toast({ title: "Cobro Anulado", description: "El dinero ha sido descontado del arqueo de caja.", variant: "destructive" })
            fetchPayments()
          }
        }}
      />
    </>
  )
}

export default BillingTab