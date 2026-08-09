"use client"

import React, { useState, useEffect, useMemo } from "react"
import { format, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { Edit2, User, Users, ClipboardList, Calendar, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const calcularDuracion = (start?: string, end?: string) => {
  if (!start || !end) return "30 min"
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  if (isNaN(startH) || isNaN(endH)) return "30 min"
  const diff = (endH * 60 + endM) - (startH * 60 + startM)
  return diff > 0 ? `${diff} min` : "30 min"
}

const formatStatus = (status?: string) => {
  const st = (status || "").toUpperCase()
  switch (st) {
    case "SCHEDULED":
    case "AGENDADA":
    case "PROGRAMADA":
      return { label: "Agendada", className: "bg-blue-500/10 text-[#008bcd]" }
    case "CONFIRMED":
    case "CONFIRMADA":
      return { label: "Confirmada", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" }
    case "COMPLETED":
    case "COMPLETADA":
      return { label: "Completada", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" }
    case "CANCELLED":
    case "CANCELADA":
      return { label: "Cancelada", className: "bg-red-500/10 text-red-500" }
    default:
      return { label: status || "Agendada", className: "bg-blue-500/10 text-[#008bcd]" }
  }
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
  const [fetchedAppointments, setFetchedAppointments] = useState<any[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(false)
  const activeCollaborators = useMemo(() => {
    const raw = collaborators || plan?.collaborators
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : [raw]
      } catch {
        return [raw]
      }
    }
    return []
  }, [collaborators, plan?.collaborators])

  const completedValue = useMemo(() => {
    return planItems.reduce((acc: number, item: any) => {
      const isDone = item.isCompleted || item.progress === 100
      if (isDone) {
        const cost = item.cost || 0
        const dscto = item.discount || 0
        return acc + (cost - (cost * (dscto / 100)))
      }
      return acc
    }, 0)
  }, [planItems])

  const totalAbonado = totalPaid ?? planItems.reduce((acc: number, item: any) => acc + (item.paidAmount || 0), 0)
  const totalDebt = debt ?? Math.max(0, finalTotalCost - totalAbonado)

  const convenioPortada = 
    patient?.eps || 
    patient?.convenio || 
    plan?.patient?.eps || 
    plan?.patient?.convenio || 
    plan?.convenio || 
    "Particular / Sin convenio"

  const patientId = patient?.id || plan?.patientId

  useEffect(() => {
    if (appointmentList && appointmentList.length > 0) return
    if (!patientId) return

    setIsLoadingAppointments(true)
    fetch(`/api/citas?patientId=${patientId}`)
      .then(res => res.ok ? res.json() : [])
      .then(json => {
        const rawList = Array.isArray(json) ? json : (json.citas || json.appointments || json.data || [])
        if (rawList.length > 0) setFetchedAppointments(rawList)
      })
      .catch(e => console.error("Error al cargar citas:", e))
      .finally(() => setIsLoadingAppointments(false))
  }, [patientId, appointmentList?.length])

  const realAppointments = useMemo(() => {
    const rawList = (appointmentList && appointmentList.length > 0) 
      ? appointmentList 
      : (patient?.appointments || patient?.citas || fetchedAppointments)

    if (!rawList || rawList.length === 0) return []

    return [...rawList].sort((a, b) => {
      const dateAStr = a.date ? a.date.split('T')[0] : (a.fecha ? a.fecha.split('T')[0] : '1970-01-01')
      const dateBStr = b.date ? b.date.split('T')[0] : (b.fecha ? b.fecha.split('T')[0] : '1970-01-01')
      const timeA = a.startTime || a.hora || '00:00'
      const timeB = b.startTime || b.hora || '00:00'
      return new Date(`${dateBStr}T${timeB}`).getTime() - new Date(`${dateAStr}T${timeA}`).getTime()
    })
  }, [appointmentList, patient?.appointments, patient?.citas, fetchedAppointments])

  const creationDate = plan?.createdAt ? new Date(plan.createdAt) : new Date()
  const expirationDate = addDays(creationDate, 30)

  return (
    <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5 sticky top-24 self-start select-none font-sans antialiased">
      <div className="shadow-xs rounded-2xl overflow-hidden border border-border/80 bg-card transition-all duration-200">
        <div className="bg-[#008bcd] p-5 text-white rounded-t-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/80 mb-1">
            Plan de Tratamiento
          </p>
          <h3 className="text-xl md:text-2xl font-bold leading-tight text-white tracking-tight">
            {plan?.name || "Ortodoncia"}
          </h3>
        </div>

        <div className="p-5 space-y-4 bg-card">
          <div className="text-center pb-4 border-b border-border/60">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Presupuesto Total
            </p>
            <h4 className="text-3xl md:text-4xl font-extrabold text-[#008bcd] tracking-tight">
              ${finalTotalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h4>
          </div>

          <div className="flex justify-between items-center text-xs font-semibold text-foreground">
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

          <div className="space-y-2 text-xs pt-1">
            <div className="flex justify-between text-muted-foreground border-b border-dashed border-border/80 pb-1.5 font-medium">
              <span>Realizado</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ${completedValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground border-b border-dashed border-border/80 pb-1.5 font-medium">
              <span>Abonado</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                ${totalAbonado.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between font-bold text-xs text-foreground pt-1">
              <span>Saldo por Abonar</span>
              <span className="text-red-500 font-extrabold">
                ${totalDebt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <Button 
            onClick={handleCotizarConvenio} 
            className="w-full bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold rounded-xl h-10 text-xs shadow-xs transition-all cursor-pointer mt-2"
          >
            Cotizar con múltiples convenios
          </Button>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
        <div className="p-2 bg-amber-500/15 rounded-xl shrink-0">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest text-[10px]">Vencimiento de Aranceles</p>
          <p className="text-foreground/80 font-medium mt-0.5 text-xs">
            Válido hasta: <b className="text-foreground font-bold">{format(expirationDate, "dd 'de' MMMM, yyyy", { locale: es })}</b>
          </p>
        </div>
      </div>

      {/* PROFESIONAL Y CONVENIO */}
      <div className="bg-card border border-border/80 shadow-xs rounded-2xl p-4 space-y-3 text-xs font-medium">
        <div className="flex gap-3 items-center">
          <User className="w-4 h-4 text-[#008bcd] shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Profesional a cargo</p>
            <p className="font-bold text-foreground text-xs mt-0.5">{plan?.doctor?.name || "Dr(a). Asignado"}</p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <Users className="w-4 h-4 text-[#008bcd] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Colaboradores</p>
            
            <button 
              onClick={() => setIsCollaboratorsOpen(true)} 
              className="font-bold text-[#008bcd] hover:underline text-xs block cursor-pointer"
            >
              {activeCollaborators.length > 0 ? "Editar colaboradores" : "Asignar colaboradores"}
            </button>
            {activeCollaborators.length > 0 ? (
              <div className="pt-1 flex flex-wrap gap-1">
                {activeCollaborators.map((colabName: string, idx: number) => {
                  const isUuid = colabName.length > 25 && colabName.includes("-")
                  const displayName = isUuid ? "Dr. Colaborador" : colabName

                  return (
                    <span 
                      key={idx} 
                      className="inline-flex items-center text-[10px] font-bold bg-[#008bcd]/15 text-[#008bcd] dark:text-sky-300 px-2 py-0.5 rounded-md border border-[#008bcd]/30"
                    >
                      👨‍⚕️ {displayName}
                    </span>
                  )
                })}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground font-medium">Sin colaboradores</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <ClipboardList className="w-4 h-4 text-[#008bcd] shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Convenio / EPS</p>
            <p className="font-bold text-foreground text-xs mt-0.5">{convenioPortada}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/80 shadow-xs rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Calendar className="w-4 h-4 text-[#008bcd]" />
            <span>Historial de Citas</span>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {realAppointments.length}
          </span>
        </div>

        {isLoadingAppointments ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#008bcd]" />
          </div>
        ) : realAppointments.length > 0 ? (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
            {realAppointments.slice(0, 5).map((cita: any, idx: number) => {
              const citaDate = cita.date ? new Date(cita.date) : cita.fecha ? new Date(cita.fecha) : new Date()
              const timeStr = cita.startTime || cita.hora || "09:00"
              const statusObj = formatStatus(cita.status || cita.estado)

              return (
                <div 
                  key={cita.id || idx} 
                  className="p-2.5 bg-muted/20 border border-border/60 rounded-xl text-xs flex items-center justify-between hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground text-[11px]">
                      {format(citaDate, "dd MMM yyyy", { locale: es })} • {timeStr}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground">
                      Duración: {calcularDuracion(cita.startTime, cita.endTime)}
                    </p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md ${statusObj.className}`}>
                    {statusObj.label}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center py-3 text-xs font-medium text-muted-foreground">
            No registra citas asociadas.
          </p>
        )}
      </div>

    </div>
  )
}