"use client"

import React, { useRef, useState, useEffect } from "react"
import { Search, User, Handshake, Stethoscope, Layers, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useClinicSettings } from "@/config/clinic-settings"

interface PaymentPatientTargetFormProps {
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
  patients: any[]
  patientSearchQuery: string
  setPatientSearchQuery: (query: string) => void
  isEditing: boolean
  showErrors: boolean
  isPatientMissing: boolean
  paymentType: "GENERAL" | "PLAN"
  setPaymentType: (type: "GENERAL" | "PLAN") => void
  patientPlans: any[]
  isLoadingPlans: boolean
  patientConvenio?: string
}

export function PaymentPatientTargetForm({
  formData,
  setFormData,
  patients,
  patientSearchQuery,
  setPatientSearchQuery,
  isEditing,
  showErrors,
  isPatientMissing,
  paymentType,
  setPaymentType,
  patientPlans,
  isLoadingPlans,
  patientConvenio,
}: PaymentPatientTargetFormProps) {
  const { settings } = useClinicSettings()
  const currencySymbol = (settings as any)?.currencySymbol || "$"
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  const filteredPatients = (patients || [])
    .filter((pt: any) => `${pt.firstName} ${pt.lastName} ${pt.ci || ""}`.toLowerCase().includes(patientSearchQuery.toLowerCase()))
    .slice(0, 5)

  const handleTypeChange = (type: "GENERAL" | "PLAN") => {
    setPaymentType(type)
    if (type === "GENERAL") {
      setFormData((prev: any) => ({
        ...prev,
        treatmentPlanId: undefined,
        notes: prev.notes?.replace(/\[ABONO PLAN:.*?\]/g, "").trim() || "Consulta General",
      }))
    } else {
      if (patientPlans.length > 0) {
        const defaultPlan = patientPlans[0]
        const debt = Number(defaultPlan.pendingBalance || Math.max(0, Number(defaultPlan.totalCost || 0) - Number(defaultPlan.totalPaid || 0)))
        setFormData((prev: any) => ({
          ...prev,
          treatmentPlanId: defaultPlan.id,
          amount: debt > 0 ? debt.toFixed(2) : prev.amount,
        }))
      }
    }
  }

  const handleSelectPlan = (plan: any) => {
    const debt = Number(plan.pendingBalance || Math.max(0, Number(plan.totalCost || 0) - Number(plan.totalPaid || 0)))
    setFormData((prev: any) => ({
      ...prev,
      treatmentPlanId: plan.id,
      amount: debt > 0 ? String(debt) : prev.amount,
    }))
  }

  return (
    <div className="space-y-4">
      {/* 1. BÚSQUEDA DE PACIENTE COMPACTA */}
      <div ref={dropdownRef} className={cn("bg-muted/10 border rounded-xl p-3 relative transition-colors", showErrors && isPatientMissing ? "border-rose-500/80 bg-rose-500/5" : "border-border/60")}>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#008bcd]" /> Paciente Titular <span className="text-rose-500">*</span>
          </Label>
          {patientConvenio && (
            <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 inline-flex items-center gap-1">
              <Handshake className="w-3 h-3" /> {patientConvenio}
            </span>
          )}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={patientSearchQuery}
            onChange={(e) => {
              setPatientSearchQuery(e.target.value)
              setShowDropdown(true)
              if (formData.patientId) {
                setFormData((prev: any) => ({ ...prev, patientId: "", treatmentPlanId: undefined }))
              }
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Buscar paciente por nombre o CI..."
            className={cn("pl-8 h-9 bg-background text-xs font-semibold focus-visible:ring-[#008bcd]", showErrors && isPatientMissing ? "border-rose-500 focus-visible:ring-rose-500" : "border-border")}
            disabled={isEditing}
          />
        </div>
        
        {/* DROPDOWN FLOTANTE */}
        {showDropdown && !isEditing && patientSearchQuery.length > 0 && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-popover border border-border rounded-xl shadow-xl z-50 max-h-44 overflow-y-auto divide-y divide-border/40">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((pt: any) => (
                <button
                  type="button"
                  key={pt.id}
                  onClick={() => {
                    setFormData((prev: any) => ({ ...prev, patientId: pt.id }))
                    setPatientSearchQuery(`${pt.firstName} ${pt.lastName} - CI: ${pt.ci || ""}`)
                    setShowDropdown(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#008bcd]/10 text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="text-foreground">{pt.firstName} {pt.lastName}</span>
                  <span className="text-[9px] text-muted-foreground font-mono bg-background px-1.5 py-0.5 rounded border border-border">CI: {pt.ci || "S/N"}</span>
                </button>
              ))
            ) : (
              <div className="p-3 text-xs text-muted-foreground text-center">No se encontraron registros.</div>
            )}
          </div>
        )}
      </div>

      {/* 2. DESTINO DEL INGRESO Y PLANES (LIMITANDO ALTURA) */}
      {formData.patientId && (
        <div className="bg-muted/10 border border-border/60 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Destino del Ingreso</Label>
            {isLoadingPlans && <span className="text-[9px] text-muted-foreground italic">Buscando planes...</span>}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange("GENERAL")}
              className={cn("h-8 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer", paymentType === "GENERAL" ? "bg-[#008bcd]/15 border-[#008bcd] text-[#008bcd] shadow-2xs" : "bg-background border-border text-muted-foreground hover:text-foreground")}
            >
              <Stethoscope className="w-3.5 h-3.5" /> Mostrador
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("PLAN")}
              disabled={patientPlans.length === 0}
              className={cn("h-8 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer", paymentType === "PLAN" ? "bg-[#008bcd]/15 border-[#008bcd] text-[#008bcd] shadow-2xs" : patientPlans.length === 0 ? "opacity-40 cursor-not-allowed bg-background border-border text-muted-foreground" : "bg-background border-border text-muted-foreground hover:text-foreground")}
            >
              <Layers className="w-3.5 h-3.5" /> Plan ({patientPlans.length})
            </button>
          </div>

          {paymentType === "PLAN" && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] font-semibold text-muted-foreground">Planes Activos:</span>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                {patientPlans.map((plan: any) => {
                  const debt = Number(plan.pendingBalance || Math.max(0, Number(plan.totalCost || 0) - Number(plan.totalPaid || 0)))
                  const isSelected = formData.treatmentPlanId === plan.id
                  return (
                    <div
                      key={plan.id}
                      onClick={() => handleSelectPlan(plan)}
                      className={cn("p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-2", isSelected ? "bg-[#008bcd]/10 border-[#008bcd] shadow-2xs ring-1 ring-[#008bcd]/40" : "bg-background border-border hover:border-[#008bcd]/40 hover:bg-muted/30")}
                    >
                      <div className="truncate">
                        <p className={cn("font-bold text-[11px] truncate", isSelected ? "text-[#008bcd]" : "text-foreground")}>{plan.name || "Plan General"}</p>
                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-mono mt-0.5">
                          <span>Total: {currencySymbol}{Number(plan.totalCost || 0).toFixed(0)}</span>
                          <span>|</span>
                          <span className="font-bold text-amber-600 dark:text-amber-500">Saldo: {currencySymbol}{debt.toFixed(2)}</span>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#008bcd] shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {paymentType === "GENERAL" && (
            <div className="pt-1">
              <Input
                value={formData.notes || ""}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
                placeholder="Concepto: Consulta general..."
                className="h-9 bg-background text-[11px] font-medium rounded-lg"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}