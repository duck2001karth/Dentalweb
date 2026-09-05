"use client"

import React, { useState, useEffect, useMemo } from "react"
import { format, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { 
  User, Users, ClipboardList, Calendar, Clock, Loader2 
} from "lucide-react"
import { useClinicSettings } from "@/config/clinic-settings"
import { TreatmentSidebarCard } from "./treatment-sidebar-card"

const calcularDuracion = (start?: string, end?: string) => {
  if (!start || !end) return "30 min"
  const [startH, startM] = start.split(":").map(Number)
  const [endH, endM] = end.split(":").map(Number)
  if (isNaN(startH) || isNaN(endH)) return "30 min"
  const diff = endH * 60 + endM - (startH * 60 + startM)
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

export interface TreatmentSidebarProps {
  plan: any
  patient: any
  currentUser?: any
  planItems?: any[]
  totalPaid?: number
  appointmentList?: any[]
  onOpenDiscountModal: () => void
  onOpenCollaboratorsModal: () => void
  onOpenSignatureModal?: () => void
  onPlanUpdate?: () => void
  onApplyAgreement?: (agreement: any) => void
}

export function TreatmentSidebar({
  plan,
  patient,
  currentUser,
  planItems = [],
  totalPaid,
  appointmentList = [],
  onOpenDiscountModal,
  onOpenCollaboratorsModal,
  onOpenSignatureModal,
  onPlanUpdate,
  onApplyAgreement
}: TreatmentSidebarProps) {
  const clinicCtx = useClinicSettings() as any
  const settings = clinicCtx?.settings || clinicCtx
  const validityDays = Number(settings?.quoteValidityDays || 30)

  const [fetchedAppointments, setFetchedAppointments] = useState<any[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(false)

  const patientId = patient?.id || plan?.patientId

  // Cargar citas del paciente
  useEffect(() => {
    if (appointmentList && appointmentList.length > 0) return
    if (!patientId) return

    let isMounted = true
    setIsLoadingAppointments(true)

    fetch(`/api/citas?patientId=${patientId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((json) => {
        if (!isMounted) return
        const rawList = Array.isArray(json) ? json : json.citas || json.appointments || json.data || []
        setFetchedAppointments(rawList)
      })
      .catch((e) => console.error("Error al cargar citas:", e))
      .finally(() => {
        if (isMounted) setIsLoadingAppointments(false)
      })

    return () => {
      isMounted = false
    }
  }, [patientId])

  const realAppointments = useMemo(() => {
    const rawList =
      appointmentList && appointmentList.length > 0
        ? appointmentList
        : patient?.appointments || patient?.citas || fetchedAppointments

    if (!rawList || rawList.length === 0) return []

    return [...rawList].sort((a, b) => {
      const dateAStr = a.date ? a.date.split("T")[0] : a.fecha ? a.fecha.split("T")[0] : "1970-01-01"
      const dateBStr = b.date ? b.date.split("T")[0] : b.fecha ? b.fecha.split("T")[0] : "1970-01-01"
      const timeA = a.startTime || a.hora || "00:00"
      const timeB = b.startTime || b.hora || "00:00"
      return new Date(`${dateBStr}T${timeB}`).getTime() - new Date(`${dateAStr}T${timeA}`).getTime()
    })
  }, [appointmentList, patient?.appointments, patient?.citas, fetchedAppointments])

  const activeCollaborators = useMemo(() => {
    const raw = plan?.collaborators
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
  }, [plan?.collaborators])

  const creationDate = plan?.createdAt ? new Date(plan.createdAt) : new Date()
  const expirationDate = addDays(creationDate, validityDays)

  const convenioPortada =
    patient?.eps ||
    patient?.convenio ||
    plan?.patient?.eps ||
    plan?.patient?.convenio ||
    plan?.convenio ||
    "Particular / Sin convenio"

  return (
    <div className="flex flex-col gap-5 sticky top-24 self-start select-none font-sans antialiased">
      
      {/* 1. TARJETA FINANCIERA CON ARQUEO Y DESCUENTOS */}
      <TreatmentSidebarCard
        plan={plan}
        patient={patient}
        planItems={planItems.length > 0 ? planItems : plan?.items || []}
        discountPercent={Number(plan?.discount || 0)}
        setIsDiscountModalOpen={onOpenDiscountModal}
        setTempDiscount={() => {}}
        onApplyAgreement={onApplyAgreement}
        totalPaid={totalPaid ?? plan?.totalPaid}
      />

      {/* 2. VENCIMIENTO DE ARANCELES */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
        <div className="p-2 bg-amber-500/15 rounded-xl shrink-0">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest text-[10px]">
            Vencimiento de Aranceles
          </p>
          <p className="text-foreground/80 font-medium mt-0.5 text-xs">
            Válido hasta: <b className="text-foreground font-bold">{format(expirationDate, "dd 'de' MMMM, yyyy", { locale: es })}</b>
          </p>
        </div>
      </div>

      {/* 3. PROFESIONAL, COLABORADORES Y CONVENIO */}
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
              type="button"
              onClick={onOpenCollaboratorsModal}
              className="font-bold text-[#008bcd] hover:underline text-xs block cursor-pointer"
            >
              {activeCollaborators.length > 0 ? "Editar colaboradores" : "Asignar colaboradores"}
            </button>
            {activeCollaborators.length > 0 ? (
              <div className="pt-1 flex flex-wrap gap-1">
                {activeCollaborators.map((colabName: string, idx: number) => {
                  const isUuid = typeof colabName === "string" && colabName.length > 25 && colabName.includes("-")
                  const displayName = isUuid ? "Dr. Colaborador" : colabName

                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-300 dark:bg-violet-950/70 dark:text-violet-200 dark:border-violet-700/60 px-2 py-0.5 rounded-md tracking-wide"
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

      {/* 4. HISTORIAL DE CITAS */}
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

export default TreatmentSidebar