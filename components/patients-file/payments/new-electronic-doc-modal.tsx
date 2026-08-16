"use client"

import React, { useState } from "react"
import { 
  Building2, CheckCircle2, Loader2, 
  Receipt, ShieldCheck, Calendar
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface NewElectronicDocModalProps {
  isOpen: boolean
  onClose: () => void
  patient: any
  paymentsList?: any[]
  onSuccess?: () => void
}

export function NewElectronicDocModal({
  isOpen,
  onClose,
  patient,
  paymentsList = [],
  onSuccess
}: NewElectronicDocModalProps) {
  const { toast } = useToast()
  const [docType, setDocType] = useState<"FACTURA" | "NOTA_CREDITO">("FACTURA")
  const [secuencial, setSecuencial] = useState("001-001-")
  const [authorizationNum, setAuthorizationNum] = useState("")
  const [emissionDate, setEmissionDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [idType, setIdType] = useState<"CEDULA" | "RUC" | "PASAPORTE" | "CONSUMIDOR_FINAL">(
    patient?.ci?.length === 13 ? "RUC" : "CEDULA"
  )
  const [identification, setIdentification] = useState(patient?.ci || "")
  const [businessName, setBusinessName] = useState(
    patient ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim() : ""
  )
  const [email, setEmail] = useState(patient?.email || "")
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("")
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const handleSelectPayment = (paymentId: string) => {
    setSelectedPaymentId(paymentId)
    const selected = paymentsList.find((p) => p.id === paymentId)
    if (selected) {
      setTotalAmount(Number(selected.amount || selected.paidAmount || 0))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!secuencial || secuencial.length < 9) {
      toast({
        title: "Número de factura requerido",
        description: "Ingresa el formato oficial (ej. 001-001-000000123).",
        variant: "warning"
      })
      return
    }

    if (!identification || !businessName) {
      toast({
        title: "Datos del paciente requeridos",
        description: "Verifica la identificación y razón social del paciente.",
        variant: "warning"
      })
      return
    }

    if (totalAmount <= 0) {
      toast({
        title: "Monto requerido",
        description: "El monto facturado debe ser mayor a 0.00 USD.",
        variant: "warning"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/sri/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient?.id,
          paymentId: selectedPaymentId || null,
          docType,
          secuencial: secuencial.trim(),
          authorizationNum: authorizationNum.trim() || null,
          emissionDate,
          idType,
          identification: identification.trim(),
          businessName: businessName.trim(),
          email: email.trim(),
          subtotal0: totalAmount,
          total: totalAmount
        })
      })

      if (res.ok) {
        toast({
          title: "Factura SRI Registrada",
          description: "El comprobante quedó vinculado a la ficha del paciente.",
          variant: "success"
        })
        if (onSuccess) onSuccess()
        onClose()
      } else {
        const data = await res.json()
        throw new Error(data.error || "Error al guardar factura")
      }
    } catch (err: any) {
      toast({
        title: "Error al registrar comprobante",
        description: err.message || "No se pudo guardar la factura en el sistema.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[880px] bg-card text-foreground border border-border/80 shadow-2xl rounded-3xl p-0 overflow-hidden font-sans antialiased">
        
        {/* CABECERA */}
        <DialogHeader className="px-7 py-4 border-b border-border/70 bg-muted/20 flex flex-row items-center gap-3 text-left">
          <div className="p-2.5 bg-[#008bcd]/15 text-[#008bcd] dark:text-[#38bdf8] rounded-2xl shrink-0 border border-[#008bcd]/20">
            <Building2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Registrar Factura Electrónica (SRI)
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground mt-0.5">
              Asocia una factura o comprobante emitido en el SRI a la ficha de este paciente.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* CONTENIDO HORIZONTAL */}
        <form onSubmit={handleSubmit} className="p-7 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMNA IZQUIERDA: DATOS FISCALES (7 COLS) */}
            <div className="lg:col-span-7 bg-muted/15 border border-border/80 rounded-2xl p-5 space-y-4">
              <span className="text-[11px] font-extrabold text-foreground/80 uppercase tracking-wider block">
                Datos del Receptor / Paciente
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Tipo Doc.</Label>
                  <Select value={idType} onValueChange={(v: any) => setIdType(v)}>
                    <SelectTrigger className="rounded-xl text-xs h-9 bg-background font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CEDULA">Cédula</SelectItem>
                      <SelectItem value="RUC">RUC</SelectItem>
                      <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                      <SelectItem value="CONSUMIDOR_FINAL">Consumidor Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Nº Identificación *</Label>
                  <Input 
                    value={identification} 
                    onChange={(e) => setIdentification(e.target.value)}
                    placeholder="1719231696001" 
                    className="rounded-xl text-xs h-9 bg-background font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground">Razón Social / Nombres Completos *</Label>
                <Input 
                  value={businessName} 
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="rounded-xl text-xs h-9 bg-background font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground">Email del Paciente (Opcional)</Label>
                <Input 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paciente@correo.com"
                  className="rounded-xl text-xs h-9 bg-background"
                />
              </div>
            </div>

            {/* COLUMNA DERECHA: DATOS DEL COMPROBANTE SRI (5 COLS) */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Nº Factura SRI (Establecimiento-Punto-Secuencial) *</Label>
                <Input 
                  value={secuencial} 
                  onChange={(e) => setSecuencial(e.target.value)}
                  placeholder="001-001-000000123" 
                  className="rounded-xl text-xs h-10 font-bold bg-background text-[#008bcd]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Vincular con Pago Clínico</Label>
                <Select value={selectedPaymentId} onValueChange={handleSelectPayment}>
                  <SelectTrigger className="rounded-xl text-xs h-10 bg-background font-medium">
                    <SelectValue placeholder="Seleccionar cobro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentsList.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.paymentNumber || `#REC-${p.id.slice(-6)}`} — ${Number(p.amount || 0).toFixed(2)} USD
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Clave de Acceso / Autorización (Opcional)</Label>
                <Input 
                  value={authorizationNum} 
                  onChange={(e) => setAuthorizationNum(e.target.value)}
                  placeholder="49 dígitos o Nº Autorización SRI" 
                  className="rounded-xl text-xs h-9 bg-background"
                />
              </div>

              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-tight">
                  Servicios odontológicos reportados con <b>Tarifa 0% IVA</b> según Ley Orgánica de Salud y Régimen Tributario del SRI.
                </p>
              </div>

            </div>

          </div>

          {/* FOOTER */}
          <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                TOTAL FACTURADO
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="rounded-xl text-xs font-bold h-11 px-5 hover:bg-muted cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || totalAmount <= 0}
                className="bg-[#008bcd] hover:bg-[#0074a8] text-white rounded-xl text-xs font-bold h-11 px-6 shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                )}
                Guardar Documento
              </Button>
            </div>
          </div>

        </form>

      </DialogContent>
    </Dialog>
  )
}