"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { format, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Handshake, 
  Pencil, 
  Clock, 
  User, 
  Users, 
  ClipboardList, 
  Calendar,
  Loader2, 
  Check 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useClinicSettings } from "@/config/clinic-settings"

export interface TreatmentSidebarProps {
  plan: any
  patient: any
  currentUser?: any
  planItems?: any[]
  totalPaid?: number
  appointmentList?: any[]
  onOpenDiscountModal: () => void
  setTempDiscount?: (val: string) => void
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
  appointmentList,
  onOpenDiscountModal,
  setTempDiscount,
  onOpenCollaboratorsModal,
  onApplyAgreement,
}: TreatmentSidebarProps) {
  const { settings } = useClinicSettings()
  const rawCurrency = (settings as any)?.currencySymbol || (settings as any)?.currency || "USD"
  const currencySymbol = rawCurrency.endsWith(" ") ? rawCurrency : `${rawCurrency} `

  const [agreements, setAgreements] = useState<any[]>([])
  const [isLoadingAgreements, setIsLoadingAgreements] = useState<boolean>(false)
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState<boolean>(false)
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null)

  const [fetchedAppointments, setFetchedAppointments] = useState<any[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(false)

  // Carga protegida de convenios
  useEffect(() => {
    let isMounted = true
    setIsLoadingAgreements(true)

    fetch("/api/agreements")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!isMounted) return
        const activeOnly = (Array.isArray(data) ? data : []).filter((ag: any) => ag.isActive)
        setAgreements(activeOnly)
      })
      .catch((err) => console.error("Error al cargar convenios:", err))
      .finally(() => {
        if (isMounted) setIsLoadingAgreements(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Carga controlada de citas del paciente
  const targetPatientId = patient?.id || plan?.patientId
  useEffect(() => {
    if (appointmentList && appointmentList.length > 0) {
      setFetchedAppointments(appointmentList)
      return
    }
    if (!targetPatientId) return

    let isMounted = true
    setIsLoadingAppointments(true)

    fetch(`/api/citas?patientId=${targetPatientId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((json) => {
        if (!isMounted) return
        const rawList = Array.isArray(json) ? json : json.citas || json.appointments || json.data || []
        const planAppointments = rawList.filter((apt: any) => {
          if (!apt.treatmentPlanId && !apt.planId) return true
          return String(apt.treatmentPlanId || apt.planId) === String(plan?.id)
        })
        setFetchedAppointments(planAppointments)
      })
      .catch((e) => {
        console.error("Error al cargar citas:", e)
        if (isMounted) setFetchedAppointments([])
      })
      .finally(() => {
        if (isMounted) setIsLoadingAppointments(false)
      })

    return () => {
      isMounted = false
    }
  }, [targetPatientId, appointmentList, plan?.id])

  // Sincronizar convenio previo
  useEffect(() => {
    if (plan?.agreement) {
      setSelectedAgreement(plan.agreement)
    } else if (plan?.agreementName) {
      setSelectedAgreement({ name: plan.agreementName })
    }
  }, [plan?.agreement, plan?.agreementName])

  // Cálculos financieros memoizados
  const effectivePlanItems = planItems.length > 0 ? planItems : plan?.items || []

  const baseCost = useMemo(() => {
    if (effectivePlanItems && effectivePlanItems.length > 0) {
      return effectivePlanItems.reduce((acc: number, item: any) => {
        return acc + Number(item.cost || item.price || 0)
      }, 0)
    }
    return Number(plan?.totalCost || 0)
  }, [effectivePlanItems, plan?.totalCost])

  const effectiveDiscount = useMemo(() => {
    if (selectedAgreement) {
      if (selectedAgreement.discountType === "PERCENTAGE") {
        return Number(selectedAgreement.discountValue || 0)
      }
      if (selectedAgreement.discountType === "FIXED" && baseCost > 0) {
        return Math.min(100, (Number(selectedAgreement.discountValue || 0) / baseCost) * 100)
      }
      if (selectedAgreement.discount) {
        return Number(selectedAgreement.discount)
      }
    }
    return Number(plan?.discount || 0)
  }, [selectedAgreement, plan?.discount, baseCost])

  const finalTotalCost = useMemo(() => {
    if (effectivePlanItems && effectivePlanItems.length > 0) {
      return effectivePlanItems.reduce((acc: number, item: any) => {
        const cost = Number(item.cost || item.price || 0)
        const itemDisc = Number(item.discount || 0)
        const effDisc = itemDisc > 0 ? itemDisc : effectiveDiscount
        return acc + Math.max(0, cost - cost * (effDisc / 100))
      }, 0)
    }
    return Math.max(0, baseCost - baseCost * (effectiveDiscount / 100))
  }, [effectivePlanItems, baseCost, effectiveDiscount])

  const completedValue = useMemo(() => {
    if (!effectivePlanItems || effectivePlanItems.length === 0) return 0
    return effectivePlanItems.reduce((acc: number, item: any) => {
      const isDone = item.isCompleted || Number(item.progress || 0) === 100
      if (isDone) {
        const cost = Number(item.cost || item.price || 0)
        const itemDisc = Number(item.discount || 0)
        const effDisc = itemDisc > 0 ? itemDisc : effectiveDiscount
        return acc + Math.max(0, cost - cost * (effDisc / 100))
      }
      return acc
    }, 0)
  }, [effectivePlanItems, effectiveDiscount])

  const totalAbonado = Number(
    totalPaid ??
    plan?.totalPaid ??
    effectivePlanItems.reduce((acc: number, item: any) => acc + Number(item.paidAmount || 0), 0)
  )
  const saldoPorAbonar = Math.max(0, finalTotalCost - totalAbonado)

  const collaboratorsList = useMemo(() => {
    if (!plan?.collaborators) return []
    if (Array.isArray(plan.collaborators)) return plan.collaborators
    if (typeof plan.collaborators === "string") {
      try {
        const parsed = JSON.parse(plan.collaborators)
        return Array.isArray(parsed) ? parsed : [plan.collaborators]
      } catch {
        return [plan.collaborators]
      }
    }
    return []
  }, [plan?.collaborators])

  const validityDateText = useMemo(() => {
    const creationDate = plan?.createdAt ? new Date(plan.createdAt) : new Date()
    const validityDays = Number((settings as any)?.quoteValidityDays || 30)
    const expirationDate = addDays(creationDate, validityDays)
    return format(expirationDate, "dd 'de' MMMM, yyyy", { locale: es })
  }, [plan?.createdAt, settings])

  const doctorName = plan?.doctor?.name || currentUser?.name || "Dr. Especialista"

  const currentAgreementName = 
    selectedAgreement?.name || 
    plan?.agreementName || 
    plan?.convenio || 
    patient?.convenio || 
    "Particular / Sin convenio"

  const handleSelectAgreement = useCallback(
    (agreement: any) => {
      if (selectedAgreement?.id === agreement?.id) {
        setSelectedAgreement(null)
        if (setTempDiscount) setTempDiscount("0")
        if (onApplyAgreement) onApplyAgreement(null)
      } else {
        setSelectedAgreement(agreement)
        const discountVal =
          agreement.discountType === "PERCENTAGE"
            ? Number(agreement.discountValue).toString()
            : baseCost > 0
            ? ((Number(agreement.discountValue) / baseCost) * 100).toFixed(1)
            : "0"

        if (setTempDiscount) setTempDiscount(discountVal)
        if (onApplyAgreement) onApplyAgreement(agreement)
      }
      setIsAgreementModalOpen(false)
    },
    [selectedAgreement, baseCost, setTempDiscount, onApplyAgreement]
  )

  return (
    <div className="space-y-4 font-sans select-none antialiased">
      {/* 1. TARJETA PRINCIPAL DEL PLAN */}
      <div className="bg-[#121820] border border-[#1e2735] rounded-3xl overflow-hidden shadow-xl">
        <div className="bg-[#008bcd] px-6 py-4 text-white">
          <p className="text-[11px] font-extrabold uppercase tracking-widest opacity-90">
            PLAN DE TRATAMIENTO
          </p>
          <h3 className="text-xl font-black uppercase tracking-tight mt-0.5 truncate">
            {plan?.name || "RESTAURACIÓN"}
          </h3>
        </div>

        <div className="p-6 text-center border-b border-[#1c2431]/80">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            PRESUPUESTO TOTAL
          </p>
          <div className="text-3xl sm:text-4xl font-black text-[#00a8ff] tracking-tight font-mono mt-1">
            {currencySymbol}{finalTotalCost.toFixed(2)}
          </div>
        </div>

        <div className="px-6 py-5 space-y-3.5 text-xs">
          <div className="flex justify-between items-center font-bold">
            <span className="text-slate-300">Descuento Comercial</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#00a8ff] font-mono text-sm">{effectiveDiscount}%</span>
              <button
                type="button"
                onClick={onOpenDiscountModal}
                className="text-[#00a8ff] hover:text-[#38bdf8] p-0.5 rounded cursor-pointer transition-colors"
                title="Editar descuento comercial"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center font-bold">
            <span className="text-slate-300">Realizado</span>
            <span className="text-[#10b981] font-mono text-sm">
              {currencySymbol}{completedValue.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center font-bold">
            <span className="text-slate-300">Abonado</span>
            <span className="text-[#3b82f6] font-mono text-sm">
              {currencySymbol}{totalAbonado.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center font-bold pt-1">
            <span className="text-slate-300 font-extrabold">Saldo por Abonar</span>
            <span className="text-[#ef4444] font-mono text-sm font-black">
              {currencySymbol}{saldoPorAbonar.toFixed(2)}
            </span>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={() => setIsAgreementModalOpen(true)}
              className="w-full bg-[#008bcd] hover:bg-[#007cb8] text-white font-extrabold text-xs h-11 rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border-0"
            >
              <Handshake className="w-4 h-4 stroke-[2.2]" />
              <span>Cotizar con Convenio</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. TARJETA VENCIMIENTO DE ARANCELES */}
      <div className="bg-[#1b160e] border border-[#3d2b15] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center text-[#d97706] shrink-0">
          <Clock className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div className="text-xs leading-snug">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#d97706]">
            VENCIMIENTO DE ARANCELES
          </p>
          <p className="text-slate-300 text-xs font-semibold mt-0.5">
            Válido hasta: <b className="text-white font-bold">{validityDateText}</b>
          </p>
        </div>
      </div>

      {/* 3. TARJETA EQUIPO A CARGO Y CONVENIO */}
      <div className="bg-[#121820] border border-[#1e2735] rounded-3xl p-5 space-y-4 shadow-sm text-xs">
        <div className="flex items-start gap-3">
          <User className="w-4 h-4 text-[#008bcd] shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              PROFESIONAL A CARGO
            </span>
            <p className="text-white font-bold text-xs mt-0.5">{doctorName}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Users className="w-4 h-4 text-[#008bcd] shrink-0 mt-0.5" />
          <div className="w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              COLABORADORES
            </span>
            <button
              type="button"
              onClick={onOpenCollaboratorsModal}
              className="text-[#008bcd] hover:text-[#38bdf8] font-bold text-xs hover:underline cursor-pointer block mt-0.5"
            >
              Asignar colaboradores
            </button>
            <p className="text-slate-400 text-[11px] mt-0.5 italic">
              {collaboratorsList.length > 0 ? collaboratorsList.join(", ") : "Sin colaboradores"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <ClipboardList className="w-4 h-4 text-[#008bcd] shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              CONVENIO / EPS
            </span>
            <p className="text-white font-bold text-xs mt-0.5">{currentAgreementName}</p>
          </div>
        </div>
      </div>

      {/* 4. TARJETA HISTORIAL DE CITAS */}
      <div className="bg-[#121820] border border-[#1e2735] rounded-3xl p-5 shadow-sm text-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1c2431]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#008bcd] stroke-[2.2]" />
            <span className="text-xs font-black text-white tracking-tight">
              Historial de Citas
            </span>
          </div>
          <span className="w-5 h-5 rounded-full bg-[#1c2431] text-slate-300 flex items-center justify-center font-bold text-[10px] border border-border/40">
            {fetchedAppointments.length}
          </span>
        </div>

        {isLoadingAppointments ? (
          <div className="flex items-center justify-center py-4 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#008bcd]" />
            <span className="text-[11px] font-medium">Cargando citas...</span>
          </div>
        ) : fetchedAppointments.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-slate-400 font-medium text-xs">
              No registra citas asociadas.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
            {fetchedAppointments.map((apt: any) => {
              const aptDate = apt.date || apt.start || apt.createdAt
              return (
                <div
                  key={apt.id}
                  className="p-2.5 rounded-xl bg-[#0a0f16] border border-[#1e2735] flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-white text-[11px]">
                      {apt.title || apt.reason || "Cita Clínica"}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {aptDate ? format(new Date(aptDate), "dd/MM/yyyy HH:mm") : "--"}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {apt.status || "Programada"}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL DE CONVENIOS */}
      <Dialog open={isAgreementModalOpen} onOpenChange={setIsAgreementModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-[#121820] border-[#1e2735] text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-white flex items-center gap-2">
              <Handshake className="w-4 h-4 text-[#008bcd]" />
              Convenios y Aranceles Especiales
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Selecciona el convenio institucional aplicable a este tratamiento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4 max-h-[260px] overflow-y-auto custom-scrollbar">
            {isLoadingAgreements ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#008bcd]" />
              </div>
            ) : agreements.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No hay convenios comerciales activos registrados.
              </p>
            ) : (
              agreements.map((ag: any) => {
                const isSelected = selectedAgreement?.id === ag.id
                return (
                  <div
                    key={ag.id}
                    onClick={() => handleSelectAgreement(ag)}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? "border-[#008bcd] bg-[#008bcd]/15"
                        : "border-[#1e2735] bg-[#0a0f16] hover:bg-[#161f2c]"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{ag.name}</p>
                      <span className="text-[10px] font-semibold text-[#10b981]">
                        {ag.discountType === "PERCENTAGE"
                          ? `${ag.discountValue}% descuento`
                          : `$${ag.discountValue} descuento fijo`}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#008bcd]" />}
                  </div>
                )
              })
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1e2735]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAgreementModalOpen(false)}
              className="rounded-xl text-xs font-bold h-9 px-4 border-[#1e2735] bg-transparent text-slate-300 hover:bg-[#1a2332] hover:text-white cursor-pointer"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TreatmentSidebar