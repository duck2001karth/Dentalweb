"use client"

import React, { useState, useRef, useEffect } from "react"
import { Search, User, AlertCircle, DollarSign, CreditCard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PaymentFormData, PaymentMethod } from "@/types/billing"
import { cn } from "@/lib/utils"

interface PaymentDetailsFormProps {
  formData: PaymentFormData
  setFormData: React.Dispatch<React.SetStateAction<PaymentFormData>>
  patients: any[]
  patientSearchQuery: string
  setPatientSearchQuery: (query: string) => void
  isEditing: boolean
  showErrors: boolean
  isPatientMissing: boolean
  isAmountMissing: boolean
  paymentMethods: { id: PaymentMethod; label: string; icon: any }[]
}

export function PaymentDetailsForm({
  formData,
  setFormData,
  patients,
  patientSearchQuery,
  setPatientSearchQuery,
  isEditing,
  showErrors,
  isPatientMissing,
  isAmountMissing,
  paymentMethods,
}: PaymentDetailsFormProps) {
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
    .filter((pt: any) =>
      `${pt.firstName} ${pt.lastName} ${pt.ci || ""}`
        .toLowerCase()
        .includes(patientSearchQuery.toLowerCase())
    )
    .slice(0, 5)

  return (
    <div className="space-y-4">
      {/* SELECCIÓN DE PACIENTE */}
      <div
        ref={dropdownRef}
        className={cn(
          "bg-muted/10 border rounded-xl p-3.5 relative transition-colors",
          showErrors && isPatientMissing ? "border-rose-500/80 bg-rose-500/5" : "border-border/60"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#008bcd]" /> Paciente Titular <span className="text-rose-500">*</span>
          </Label>
          {showErrors && isPatientMissing && (
            <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Requerido
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={patientSearchQuery}
            onChange={(e) => {
              setPatientSearchQuery(e.target.value)
              setShowDropdown(true)
              if (formData.patientId) setFormData((prev) => ({ ...prev, patientId: "" }))
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Buscar paciente por nombre o CI..."
            className={cn(
              "pl-9 h-10 bg-background text-xs font-semibold focus-visible:ring-[#008bcd]",
              showErrors && isPatientMissing ? "border-rose-500 focus-visible:ring-rose-500" : "border-border"
            )}
            disabled={isEditing}
          />
        </div>

        {showDropdown && !isEditing && patientSearchQuery.length > 0 && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-popover border border-border rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-border/40">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((pt: any) => (
                <button
                  type="button"
                  key={pt.id}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, patientId: pt.id }))
                    setPatientSearchQuery(`${pt.firstName} ${pt.lastName} - CI: ${pt.ci || ""}`)
                    setShowDropdown(false)
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-[#008bcd]/10 text-xs font-bold flex items-center justify-between transition-colors"
                >
                  <span className="text-foreground">{pt.firstName} {pt.lastName}</span>
                  <span className="text-[9px] text-muted-foreground font-mono bg-background px-1.5 py-0.5 rounded border border-border">
                    CI: {pt.ci || "S/N"}
                  </span>
                </button>
              ))
            ) : (
              <div className="p-3 text-xs text-muted-foreground text-center">
                No se encontraron registros.
              </div>
            )}
          </div>
        )}
      </div>

      {/* MONTO A COBRAR */}
      <div
        className={cn(
          "bg-muted/10 border rounded-xl p-3.5 transition-colors",
          showErrors && isAmountMissing ? "border-rose-500/80 bg-rose-500/5" : "border-border/60"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Monto a Cobrar (USD) <span className="text-rose-500">*</span>
          </Label>
          {showErrors && isAmountMissing && (
            <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Ingrese un monto
            </span>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground">$</span>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
            placeholder="0.00"
            className={cn(
              "pl-7 h-11 bg-background font-mono text-lg font-black text-foreground rounded-lg focus-visible:ring-[#008bcd]",
              showErrors && isAmountMissing ? "border-rose-500 focus-visible:ring-rose-500" : "border-border"
            )}
          />
        </div>
      </div>

      {/* MÉTODO DE PAGO */}
      <div className="bg-muted/10 border border-border/60 rounded-xl p-3.5">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
          <CreditCard className="w-3.5 h-3.5 text-[#008bcd]" /> Método de Cobro <span className="text-rose-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((m) => {
            const Icon = m.icon
            const isSelected = formData.method === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, method: m.id }))}
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs font-bold transition-all",
                  isSelected
                    ? "bg-[#008bcd]/15 border-[#008bcd] text-[#008bcd] shadow-xs"
                    : "bg-background border-border hover:bg-muted/40 text-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-[#008bcd]" : "text-muted-foreground")} />
                <span className="truncate leading-none">{m.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}