"use client"

import React, { useState, useEffect } from "react"
import { format, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { Edit2, User, Users, ClipboardList, Calendar, Clock, Loader2, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"

const calcularDuracion = (start?: string, end?: string) => {
  if (!start || !end) return "30 min"
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  if (isNaN(startH) || isNaN(endH)) return "30 min"
  const diff = (endH * 60 + endM) - (startH * 60 + startM)
  return diff > 0 ? `${diff} min` : "30 min"
}

export function TreatmentSidebar({
  plan,
  patient,
  finalTotalCost,
  discountPercent,
  setTempDiscount,
  setIsDiscountModalOpen,
  totalPaid,
  debt,
  handleCotizarConvenio,
  setIsCollaboratorsOpen,
  collaborators,
  appointmentList = [],
  planItems = []
}: any) {
  const [realAppointments, setRealAppointments] = useState<any[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(false)

  const convenioPortada = 
    patient?.eps || 
    patient?.convenio || 
    plan?.patient?.eps || 
    plan?.patient?.convenio || 
    plan?.convenio || 
    "Particular / Sin convenio"

  useEffect(() => {
    const fetchAppointments = async () => {
      const initialList = (appointmentList && appointmentList.length > 0)
        ? appointmentList 
        : (patient?.appointments || patient?.citas || plan?.patient?.appointments || plan?.patient?.citas || [])

      if (initialList.length > 0) {
        setRealAppointments(formatAndSort(initialList))
        return
      }
      const patientId = patient?.id || plan?.patientId
      if (!patientId) return

      setIsLoadingAppointments(true)
      try {
        const res = await fetch(`/api/citas?patientId=${patientId}`)
        if (res.ok) {
          const json = await res.json()
          const rawList = Array.isArray(json) ? json : (json.citas || json.appointments || json.data || [])
          if (rawList.length > 0) {
            setRealAppointments(formatAndSort(rawList))
          }
        }
      } catch (e) {
        console.error("Error al cargar citas del paciente:", e)
      } finally {
        setIsLoadingAppointments(false)
      }
    }

    const formatAndSort = (list: any[]) => {
      return [...list].sort((a, b) => {
        const dateAStr = a.date ? a.date.split('T')[0] : (a.fecha ? a.fecha.split('T')[0] : '1970-01-01')
        const dateBStr = b.date ? b.date.split('T')[0] : (b.fecha ? b.fecha.split('T')[0] : '1970-01-01')
        const timeA = a.startTime || a.hora || '00:00'
        const timeB = b.startTime || b.hora || '00:00'
        return new Date(`${dateBStr}T${timeB}`).getTime() - new Date(`${dateAStr}T${timeA}`).getTime()
      })
    }

    fetchAppointments()
  }, [patient, plan, appointmentList])

  const totalItemsCount = planItems.length
  const completedItemsCount = planItems.filter((i: any) => i.isCompleted || i.progress === 100).length
  const progressPercent = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0

  const creationDate = plan?.createdAt ? new Date(plan.createdAt) : new Date()
  const expirationDate = addDays(creationDate, 30)

  return (
    <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 sticky top-24 self-start select-none">
      
      {/* TARJETA PRESUPUESTO PRINCIPAL */}
      <div className="shadow-lg rounded-2xl overflow-hidden border border-border/80 bg-card transition-all duration-200 hover:shadow-xl">
        
        {/* CABECERA AZUL DENTAL CÁLIDO */}
        <div className="bg-[#008bcd] p-6 text-white rounded-t-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/80 mb-1 font-sans">
          Plan de Tratamiento
        </p>
        {/* font-bold en lugar de font-black para evitar deformación */}
        <h3 className="text-2xl md:text-3xl font-bold leading-tight text-white tracking-normal font-sans">
          {plan?.name || "Ortodoncia"}
        </h3>
      </div>

        <div className="p-6 space-y-5 bg-card">
        {/* MONTO TOTAL ESTILO INTER PREMIUM */}
        <div className="text-center pb-5 border-b border-border/60">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">
            Presupuesto Total
          </p>
          <h4 className="text-3xl md:text-4xl font-bold text-[#008bcd] tracking-normal font-sans">
            ${finalTotalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </h4>
        </div>
      {/* DESCUENTO COMERCIAL */}
        <div className="flex justify-between items-center text-sm font-semibold text-foreground font-sans">
          <span>Descuento Comercial</span>
          <span
            className="flex items-center gap-1.5 cursor-pointer text-[#008bcd] hover:underline font-bold transition-all"
            onClick={() => {
              setTempDiscount(discountPercent.toString())
              setIsDiscountModalOpen(true)
            }}
          >
            {discountPercent}% <Edit2 className="w-3.5 h-3.5 stroke-[2]" />
          </span>
        </div>

        {/* DESGLOSE FINANCIERO CON FUENTE INTER LIMPIA */}
        <div className="space-y-2 text-sm pt-1 font-sans">
          <div className="flex justify-between text-muted-foreground border-b border-dashed border-border/80 pb-1.5 font-medium">
            <span>Realizado</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              ${(finalTotalCost * (progressPercent / 100)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground border-b border-dashed border-border/80 pb-1.5 font-medium">
            <span>Abonado</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              ${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-sm text-foreground pt-1">
            <span>Saldo por Abonar</span>
            <span className="text-red-500 font-bold">
              ${debt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* BOTÓN CON ESTILO INTER LIMPIO */}
        <Button 
          onClick={handleCotizarConvenio} 
          className="w-full bg-[#008bcd] hover:bg-[#0073a8] text-white font-semibold rounded-xl h-11 text-sm shadow-sm transition-all cursor-pointer mt-3 font-sans tracking-normal"
        >
          Cotizar con múltiples convenios
        </Button>
      </div>
      </div>

      {/* VENCIMIENTO DE ARANCELES CON COLOR Y TEXTO DESTACADO */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
        <div className="p-2 bg-amber-500/15 rounded-xl shrink-0">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="text-xs">
          <p className="font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest text-[10px]">Vencimiento de Aranceles</p>
          <p className="text-foreground/80 font-bold mt-0.5 text-xs">
            Válido hasta: <b className="text-foreground font-black">{format(expirationDate, "dd 'de' MMMM, yyyy", { locale: es })}</b>
          </p>
        </div>
      </div>

      {/* PROFESIONAL Y CONVENIO */}
      <div className="bg-card border border-border/80 shadow-xs rounded-2xl p-5 space-y-4 text-xs font-medium">
        <div className="flex gap-3 items-center">
          <User className="w-4 h-4 text-[#008bcd] shrink-0" />
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Profesional a cargo</p>
            <p className="font-extrabold text-foreground text-xs mt-0.5">{plan?.doctor?.name || "Dr(a). Asignado"}</p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <Users className="w-4 h-4 text-[#008bcd] shrink-0" />
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Colaboradores</p>
            <button onClick={() => setIsCollaboratorsOpen(true)} className="font-extrabold text-[#008bcd] hover:underline text-xs mt-0.5 cursor-pointer">
              {collaborators?.length > 0 ? `${collaborators.length} Colaboradores` : "Asignar colaboradores"}
            </button>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <ClipboardList className="w-4 h-4 text-[#008bcd] shrink-0" />
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Convenio / EPS</p>
            <p className="font-extrabold text-foreground text-xs mt-0.5">{convenioPortada}</p>
          </div>
        </div>
      </div>

    </div>
  )
}