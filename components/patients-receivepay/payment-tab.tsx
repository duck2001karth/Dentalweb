"use client"

import React, { useState, useMemo } from "react"
import { DollarSign, CheckCircle2, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// 💡 IMPORTS CON LOS NOMBRES EXACTOS DE EXPORTACIÓN
import { PaymentItemsList } from "./payment-list"
import { PaymentMethodsEcuador } from "./payment-methods"
import { PaymentSuccessStep } from "./payment-success"

// 💡 EXPORTAR CON EL NOMBRE 'PaymentReceiptModal'
export function PaymentReceiptModal({
  isOpen,
  onClose,
  patient,
  plans = [],
  onPaymentSuccess
}: any) {
  const [step, setStep] = useState<"SELECT" | "SUCCESS">("SELECT")
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO")
  const [reference, setReference] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [useCustomAmount, setUseCustomAmount] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(null)

  const pendingItems = useMemo(() => {
    let itemsList: any[] = []
    const allPlans = plans.length > 0 ? plans : (patient?.treatmentPlans || patient?.plans || [])

    allPlans.forEach((p: any) => {
      if (p.status !== "CANCELLED" && p.items) {
        p.items.forEach((item: any) => {
          const cost = item.cost || item.price || 0
          const dscto = item.discount || 0
          const finalPrice = cost - (cost * (dscto / 100))
          const paid = item.paidAmount || 0
          const itemDebt = Math.max(0, finalPrice - paid)

          itemsList.push({
            ...item,
            id: item.id || `item-${Math.random()}`,
            name: item.procedureName || item.name || "Prestación Dental",
            planName: p.name || `Plan #${p.id?.slice(-4)?.toUpperCase()}`,
            finalPrice,
            itemDebt
          })
        })
      }
    })

    return itemsList
  }, [plans, patient])

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedItemIds.length === pendingItems.length) {
      setSelectedItemIds([])
    } else {
      setSelectedItemIds(pendingItems.map((i: any) => i.id))
    }
  }

  const selectedTotal = useMemo(() => {
    return pendingItems
      .filter((item: any) => selectedItemIds.includes(item.id))
      .reduce((acc: number, item: any) => acc + item.itemDebt, 0)
  }, [pendingItems, selectedItemIds])

  const totalToPay = useCustomAmount && parseFloat(customAmount) > 0 
    ? parseFloat(customAmount) 
    : selectedTotal

  const handleProcessPayment = async () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setGeneratedInvoiceId("FAC-2026-001")
      setStep("SUCCESS")
      if (onPaymentSuccess) onPaymentSuccess()
    }, 1000)
  }

  const handleReset = () => {
    setStep("SELECT")
    setSelectedItemIds([])
    setPaymentMethod("EFECTIVO")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="sm:max-w-[620px] bg-card border border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden font-sans">
        {step === "SELECT" ? (
          <>
            <DialogHeader className="px-6 py-4 border-b border-border/80 bg-muted/20">
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/15 text-emerald-600 rounded-xl shrink-0">
                  <DollarSign className="w-5 h-5 stroke-[2.5]" />
                </div>
                Recibir Pago de Tratamiento ($ USD)
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold text-muted-foreground mt-0.5">
                Paciente: <b className="text-foreground">{patient?.firstName} {patient?.lastName}</b>
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
              <PaymentItemsList 
                pendingItems={pendingItems}
                selectedItemIds={selectedItemIds}
                onToggleItem={toggleSelectItem}
                onToggleAll={toggleSelectAll}
              />

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
              />
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
                  disabled={isProcessing || selectedItemIds.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-md cursor-pointer"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                  Pagar Tratamiento(s)
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          <PaymentSuccessStep invoiceId={generatedInvoiceId} totalPaid={totalToPay} paymentMethod={paymentMethod} onReset={handleReset} />
        )}
      </DialogContent>
    </Dialog>
  )
}