"use client"

import React, { useState, useEffect } from "react"
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

  // 💡 SE OBTIENE TAL CUAL COMO EN LA PORTADA (PRIORIZANDO EPS O CONVENIO DEL PACIENTE/PLAN)
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

  // Progreso del Plan
  const totalItemsCount = planItems.length
  const completedItemsCount = planItems.filter((i: any) => i.isCompleted || i.progress === 100).length
  const progressPercent = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0

  // Fecha Vencimiento
  const creationDate = plan?.createdAt ? new Date(plan.createdAt) : new Date()
  const expirationDate = addDays(creationDate, 30)

  return (
    <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 sticky top-24 self-start">
      
      {/* TARJETA PRESUPUESTO */}
      <div className="shadow-lg rounded-2xl overflow-hidden border border-border bg-card">
        <div className="bg-[#00b0e9] p-5 text-white relative">
          <p className="text-xs font-bold uppercase tracking-wider opacity-90 mb-1">Plan de Tratamiento</p>
          <h3 className="text-2xl font-extrabold leading-tight">{plan?.name}</h3>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center pb-4 border-b border-border/50">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Presupuesto Total</p>
            <h4 className="text-4xl font-black text-[#00b0e9]">
              ${finalTotalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h4>
          </div>

          <div className="flex justify-between items-center text-sm font-bold text-foreground">
            <span>Descuento Comercial</span>
            <span
              className="flex items-center gap-1.5 cursor-pointer text-[#00b0e9] hover:underline"
              onClick={() => {
                setTempDiscount(discountPercent.toString())
                setIsDiscountModalOpen(true)
              }}
            >
              {discountPercent}% <Edit2 className="w-3 h-3" />
            </span>
          </div>

          <div className="space-y-2 text-sm pt-1">
            <div className="flex justify-between text-muted-foreground border-b border-dashed border-border pb-1">
              <span>Realizado</span>
              <span className="font-bold text-emerald-600">
                ${(finalTotalCost * (progressPercent / 100)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground border-b border-dashed border-border pb-1">
              <span>Abonado</span>
              <span className="font-bold text-blue-600">
                ${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between font-bold text-foreground pt-1">
              <span>Saldo por Abonar</span>
              <span className="text-red-500">
                ${debt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* BARRA DE PROGRESO */}
          <div className="pt-2 space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground">Progreso del Plan:</span>
              <span className="text-[#00b0e9]">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00b0e9] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <Button onClick={handleCotizarConvenio} className="w-full bg-[#00b0e9] hover:bg-[#0095c6] text-white font-bold rounded-xl mt-2">
            Cotizar con múltiples convenios
          </Button>
        </div>
      </div>

      {/* VENCIMIENTO ARANCELES */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
        <Clock className="w-5 h-5 text-amber-500 shrink-0" />
        <div className="text-xs">
          <p className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Vencimiento de Aranceles</p>
          <p className="text-muted-foreground font-medium mt-0.5">
            Válido hasta: <b className="text-foreground">{format(expirationDate, "dd 'de' MMMM, yyyy", { locale: es })}</b>
          </p>
        </div>
      </div>

      {/* PROFESIONAL Y CONVENIO */}
      <div className="bg-card border border-border shadow-sm rounded-2xl p-5 space-y-4 text-sm">
        <div className="flex gap-3">
          <User className="w-5 h-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Profesional a cargo</p>
            <p className="font-bold text-[#00b0e9]">{plan?.doctor?.name || "Dr(a) Asignado"}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Users className="w-5 h-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Colaboradores</p>
            <button onClick={() => setIsCollaboratorsOpen(true)} className="font-bold text-[#00b0e9] hover:underline text-xs">
              {collaborators?.length > 0 ? `${collaborators.length} Colaboradores` : "Asignar colaboradores"}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <ClipboardList className="w-5 h-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Convenio / EPS</p>
            {/* 💡 MUESTRA EXACTAMENTE LO MISMO QUE LA CABECERA */}
            <p className="font-bold text-foreground">{convenioPortada}</p>
          </div>
        </div>
      </div>

      {/* HISTORIAL DE CITAS EN EL SIDEBAR */}
      <div className="bg-card border border-border shadow-sm rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#00b0e9]" />
            <h4 className="font-bold text-sm text-foreground">Citas del paciente</h4>
          </div>
          {realAppointments.length > 0 && (
            <span className="text-[10px] font-extrabold bg-[#00b0e9]/10 text-[#00b0e9] px-2 py-0.5 rounded-full">
              {realAppointments.length}
            </span>
          )}
        </div>

        {isLoadingAppointments ? (
          <div className="py-6 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#00b0e9]" />
          </div>
        ) : realAppointments.length > 0 ? (
          <div className="space-y-3">
            {realAppointments.slice(0, 4).map((cita: any, idx: number) => {
              const dateRaw = cita.date ? cita.date.split('T')[0] : (cita.fecha ? cita.fecha.split('T')[0] : null)
              const formattedDate = dateRaw 
                ? format(new Date(`${dateRaw}T00:00:00`), "dd/MM/yyyy") 
                : "Fecha no asignada"
              
              const duration = calcularDuracion(cita.startTime || cita.hora, cita.endTime)
              const statusText = 
                cita.status === "SCHEDULED" ? "Agendada" : 
                cita.status === "WAITING" ? "En Sala" : 
                cita.status === "IN_PROGRESS" ? "En Box" : 
                cita.status === "COMPLETED" ? "Atendida" : cita.status || "Agendada"

              return (
                <div key={cita.id || idx} className="p-3 bg-muted/30 border border-border rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground text-[11px]">
                      Cita #{(realAppointments.length - idx).toString().padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {statusText}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground font-medium text-[11px]">
                    <span className="font-bold text-foreground">{formattedDate}</span>
                    {(cita.startTime || cita.hora) && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#00b0e9]" /> {cita.startTime || cita.hora} ({duration})
                      </span>
                    )}
                  </div>

                  <p className="text-foreground font-semibold text-[11px] truncate" title={cita.reason || "Consulta General"}>
                    Motivo: <span className="font-normal text-muted-foreground">{cita.reason || "revision"}</span>
                  </p>

                  <p className="text-[#00b0e9] font-bold text-[11px]">
                    {cita.doctor?.name || "CARMODENTAL"}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic py-2">No hay citas registradas para este paciente.</p>
        )}
      </div>

    </div>
  )
}