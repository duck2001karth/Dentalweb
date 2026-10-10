"use client"

import React, { useState, useEffect } from "react"
import { 
  Loader2, Search, MessageSquare, ArrowUpRight, DollarSign, 
  User, Users, Wallet, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight 
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useClinicSettings } from "@/config/clinic-settings"

interface DebtsTableProps {
  onPayDebt: (patientId: string, planId: string, amount: number) => void
}

export function DebtsTable({ onPayDebt }: DebtsTableProps) {
  const { settings } = useClinicSettings()
  const rawCurrency = (settings as any)?.currencySymbol || (settings as any)?.currency || "USD"
  const currencySymbol = rawCurrency.endsWith(" ") ? rawCurrency : `${rawCurrency} `

  const [debts, setDebts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchDebts = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/payments/debts")
      if (res.ok) {
        const json = await res.json()
        setDebts(json.debts || [])
      }
    } catch (error) {
      console.error("Error cargando cuentas por cobrar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDebts()
  }, [])

  // Resetear página si el usuario busca algo
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const filteredDebts = debts.filter(d => 
    d.patientName.toLowerCase().includes(search.toLowerCase()) ||
    d.planName.toLowerCase().includes(search.toLowerCase()) ||
    (d.phone && String(d.phone).includes(search))
  )

  const totalDebt = filteredDebts.reduce((acc, curr) => acc + Number(curr.pendingBalance || 0), 0)
  const totalPatients = filteredDebts.length

  // Cálculos de Paginación
  const totalPages = Math.ceil(totalPatients / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentDebts = filteredDebts.slice(startIndex, startIndex + itemsPerPage)

  const handleWhatsApp = (item: any) => {
    if (!item.phone) return
    const cleanPhone = String(item.phone).replace(/\D/g, "")
    const text = encodeURIComponent(
      `Hola ${item.patientName}, le saludamos de la clínica dental. Le recordamos que mantiene un saldo pendiente de ${currencySymbol}${Number(item.pendingBalance).toFixed(2)} correspondiente a su tratamiento "${item.planName}". Quedamos atentos para coordinar sus facilidades de pago o su próxima cita.`
    )
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank")
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* 1. KPIs DE CUENTAS POR COBRAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card p-5 rounded-[22px] border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Cartera Total Vencida
            </p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-500 tracking-tight">
              {currencySymbol}{totalDebt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-muted-foreground font-semibold mt-1">
              Dinero pendiente de ingreso a caja
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-500/20">
            <Wallet className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-card p-5 rounded-[22px] border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Pacientes con Deuda
            </p>
            <h3 className="text-2xl font-black text-foreground tracking-tight">
              {totalPatients}
            </h3>
            <p className="text-[10px] text-muted-foreground font-semibold mt-1">
              Tratamientos con saldo activo
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-[#008bcd] flex items-center justify-center shrink-0 border border-blue-200 dark:border-[#008bcd]/20">
            <Users className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* 2. BARRA DE BÚSQUEDA Y TABLA */}
      <div className="bg-card border border-border rounded-[24px] shadow-xs overflow-hidden">
        
        {/* Buscador pegado a la tabla */}
        <div className="p-3 border-b border-border/60 bg-muted/10">
          <div className="relative w-full sm:w-[320px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente, teléfono o tratamiento..."
              className="pl-10 h-10 rounded-xl bg-background border-border focus:border-[#008bcd] text-xs font-medium"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/30 border-b border-border text-[10px] uppercase text-muted-foreground font-black tracking-wider">
              <tr>
                <th className="py-4 px-6">Paciente</th>
                <th className="py-4 px-6">Plan de Tratamiento</th>
                <th className="py-4 px-6">Doctor a Cargo</th>
                <th className="py-4 px-6 text-right">Costo Realizado</th>
                <th className="py-4 px-6 text-right">Saldo Pendiente</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#008bcd] mx-auto mb-3" />
                    <p className="font-bold text-muted-foreground text-sm">Calculando saldos pendientes...</p>
                  </td>
                </tr>
              ) : currentDebts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-100 dark:border-emerald-500/20">
                      <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                    </div>
                    <p className="font-bold text-foreground text-sm">Cartera Sana</p>
                    <p className="font-medium text-muted-foreground text-xs mt-1">No hay resultados para la búsqueda o no existen deudas.</p>
                  </td>
                </tr>
              ) : (
                currentDebts.map((d: any) => (
                  <tr key={d.planId} className="hover:bg-muted/40 transition-colors group">
                    <td className="py-4 px-6 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{d.patientName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{d.phone || "Sin teléfono"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 align-middle">
                      <p className="font-bold text-foreground">{d.planName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {d.completedProcedures} prestaciones completadas
                      </p>
                    </td>
                    <td className="py-4 px-6 align-middle font-medium text-muted-foreground">
                      {d.doctorName}
                    </td>
                    <td className="py-4 px-6 align-middle text-right font-mono font-medium text-muted-foreground">
                      {currencySymbol}{Number(d.totalCost || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 align-middle text-right">
                      <span className="font-black text-amber-700 dark:text-amber-400 font-mono text-[14px] bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-500/20">
                        {currencySymbol}{Number(d.pendingBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-4 px-6 align-middle text-center">
                      <div className="flex items-center justify-center gap-2">
                        {d.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleWhatsApp(d)}
                            className="h-8 w-8 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400 rounded-lg"
                            title="Enviar Recordatorio por WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPayDebt(d.patientId, d.planId, d.pendingBalance)}
                          className="h-8 text-[11px] font-bold border-[#008bcd]/30 text-[#008bcd] hover:bg-[#008bcd]/10 rounded-lg"
                        >
                          Cobrar <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 3. CONTROLES DE PAGINACIÓN */}
        {totalPatients > 0 && (
          <div className="border-t border-border bg-muted/10 px-6 py-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              Mostrando <b className="text-foreground">{startIndex + 1}</b> a <b className="text-foreground">{Math.min(startIndex + itemsPerPage, totalPatients)}</b> de <b className="text-foreground">{totalPatients}</b> deudores
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