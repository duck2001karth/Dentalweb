"use client"

import React, { useState } from "react"
import { CreditCard, Image as ImageIcon, Search, ShieldCheck, FileSearch, Banknote } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useClinicSettings } from "@/config/clinic-settings"

interface PosVouchersTableProps {
  payments: any[]
}

export function PosVouchersTable({ payments = [] }: PosVouchersTableProps) {
  const { settings } = useClinicSettings()
  const currencySymbol = (settings as any)?.currencySymbol || "$"
  const [search, setSearch] = useState("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Filtrar activos (no anulados) para el cálculo y la vista
  const activePayments = payments.filter(p => {
    const isVoided = typeof p.notes === "string" && p.notes.includes("[PAGO ELIMINADO")
    return !isVoided
  })

  // Totalizador Automático
  const totalReconciled = activePayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

  // Buscador por Lote o Paciente
  const filteredPayments = activePayments.filter((p) => {
    const q = search.toLowerCase()
    return (
      (p.reference && p.reference.toLowerCase().includes(q)) ||
      (p.patient?.firstName?.toLowerCase().includes(q)) ||
      (p.patient?.lastName?.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* TOTALIZADOR KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card p-5 rounded-[22px] border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Total por Conciliar (POS)
            </p>
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight font-mono">
              {currencySymbol}{totalReconciled.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-muted-foreground font-semibold mt-1">
              Ingresos por T. Crédito y Débito
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Banknote className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
        
        <div className="bg-card p-5 rounded-[22px] border border-border shadow-xs flex flex-col justify-center">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Estado de Auditoría
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {activePayments.length} Transacciones
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">Listas para cruce bancario</p>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-3 rounded-[24px] border border-border shadow-xs">
        <div className="relative w-full sm:w-[320px]">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por lote, autorización o paciente..."
            className="pl-10 h-10 rounded-xl bg-background border-border focus:border-indigo-500/50 text-xs font-medium"
          />
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
          <CreditCard className="w-4 h-4" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Registro Datáfono</span>
        </div>
      </div>

      {/* TABLA DE AUDITORÍA */}
      <div className="bg-card border border-border rounded-[24px] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/30 border-b border-border text-[10px] uppercase text-muted-foreground font-black tracking-wider">
              <tr>
                <th className="py-4 px-6">Fecha y Hora</th>
                <th className="py-4 px-6">Paciente Titular</th>
                <th className="py-4 px-6">Modalidad</th>
                <th className="py-4 px-6 font-mono text-indigo-600 dark:text-indigo-400">Autorización / Lote</th>
                <th className="py-4 px-6 text-right">Monto Procesado</th>
                <th className="py-4 px-6 text-center">Voucher Físico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <FileSearch className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-bold text-foreground text-sm">No hay transacciones con tarjeta</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Los cobros registrados por POS aparecerán aquí.</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isCredit = p.method === "CREDIT_CARD"
                  const isDiferido = typeof p.notes === "string" && p.notes.includes("DIFERIDO")
                  
                  return (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-6 align-middle text-muted-foreground font-medium">
                        {p.createdAt ? format(new Date(p.createdAt), "dd MMM yyyy - HH:mm", { locale: es }) : "-"}
                      </td>
                      <td className="py-3 px-6 align-middle font-bold text-foreground">
                        {p.patient?.firstName} {p.patient?.lastName}
                      </td>
                      <td className="py-3 px-6 align-middle">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${isCredit ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"}`}>
                          {isCredit ? "T. Crédito" : "T. Débito"} {isDiferido ? "(Diferido)" : "(Corriente)"}
                        </span>
                      </td>
                      <td className="py-3 px-6 align-middle font-mono font-black text-[13px] text-foreground">
                        {p.reference || "S/N"}
                      </td>
                      <td className="py-3 px-6 align-middle text-right font-black text-[14px]">
                        {currencySymbol}{Number(p.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-6 align-middle text-center">
                        {p.receiptImage ? (
                          <button
                            onClick={() => setPreviewImage(p.receiptImage)}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 gap-1.5 text-[10px] font-bold cursor-pointer"
                            title="Ver Comprobante"
                          >
                            <ImageIcon className="w-3.5 h-3.5" /> Ver Foto
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic bg-muted/60 px-2 py-1 rounded-md border border-border/40">
                            Sin adjunto
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE VISTA PREVIA DE IMAGEN */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-sm border border-border/60 rounded-[24px] p-2 shadow-2xl overflow-hidden flex items-center justify-center">
          {previewImage && (
            <img src={previewImage} alt="Voucher Escaneado" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}