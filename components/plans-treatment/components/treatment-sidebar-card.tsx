"use client"

import React, { useState, useEffect, useMemo } from "react"
import { 
  Edit2, Handshake, Percent, DollarSign, Check, X, Loader2 
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

interface TreatmentSidebarCardProps {
  plan: any
  patient: any
  planItems: any[]
  discountPercent: number
  setTempDiscount: (val: string) => void
  setIsDiscountModalOpen: (open: boolean) => void
  onApplyAgreement?: (agreement: any) => void
  totalPaid?: number
}

export function TreatmentSidebarCard({
  plan,
  patient,
  planItems = [],
  discountPercent = 0,
  setTempDiscount,
  setIsDiscountModalOpen,
  onApplyAgreement,
  totalPaid,
}: TreatmentSidebarCardProps) {
  const { settings } = useClinicSettings()
  
  const rawCurrency = (settings as any)?.currencySymbol || (settings as any)?.currency || "USD"
  const currencySymbol = rawCurrency.endsWith(" ") ? rawCurrency : `${rawCurrency} `

  const [agreements, setAgreements] = useState<any[]>([])
  const [isLoadingAgreements, setIsLoadingAgreements] = useState<boolean>(false)
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState<boolean>(false)
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null)

  useEffect(() => {
    setIsLoadingAgreements(true)
    fetch("/api/agreements")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const activeOnly = (Array.isArray(data) ? data : []).filter((ag: any) => ag.isActive)
        setAgreements(activeOnly)
      })
      .catch((err) => console.error("Error al cargar convenios:", err))
      .finally(() => setIsLoadingAgreements(false))
  }, [])

  const baseCost = useMemo(() => {
    return (planItems || []).reduce((acc: number, item: any) => {
      return acc + Number(item.cost || item.price || 0)
    }, 0)
  }, [planItems])

  const effectiveDiscount = useMemo(() => {
    if (selectedAgreement) {
      if (selectedAgreement.discountType === "PERCENTAGE") {
        return Number(selectedAgreement.discountValue || 0)
      }
      if (selectedAgreement.discountType === "FIXED" && baseCost > 0) {
        return Math.min(100, (Number(selectedAgreement.discountValue || 0) / baseCost) * 100)
      }
    }
    return discountPercent
  }, [selectedAgreement, discountPercent, baseCost])

  const finalTotalCost = useMemo(() => {
    const calculated = baseCost - (baseCost * (effectiveDiscount / 100))
    return Math.max(0, calculated)
  }, [baseCost, effectiveDiscount])


  const completedValue = useMemo(() => {
    return (planItems || []).reduce((acc: number, item: any) => {
      const isDone = item.isCompleted || item.progress === 100
      if (isDone) {
        const cost = Number(item.cost || item.price || 0)
        const dscto = Number(item.discount || 0)
        return acc + (cost - (cost * (dscto / 100)))
      }
      return acc
    }, 0)
  }, [planItems])

  const totalAbonado = totalPaid ?? (planItems || []).reduce((acc: number, item: any) => acc + Number(item.paidAmount || 0), 0)
  const totalDebt = Math.max(0, finalTotalCost - totalAbonado)
  const handleSelectAgreement = (agreement: any) => {
    if (selectedAgreement?.id === agreement.id) {
      setSelectedAgreement(null)
      if (setTempDiscount) setTempDiscount("0")
      if (onApplyAgreement) onApplyAgreement(null)
    } else {
      setSelectedAgreement(agreement)
      const discountVal = agreement.discountType === "PERCENTAGE" 
        ? Number(agreement.discountValue).toString() 
        : baseCost > 0 ? ((Number(agreement.discountValue) / baseCost) * 100).toFixed(1) : "0"

      if (setTempDiscount) setTempDiscount(discountVal)
      if (onApplyAgreement) onApplyAgreement(agreement)
    }
    setIsAgreementModalOpen(false)
  }

  return (
    <>
      <div className="shadow-xs rounded-2xl overflow-hidden border border-border/80 bg-card transition-all duration-200">
        <div className="bg-[#008bcd] p-5 text-white rounded-t-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/80 mb-1">
            Plan de Tratamiento
          </p>
          <h3 className="text-xl md:text-2xl font-bold leading-tight text-white tracking-tight">
            {plan?.name || "Limpieza y Profilaxis"}
          </h3>
        </div>

        <div className="p-5 space-y-4 bg-card">
          <div className="text-center pb-4 border-b border-border/60">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Presupuesto Total
            </p>
            {/* Monto corregido con separación entre moneda y cifra */}
            <h4 className="text-3xl md:text-4xl font-extrabold text-[#008bcd] tracking-tight font-mono">
              {currencySymbol}{finalTotalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h4>
          </div>

          <div className="flex justify-between items-center text-xs font-semibold text-foreground">
            <span>Descuento Comercial</span>
            <span
              className="flex items-center gap-1.5 cursor-pointer text-[#008bcd] hover:underline font-bold transition-all"
              onClick={() => {
                setTempDiscount(effectiveDiscount.toString())
                setIsDiscountModalOpen(true)
              }}
            >
              {effectiveDiscount}% <Edit2 className="w-3.5 h-3.5 stroke-[2]" />
            </span>
          </div>

          <div className="space-y-2 text-xs pt-1">
            <div className="flex justify-between text-muted-foreground border-b border-dashed border-border/80 pb-1.5 font-medium">
              <span>Realizado</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {currencySymbol}{completedValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground border-b border-dashed border-border/80 pb-1.5 font-medium">
              <span>Abonado</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                {currencySymbol}{totalAbonado.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between font-bold text-xs text-foreground pt-1">
              <span>Saldo por Abonar</span>
              <span className="text-red-500 font-extrabold font-mono">
                {currencySymbol}{totalDebt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Botón de apertura de convenios */}
          <Button
            type="button"
            onClick={() => setIsAgreementModalOpen(true)}
            className="w-full bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold rounded-xl h-10 text-xs shadow-xs transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
          >
            <Handshake className="w-4 h-4" />
            {selectedAgreement ? `Convenio: ${selectedAgreement.name}` : "Cotizar con Convenio"}
          </Button>
        </div>
      </div>

      {/* Modal de selección de convenios */}
      <Dialog open={isAgreementModalOpen} onOpenChange={setIsAgreementModalOpen}>
        <DialogContent className="sm:max-w-[550px] bg-card border-border rounded-[24px] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="px-6 py-5 border-b border-border bg-[#008bcd]/5">
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center">
                <Handshake className="w-4 h-4" />
              </div>
              Convenios y Tarifas Especiales
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Selecciona un convenio institucional para recalcular el descuento del presupuesto.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 max-h-[380px] overflow-y-auto space-y-3 custom-scrollbar">
            {isLoadingAgreements ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-[#008bcd] mb-2" />
                <p className="text-xs text-muted-foreground font-medium">Cargando convenios...</p>
              </div>
            ) : agreements.length === 0 ? (
              <div className="text-center py-8">
                <Handshake className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs font-bold text-foreground">No hay convenios activos</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Regístralos primero desde el módulo de administración.
                </p>
              </div>
            ) : (
              agreements.map((ag: any) => {
                const isSelected = selectedAgreement?.id === ag.id

                return (
                  <div
                    key={ag.id}
                    onClick={() => handleSelectAgreement(ag)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? "border-[#008bcd] bg-[#008bcd]/10 shadow-xs"
                        : "border-border hover:border-[#008bcd]/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-foreground">{ag.name}</h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#008bcd]/15 text-[#008bcd]">
                          {ag.discountType === "PERCENTAGE" ? (
                            <><Percent className="w-2.5 h-2.5" /> {Number(ag.discountValue)}% OFF</>
                          ) : (
                            <><DollarSign className="w-2.5 h-2.5" /> {currencySymbol}{Number(ag.discountValue)} OFF</>
                          )}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium">{ag.institutionName}</p>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="w-7 h-7 rounded-full bg-[#008bcd] text-white flex items-center justify-center">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-[#008bcd]">
                          <span className="text-[10px] font-bold">+</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-between items-center">
            {selectedAgreement ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleSelectAgreement(selectedAgreement)}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-9 px-3 rounded-xl gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Quitar convenio
              </Button>
            ) : <div />}
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAgreementModalOpen(false)}
              className="text-xs font-bold rounded-xl h-9 px-5 border-border"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TreatmentSidebarCard