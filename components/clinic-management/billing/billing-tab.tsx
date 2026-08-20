"use client"

import React, { useEffect, useState, useMemo } from "react"
import { 
  Plus, FileText, Loader2, Edit2, Trash2, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, Search,
  ArrowUpRight, Lock, Calendar
} from "lucide-react"
import { useSession } from "next-auth/react"
import { format, isToday, isYesterday, startOfWeek, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"

import { usePayments } from "@/hooks/use-payments"
import { useGetPatients } from "@/hooks/patients"
import type { PaymentRecord } from "@/types/billing"
import { useToast } from "@/hooks/use-toast"
import { BillingStats } from "./billing-stats"
import { PaymentStatusBadge, PaymentMethodBadge } from "./payment-badge"
import { PaymentModal } from "./payment-modal"
import { ExpenseModal } from "./expense-modal"
import { CashCloseModal } from "./cash-close-modal"
import { ExportBillingMenu } from "./export-billing-menu"
import { DeletePaymentAlert } from "./delete-payment-alert"
import { PrintArqueoTemplate } from "./print-arqueo-template"

export default function BillingTab({ searchTerm: externalSearch }: { searchTerm?: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUserId = (session?.user as any)?.id

  const { payments, isLoading, isSaving, fetchPayments, createPayment, updatePayment, deletePayment } = usePayments()
  const { patients: apiPatients } = useGetPatients({})
  const [localSearch, setLocalSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("TODAY")
  const [methodFilter, setMethodFilter] = useState("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExpenseOpen, setIsExpenseOpen] = useState(false)
  const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const searchEffective = externalSearch !== undefined ? externalSearch : localSearch

  const filteredPayments = useMemo(() => {
    return payments.filter((p: any) => {
      // Ignorar pagos eliminados
      if (p.notes?.includes("[PAGO ELIMINADO")) return false
      
      // Búsqueda de texto
      const q = searchEffective.toLowerCase()
      const patientName = `${p.patient?.firstName || ""} ${p.patient?.lastName || ""}`.toLowerCase()
      const matchesSearch = 
        (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q)) || 
        patientName.includes(q) || 
        (p.patient?.ci && p.patient.ci.includes(q))
      
      if (!matchesSearch) return false
      if (methodFilter !== "ALL" && p.method !== methodFilter) return false
      const pDate = new Date(p.createdAt)
      if (dateFilter === "TODAY" && !isToday(pDate)) return false
      if (dateFilter === "YESTERDAY" && !isYesterday(pDate)) return false
      if (dateFilter === "THIS_WEEK" && pDate < startOfWeek(new Date(), { weekStartsOn: 1 })) return false
      if (dateFilter === "THIS_MONTH" && pDate < startOfMonth(new Date())) return false

      return true
    })
  }, [payments, searchEffective, dateFilter, methodFilter])

  const expectedCash = useMemo(() => {
    return filteredPayments
      .filter(p => p.method === "CASH" && p.status === "COMPLETED")
      .reduce((acc, p) => acc + Number(p.amount), 0)
  }, [filteredPayments])
  const totalItems = filteredPayments.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage)

  return (
    <>
      <div className="space-y-6 font-sans antialiased animate-in fade-in duration-300 print:hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Arqueo y Facturación</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              Control diario de ingresos, gastos menores y cuadre de caja de la clínica.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => fetchPayments()} 
              className="h-10 w-10 rounded-xl border-border hover:bg-muted shadow-none bg-card"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <Button 
              onClick={() => setIsExpenseOpen(true)} 
              variant="outline" 
              className="h-10 px-4 rounded-xl text-rose-600 border-rose-200/50 hover:bg-rose-500/10 hover:border-rose-500/30 bg-card font-bold text-xs shadow-none transition-all"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" /> Registrar Egreso
            </Button>

            <Button 
              onClick={() => setIsCloseRegisterOpen(true)} 
              variant="outline"
              className="h-10 px-4 rounded-xl text-foreground border-border hover:bg-accent bg-card font-bold text-xs shadow-none transition-all"
            >
              <Lock className="w-4 h-4 mr-2" /> Cerrar Caja
            </Button>

            <Button 
              onClick={() => { setEditingPayment(null); setIsModalOpen(true); }} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-10 px-5 rounded-xl shadow-sm text-xs transition-all border-none"
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Nuevo Cobro
            </Button>
          </div>
        </div>

        {/* MÉTRICAS */}
        <BillingStats payments={filteredPayments} />
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto custom-scrollbar">
            <ExportBillingMenu payments={filteredPayments} />

            <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px] h-10 bg-card border-border text-xs font-bold rounded-xl focus:ring-0 focus:ring-offset-0 focus:outline-none shadow-none">
                <Calendar className="w-4 h-4 mr-2 text-[#008bcd]" /> <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs font-medium">
                <SelectItem value="TODAY">Solo Hoy</SelectItem>
                <SelectItem value="YESTERDAY">Ayer</SelectItem>
                <SelectItem value="THIS_WEEK">Esta Semana</SelectItem>
                <SelectItem value="THIS_MONTH">Este Mes</SelectItem>
                <SelectItem value="ALL">Todo el Historial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px] h-10 bg-card border-border text-xs font-bold rounded-xl focus:ring-0 focus:ring-offset-0 focus:outline-none shadow-none">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs font-medium">
                <SelectItem value="ALL">Todos los Medios</SelectItem>
                <SelectItem value="CASH">Solo Efectivo</SelectItem>
                <SelectItem value="TRANSFER">Transferencias</SelectItem>
                <SelectItem value="CREDIT_CARD">Tarjetas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {externalSearch === undefined && (
            <div className="relative w-full lg:w-[320px]">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                value={localSearch}
                onChange={(e) => { setLocalSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Buscar paciente, CI o Recibo..."
                className="pl-10 h-10 rounded-xl bg-card border-border focus:border-[#008bcd] text-xs font-medium transition-colors"
              />
            </div>
          )}
        </div>
        <div className="bg-card border border-border rounded-[24px] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-muted/30 border-b border-border text-[10px] uppercase text-muted-foreground font-black tracking-wider">
                <tr>
                  <th className="py-4 px-6">Fecha / Hora</th>
                  <th className="py-4 px-6">N° Recibo</th>
                  <th className="py-4 px-6">Paciente</th>
                  <th className="py-4 px-6">Método</th>
                  <th className="py-4 px-6 text-right">Monto</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#008bcd] mx-auto mb-3" />
                      <p className="font-bold text-muted-foreground text-sm">Cargando caja...</p>
                    </td>
                  </tr>
                ) : currentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                      <p className="font-bold text-foreground text-sm">No se encontraron movimientos</p>
                      <p className="font-medium text-muted-foreground text-xs mt-1">Intenta con otro rango de fechas.</p>
                    </td>
                  </tr>
                ) : (
                  currentPayments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors group">
                      <td className="py-4 px-6 align-middle">
                        <p className="font-bold text-foreground">{format(new Date(p.createdAt), "HH:mm 'hrs'", { locale: es })}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{format(new Date(p.createdAt), "dd MMM yyyy", { locale: es })}</p>
                      </td>

                      <td className="py-4 px-6 align-middle font-mono text-[13px] font-bold text-foreground">
                        {p.receiptNumber || `#REC-${p.id.slice(-6).toUpperCase()}`}
                      </td>

                      <td className="py-4 px-6 align-middle">
                        <p className="font-bold text-foreground text-[13px]">
                          {p.patient?.firstName} {p.patient?.lastName}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                          CI: {p.patient?.ci || "S/N"}
                        </p>
                      </td>

                      <td className="py-4 px-6 align-middle">
                        <PaymentMethodBadge method={p.method} />
                      </td>

                      <td className="py-4 px-6 align-middle text-right">
                        <span className="font-black text-foreground text-[15px]">
                          ${Number(p.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td className="py-4 px-6 align-middle text-center">
                        <PaymentStatusBadge status={p.status} />
                      </td>

                      <td className="py-4 px-6 align-middle text-center">
                        <div className="flex justify-center items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditingPayment(p); setIsModalOpen(true); }}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setItemToDelete(p.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                            title="Anular"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          {totalItems > 0 && (
            <div className="border-t border-border bg-muted/10 px-6 py-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                Mostrando <b className="text-foreground">{startIndex + 1}</b> a <b className="text-foreground">{Math.min(startIndex + itemsPerPage, totalItems)}</b> de <b className="text-foreground">{totalItems}</b> registros
              </span>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-3 py-1 font-bold text-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <PrintArqueoTemplate payments={filteredPayments} dateFilter={dateFilter} />
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPayment(null); }}
        editingPayment={editingPayment}
        patients={apiPatients || []}
        isSaving={isSaving}
        onSave={async (data) => {
          const ok = editingPayment ? await updatePayment(editingPayment.id, data) : await createPayment(data, currentUserId)
          if (ok) fetchPayments()
          return ok
        }}
      />

      <ExpenseModal 
        isOpen={isExpenseOpen} 
        onClose={() => setIsExpenseOpen(false)} 
        onSave={async (data) => {
          toast({ title: "Egreso Registrado", description: `Salida de caja por $${data.amount} completada.` })
          return true
        }} 
      />

      <CashCloseModal 
        isOpen={isCloseRegisterOpen} 
        onClose={() => setIsCloseRegisterOpen(false)} 
        expectedCash={expectedCash} 
      />

      <DeletePaymentAlert 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            await deletePayment(itemToDelete)
            fetchPayments()
          }
        }}
      />
    </>
  )
}