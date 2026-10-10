"use client"

import React from "react"
import { 
  FileText, Loader2, Edit2, Trash2, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  Search, Calendar, Filter 
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { PaymentStatusBadge, PaymentMethodBadge } from "@/components/clinic-management/billing/modals/payment-badge"
import { ExportBillingMenu } from "@/components/clinic-management/billing/print/export-billing-menu"
import { useSession } from "next-auth/react"



interface BillingTableProps {
  isLoading: boolean
  payments?: any[]
  currentPayments?: any[]
  statusFilter: string
  setStatusFilter: (val: string) => void
  dateFilter: string
  setDateFilter: (val: string) => void
  methodFilter: string
  setMethodFilter: (val: string) => void
  localSearch: string
  setLocalSearch: (val: string) => void
  externalSearch?: string
  currentPage: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  totalPages: number
  totalItems: number
  startIndex: number
  itemsPerPage: number
  onEdit: (payment: any) => void
  onDelete: (id: string) => void
}

export function BillingTable({
  isLoading,
  payments = [],
  currentPayments = [],
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  methodFilter,
  setMethodFilter,
  localSearch,
  setLocalSearch,
  externalSearch,
  currentPage,
  setCurrentPage,
  totalPages = 1,
  totalItems = 0,
  startIndex = 0,
  itemsPerPage = 10,
  onEdit,
  onDelete,
}: BillingTableProps) {
  const safePayments = payments || []
  const safeCurrentPayments = currentPayments || []
  const { data: session } = useSession()
  const currentUser = session?.user as any
  const role = String(currentUser?.role || "").toUpperCase().trim()
  const isAdmin = role === "ADMIN" || role === "ADMINISTRADOR"

  return (
    <div className="space-y-4">
      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-card p-3 rounded-[24px] border border-border shadow-xs">
        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[150px] h-10 bg-card border-border text-xs font-bold rounded-xl focus:ring-0 focus:outline-none shadow-none shrink-0">
              <Filter className="w-4 h-4 mr-2 text-slate-500" /> <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl text-xs font-medium">
              <SelectItem value="ACTIVE">Cobros Activos</SelectItem>
              <SelectItem value="VOIDED" className="text-rose-600 font-bold">Cobros Anulados</SelectItem>
              <SelectItem value="ALL">Todo el Historial</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[140px] h-10 bg-card border-border text-xs font-bold rounded-xl focus:ring-0 focus:outline-none shadow-none shrink-0">
              <Calendar className="w-4 h-4 mr-2 text-[#008bcd]" /> <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl text-xs font-medium">
              <SelectItem value="TODAY">Solo Hoy</SelectItem>
              <SelectItem value="YESTERDAY">Ayer</SelectItem>
              <SelectItem value="THIS_WEEK">Esta Semana</SelectItem>
              <SelectItem value="THIS_MONTH">Este Mes</SelectItem>
              <SelectItem value="ALL">Historial Completo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[150px] h-10 bg-card border-border text-xs font-bold rounded-xl focus:ring-0 focus:outline-none shadow-none shrink-0">
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

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {externalSearch === undefined && (
            <div className="relative w-full sm:w-[280px]">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                value={localSearch}
                onChange={(e) => { setLocalSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Buscar paciente, CI o Recibo..."
                className="pl-10 h-10 rounded-xl bg-card border-border focus:border-[#008bcd] text-xs font-medium transition-colors"
              />
            </div>
          )}
          
          <div className="w-full sm:w-auto flex justify-end">
            <ExportBillingMenu payments={safePayments} />
          </div>
        </div>
      </div>

      {/* TABLA DE MOVIMIENTOS */}
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
                    <p className="font-bold text-muted-foreground text-sm">Cargando transacciones...</p>
                  </td>
                </tr>
              ) : safeCurrentPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <p className="font-bold text-foreground text-sm">No se encontraron movimientos</p>
                    <p className="font-medium text-muted-foreground text-xs mt-1">Ajusta los filtros o realiza una nueva búsqueda.</p>
                  </td>
                </tr>
              ) : (
                safeCurrentPayments.map((p: any) => {
                  const isVoided = typeof p.notes === "string" && p.notes.includes("[PAGO ELIMINADO")
                  
                  return (
                  <tr 
                    key={p.id} 
                    className={`transition-colors group ${isVoided ? "bg-rose-500/5 hover:bg-rose-500/10" : "hover:bg-muted/40"}`}
                  >
                    <td className="py-4 px-6 align-middle">
                      <p className={`font-bold ${isVoided ? "text-rose-600/60 line-through" : "text-foreground"}`}>
                        {p.createdAt ? format(new Date(p.createdAt), "HH:mm 'hrs'", { locale: es }) : "-"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        {p.createdAt ? format(new Date(p.createdAt), "dd MMM yyyy", { locale: es }) : "-"}
                      </p>
                    </td>

                    <td className={`py-4 px-6 align-middle font-mono text-[13px] font-bold ${isVoided ? "text-muted-foreground/60" : "text-foreground"}`}>
                      {p.receiptNumber || `#REC-${p.id ? p.id.slice(-6).toUpperCase() : "000000"}`}
                    </td>

                    <td className="py-4 px-6 align-middle">
                      <p className={`font-bold text-[13px] ${isVoided ? "text-muted-foreground/70" : "text-foreground"}`}>
                        {p.patient?.firstName} {p.patient?.lastName}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        CI: {p.patient?.ci || "S/N"}
                      </p>
                    </td>

                    <td className={`py-4 px-6 align-middle ${isVoided ? "opacity-50" : ""}`}>
                      <PaymentMethodBadge method={p.method} />
                    </td>

                    <td className="py-4 px-6 align-middle text-right">
                      <span className={`font-black text-[15px] ${isVoided ? "text-rose-600 line-through opacity-70" : "text-foreground"}`}>
                        ${Number(p.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td className="py-4 px-6 align-middle text-center">
                      {isVoided ? (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          Anulado
                        </span>
                      ) : (
                        <PaymentStatusBadge status={p.status} />
                      )}
                    </td>

                    <td className="py-4 px-6 align-middle text-center">
                      {!isVoided ? (
                        isAdmin ? (
                          <div className="flex justify-center items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(p)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg cursor-pointer"
                              title="Editar Cobro"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(p.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                              title="Anular Cobro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-bold px-2 py-0.5 bg-muted/40 rounded-md border border-border/60">
                            Registrado
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic font-medium">Solo lectura</span>
                      )}
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
              
              <span className="px-3.5 py-1.5 font-bold text-[11px] text-foreground bg-background border border-border rounded-lg mx-1">
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
  )
}

export default BillingTable