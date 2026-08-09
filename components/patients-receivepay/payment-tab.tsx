"use client"

import React, { useState, useMemo } from "react"
import { DollarSign, CheckCircle2, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { PaymentItemsList } from "./payment-list"
import { PaymentMethodsEcuador } from "./payment-methods"
import { PaymentSuccessStep } from "./payment-success"

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

    Array.from(uniquePlansMap.values()).forEach((p: any) => {
      if (p.status !== "CANCELLED" && Array.isArray(p.items || p.treatmentItems)) {
        (p.items || p.treatmentItems).forEach((item: any) => {
          const cost = parseFloat(item.cost ?? item.price ?? 0)
          const dscto = parseFloat(item.discount ?? 0)
          const finalPrice = cost - (cost * (dscto / 100))
          const paid = parseFloat(item.paidAmount ?? 0)
          const itemDebt = Math.max(0, finalPrice - paid)

          if (itemDebt > 0 && !item.isPaid) {
            itemsList.push({
              ...item,
              id: item.id || `item-${Math.random()}`,
              name: item.procedureName || item.name || "Prestación Dental",
              planName: p.name || `Plan #${p.id?.slice(-4)?.toUpperCase()}`,
              cost,
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
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient?.id,
          amount: amountToCharge,
          paymentMethod,
          reference: requiresReference ? reference : null,
          receiptImage: receiptImage || null,
          itemIds: selectedItemIds
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
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="sm:max-w-[850px] bg-card border border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden font-sans antialiased">
        {step === "SELECT" ? (
          <>
            <DialogHeader className="px-6 py-4 border-b border-border/80 bg-muted/20">
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/15 text-emerald-600 rounded-xl shrink-0">
                  <DollarSign className="w-5 h-5 stroke-[2.5]" />
                </div>
                Recibir Pago de Tratamiento
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold text-muted-foreground mt-0.5">
                Paciente: <b className="text-foreground">{patient?.firstName} {patient?.lastName}</b>
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-7 space-y-3">
                <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                  Selección de Prestaciones Pendientes
                </p>
                <div className="max-h-[380px] overflow-y-auto pr-1">
                  <PaymentItemsList 
                    pendingItems={pendingItems}
                    selectedItemIds={selectedItemIds}
                    onToggleItem={toggleSelectItem}
                    onToggleAll={toggleSelectAll}
                  />
                </div>
              </div>

              <div className="md:col-span-5 bg-muted/20 p-4 rounded-2xl border border-border/60">
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

            <DialogFooter className="px-6 py-4 border-t border-border/80 bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Total a Cobrar</p>
                <p className="text-xl font-black text-emerald-600">${totalToPay.toFixed(2)} USD</p>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleReset} className="font-bold text-xs h-10 rounded-xl">Cancelar</Button>
                <Button 
                  onClick={handleProcessPayment} 
                  disabled={isProcessing || !canProcessPayment || !isReferenceValid}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-md cursor-pointer transition-all"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
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