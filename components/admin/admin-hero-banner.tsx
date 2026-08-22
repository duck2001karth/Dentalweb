"use client"

import React from "react"
import { Sparkles, Calendar, Banknote, Handshake, Users, ListTree, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface AdminHeroBannerProps {
  userName?: string
  todayIncome: number
  todayAppointments: number
  activeAgreements: number
}

export function AdminHeroBanner({
  userName = "Administrador",
  todayIncome = 0,
  todayAppointments = 0,
  activeAgreements = 0
}: AdminHeroBannerProps) {
  const router = useRouter()
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: es })

  return (
    <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-6 md:p-8 border border-slate-800 shadow-xl">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#008bcd]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* SALUDO Y RESUMEN */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/10 text-sky-300 border border-white/10 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Suite Ejecutiva
            </span>
            <span className="text-xs text-slate-400 font-medium capitalize flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {todayFormatted}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Bienvenido, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-[#008bcd]">{userName}</span>
          </h2>

          <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
            Hoy la clínica tiene <strong className="text-white font-bold">{todayAppointments} citas</strong> en agenda y una recaudación de caja de <strong className="text-emerald-400 font-bold">${todayIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>.
          </p>
        </div>

        {/* MÉTRICAS RÁPIDAS Y ACCESOS DIRECTOS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/5 border border-white/10 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Caja de Hoy</p>
              <p className="text-lg font-black text-white">${todayIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Convenios</p>
              <p className="text-lg font-black text-white">{activeAgreements} Activos</p>
            </div>
          </div>

          {/* ATAJOS EJECUTIVOS */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push("/pacientes")}
              className="h-12 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs gap-2 backdrop-blur-md transition-all border border-white/10"
              title="Ir a directorio de pacientes"
            >
              <Users className="w-4 h-4 text-sky-300" /> Pacientes
            </Button>

            <Button
              onClick={() => router.push("/admin/catalogo")}
              className="h-12 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs gap-2 backdrop-blur-md transition-all border border-white/10"
              title="Configurar aranceles y precios"
            >
              <ListTree className="w-4 h-4 text-purple-300" /> Catálogo
            </Button>

            <Button
              onClick={() => router.push("/admin/convenios")}
              className="h-12 px-5 rounded-2xl bg-[#008bcd] hover:bg-[#007bb6] text-white font-black text-xs gap-2 shadow-lg shadow-[#008bcd]/30 transition-all border-none"
            >
              Convenios <ChevronRight className="w-4 h-4 stroke-[3]" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}