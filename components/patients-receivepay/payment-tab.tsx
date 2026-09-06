"use client"

import React, { useState, useMemo } from "react"
import { DollarSign, CheckCircle2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { PaymentItemsList } from "./payment-list"
import { PaymentMethodsEcuador } from "./payment-methods"
import { PaymentSuccessStep as PaymentSuccessStep } from "./payment-success"

const formatToothLocation = (item: any): string => {
  const tooth = item.tooth ?? item.toothNumber ?? item.piece ?? item.piezas ?? item.sector ?? null
  if (!tooth || tooth === "" || tooth === "0" || tooth === "null") {
    return "General"
  }

  const str = String(tooth).trim()

  if (str.toLowerCase().includes("arcada") || str.toLowerCase().includes("sextante") || str.toLowerCase().includes("general")) {
    return str
  }

  return `Pieza ${str}`
}

export function PaymentReceiptModal({
  isOpen,
  onClose,
  patient,
  plan,
  plans = [],
  onPaymentSuccess
}: any) {
  const [step, setStep] = useState<"SELECT" | "SUCCESS">("SELECT")
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO")
  const [reference, setReference] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [useCustomAmount, setUseCustomAmount] = useState(false)
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(null)
  const [confirmedAmount, setConfirmedAmount] = useState<number>(0)
  const pendingItems = useMemo(() => {
    let itemsList: any[] = []
    let rawPlansList: any[] = []

    if (plan && plan.items) rawPlansList.push(plan)
    if (Array.isArray(plans) && plans.length > 0) rawPlansList = [...rawPlansList, ...plans]
    else if (patient?.treatmentPlans) rawPlansList = [...rawPlansList, ...patient.treatmentPlans]

    const uniquePlansMap = new Map()
    rawPlansList.forEach((p: any) => {
      if (p && p.id && !uniquePlansMap.has(p.id)) uniquePlansMap.set(p.id, p)
    })

    const patientConvenioDiscount = parseFloat(
      patient?.convenioDiscount ?? patient?.agreementDiscount ?? patient?.convenioPercent ?? 0
    )

    Array.from(uniquePlansMap.values()).forEach((p: any) => {
      if (p.status !== "CANCELLED" && Array.isArray(p.items || p.treatmentItems)) {
        const planGlobalDiscount = parseFloat(
          p.discountPercent ?? p.discount ?? p.planDiscountPercent ?? 0
        )
        const planConvenioDiscount = parseFloat(
          p.agreementDiscountPercent ?? p.convenioDiscount ?? patientConvenioDiscount ?? 0
        )
        const effectivePlanDiscount = Math.max(planGlobalDiscount, planConvenioDiscount)

        ;(p.items || p.treatmentItems).forEach((item: any) => {
          const cost = parseFloat(item.cost ?? item.price ?? 0)
          const itemDiscount = parseFloat(item.discount ?? 0)
          const effectiveDiscountPercent = itemDiscount > 0 ? itemDiscount : effectivePlanDiscount

          const discountAmount = cost * (effectiveDiscountPercent / 100)
          const finalPrice = Math.max(0, cost - discountAmount)
          const paid = parseFloat(item.paidAmount ?? 0)
          const itemDebt = Math.max(0, finalPrice - paid)

          if (itemDebt > 0 && !item.isPaid) {
            itemsList.push({
              ...item,
              id: item.id || `item-${Math.random()}`,
              name: item.procedureName || item.name || "Prestación Dental",
              toothLabel: formatToothLocation(item),
              planName: p.name || `Plan #${p.id?.slice(-4)?.toUpperCase()}`,
              planId: p.id,
              cost,
              discountPercent: effectiveDiscountPercent,
              discountAmount,
              hasConvenio: effectivePlanDiscount > 0 || Boolean(p.agreementName || patient?.convenio),
              convenioName: p.agreementName || patient?.convenio || null,
              finalPrice,
              paidAmount: paid,
              itemDebt
            })
          }
        })
      }
    })

    return itemsList
  }, [plan, plans, patient])
  React.useEffect(() => {
    if (isOpen && pendingItems.length > 0 && selectedItemIds.length === 0) {
      setSelectedItemIds(pendingItems.map((i: any) => i.id))
    }
  }, [isOpen, pendingItems])

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedItemIds.length === pendingItems.length) setSelectedItemIds([])
    else setSelectedItemIds(pendingItems.map((i: any) => i.id))
  }

  const selectedTotal = useMemo(() => {
    return pendingItems
      .filter((item: any) => selectedItemIds.includes(item.id))
      .reduce((acc: number, item: any) => acc + item.itemDebt, 0)
  }, [pendingItems, selectedItemIds])

  const totalToPay = useCustomAmount && parseFloat(customAmount) > 0 
    ? parseFloat(customAmount) 
    : selectedTotal

  const requiresReference = paymentMethod === "TRANSFERENCIA" || paymentMethod === "TARJETA"
  const isReferenceValid = !requiresReference || (requiresReference && reference.trim().length > 0)
  const canProcessPayment = selectedItemIds.length > 0 || (useCustomAmount && parseFloat(customAmount) > 0)

  const handleProcessPayment = async () => {
    if (!isReferenceValid) return

    const amountToCharge = totalToPay
    setConfirmedAmount(amountToCharge) 

    setIsProcessing(true)
    try {
      const selectedItemsData = pendingItems
        .filter((item: any) => selectedItemIds.includes(item.id))
        .map((item: any) => ({
          id: item.id,
          treatmentPlanId: item.planId,
          baseCost: item.cost,
          discountPercent: item.discountPercent,
          finalPrice: item.finalPrice,
          paidAmount: item.paidAmount,
          payingAmount: item.itemDebt
        }))

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient?.id,
          amount: amountToCharge,
          paymentMethod,
          reference: requiresReference ? reference : null,
          receiptImage: receiptImage || null,
          itemIds: selectedItemIds,
          itemsBreakdown: selectedItemsData,
          treatmentPlanId: pendingItems[0]?.planId || undefined
        })
      })

      const data = await res.json().catch(() => ({}))

      setIsProcessing(false)
      setGeneratedInvoiceId(data.payment?.id || `REC-${Date.now().toString().slice(-6)}`)
      setStep("SUCCESS")
      if (onPaymentSuccess) onPaymentSuccess()
    } catch (e) {
      setIsProcessing(false)
      setGeneratedInvoiceId(`REC-${Date.now().toString().slice(-6)}`)
      setStep("SUCCESS")
      if (onPaymentSuccess) onPaymentSuccess()
    }
  }

  const handleReset = () => {
    setStep("SELECT")
    setSelectedItemIds([])
    setPaymentMethod("EFECTIVO")
    setReference("")
    setReceiptImage(null)
    setConfirmedAmount(0)
    setUseCustomAmount(false)
    setCustomAmount("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="sm:max-w-[860px] bg-card text-foreground border border-border/80 shadow-2xl rounded-3xl p-0 overflow-hidden font-sans antialiased">
        {step === "SELECT" ? (
          <>
            {/* CABECERA */}
            <DialogHeader className="px-7 py-4 border-b border-border/70 bg-muted/20">
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                <div className="p-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0 border border-emerald-500/20">
                  <DollarSign className="w-5 h-5 stroke-[2.5]" />
                </div>
                Recibir Pago de Tratamiento
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-muted-foreground mt-0.5">
                Paciente: <b className="text-foreground font-semibold">{patient?.firstName} {patient?.lastName}</b>
              </DialogDescription>
            </DialogHeader>
            <div className="p-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                    Selección de Prestaciones Pendientes
                  </p>
                  <span className="text-xs font-medium text-muted-foreground">
                    {selectedItemIds.length} de {pendingItems.length} seleccionadas
                  </span>
                </div>

                <div className="max-h-[340px] overflow-y-auto pr-1">
                  <PaymentItemsList 
                    pendingItems={pendingItems}
                    selectedItemIds={selectedItemIds}
                    onToggleItem={toggleSelectItem}
                    onToggleAll={toggleSelectAll}
                  />
                </div>
              </div>

              {/* COLUMNA DERECHA: MEDIOS DE PAGO Y CAJA */}
              <div className="md:col-span-5 bg-muted/20 p-5 rounded-2xl border border-border/60">
                <PaymentMethodsEcuador 
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  reference={reference}
                  setReference={setReference}
                  useCustomAmount={useCustomAmount}
                  setUseCustomAmount={setUseCustomAmount}
                  customAmount={customAmount}
                  setCustomAmount={setCustomAmount}
                  selectedTotal={selectedTotal}
                  receiptImage={receiptImage}
                  setReceiptImage={setReceiptImage}
                />
              </div>
            </div>

            {/* FOOTER */}
            <DialogFooter className="px-7 py-4 border-t border-border/70 bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total a Cobrar</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  ${totalToPay.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleReset} 
                  className="font-bold text-xs h-11 px-4 rounded-xl hover:bg-muted cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button 
                  type="button"
                  onClick={handleProcessPayment} 
                  disabled={isProcessing || !canProcessPayment || !isReferenceValid}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs h-11 px-6 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  )}
                  Pagar Tratamiento(s)
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          <PaymentSuccessStep 
            invoiceId={generatedInvoiceId} 
            totalPaid={confirmedAmount} 
            paymentMethod={paymentMethod} 
            patient={patient}
            onReset={handleReset} 
          />
        )}
      </DialogContent>
    </Dialog>
  )
}