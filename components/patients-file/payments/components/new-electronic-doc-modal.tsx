"use client"

import React, { useState, useMemo, useEffect } from "react"
import { 
  Building2, CheckCircle2, Loader2, 
  ShieldCheck, AlertCircle
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
  const [docType] = useState<"FACTURA" | "NOTA_CREDITO">("FACTURA")
  const [secuencial, setSecuencial] = useState("001-001-")
  const [authorizationNum, setAuthorizationNum] = useState("")
  const [emissionDate] = useState(
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

  // Al abrir el modal, sincronizar los datos del paciente seleccionado
  useEffect(() => {
    if (isOpen) {
      setIdentification(patient?.ci || "")
      setIdType(patient?.ci?.length === 13 ? "RUC" : "CEDULA")
      setBusinessName(patient ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim() : "")
      setEmail(patient?.email || "")
      setSelectedPaymentId("")
      setTotalAmount(0)
      setSecuencial("001-001-")
      setAuthorizationNum("")
    }
  }, [isOpen, patient])

  // Filtrar cobros disponibles: descartar pagos que ya tienen Nota de Crédito o están anulados
  const eligiblePayments = useMemo(() => {
    return paymentsList.filter((p: any) => {
      const isNegative = Number(p.amount || p.paidAmount || 0) <= 0
      const hasNC = Boolean(
        p.hasCreditNote ||
        p.creditNotes?.length > 0 ||
        p.taxDocuments?.some((d: any) => d.docType === "NOTA_CREDITO") ||
        (typeof p.notes === "string" && p.notes.toUpperCase().includes("NOTA DE CRÉDITO"))
      )
      return !isNegative && !hasNC
    })
  }, [paymentsList])

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPaymentId(paymentId)
    const selected = eligiblePayments.find((p) => p.id === paymentId)
    if (selected) {
      setTotalAmount(Number(selected.amount || selected.paidAmount || 0))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!identification.trim()) {
      toast({
        title: "Identificación requerida",
        description: "Ingresa la Cédula o RUC del paciente.",
        variant: "warning"
      })
      return
    }

    if (!businessName.trim()) {
      toast({
        title: "Razón Social requerida",
        description: "Ingresa los nombres y apellidos completos o razón social.",
        variant: "warning"
      })
      return
    }

    const cleanSecuencial = secuencial.trim()
    if (!cleanSecuencial || cleanSecuencial === "001-001-" || cleanSecuencial.length < 15) {
      toast({
        title: "Número de factura incompleto",
        description: "El formato debe ser completo (ej. 001-001-000000123).",
        variant: "warning"
      })
      return
    }

    if (!selectedPaymentId) {
      toast({
        title: "Pago clínico requerido",
        description: "Debes seleccionar un cobro activo del paciente para vincular la factura.",
        variant: "warning"
      })
      return
    }

    if (totalAmount <= 0) {
      toast({
        title: "Monto inválido",
        description: "El monto facturado debe ser superior a 0.00 USD.",
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
          paymentId: selectedPaymentId,
          docType,
          secuencial: cleanSecuencial,
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
          description: "El comprobante electrónico ha sido vinculado exitosamente.",
          variant: "success"
        })
        if (onSuccess) onSuccess()
        onClose()
      } else {
        const data = await res.json()
        throw new Error(data.error || "Error al registrar la factura")
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
              Ingresa los datos del comprobante tributario emitido para el paciente.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-7 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMNA IZQUIERDA: DATOS FISCALES DEL RECEPTOR */}
            <div className="lg:col-span-7 bg-muted/15 border border-border/80 rounded-2xl p-5 space-y-4">
              <span className="text-[11px] font-extrabold text-foreground/80 uppercase tracking-wider block">
                Datos del Receptor / Paciente
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">
                    Tipo Doc. <span className="text-rose-500">*</span>
                  </Label>
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
                  <Label className="text-[11px] font-bold text-muted-foreground">
                    Nº Identificación <span className="text-rose-500">*</span>
                  </Label>
                  <Input 
                    required
                    value={identification} 
                    onChange={(e) => setIdentification(e.target.value)}
                    placeholder="1719231696001" 
                    className="rounded-xl text-xs h-9 bg-background font-bold focus-visible:ring-[#008bcd]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground">
                  Razón Social / Nombres Completos <span className="text-rose-500">*</span>
                </Label>
                <Input 
                  required
                  value={businessName} 
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Nombres y Apellidos del paciente"
                  className="rounded-xl text-xs h-9 bg-background font-medium focus-visible:ring-[#008bcd]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground">
                  Email para Envío de RIDE / XML <span className="text-muted-foreground/60 font-normal">(Opcional)</span>
                </Label>
                <Input 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paciente@correo.com"
                  className="rounded-xl text-xs h-9 bg-background"
                />
              </div>
            </div>

            {/* COLUMNA DERECHA: DATOS DEL COMPROBANTE SRI */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">
                  Nº Factura SRI <span className="text-rose-500">*</span>
                </Label>
                <Input 
                  required
                  value={secuencial} 
                  onChange={(e) => setSecuencial(e.target.value)}
                  placeholder="001-001-000000123" 
                  className="rounded-xl text-xs h-10 font-bold bg-background text-[#008bcd] focus-visible:ring-[#008bcd]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">
                  Vincular con Pago Clínico <span className="text-rose-500">*</span>
                </Label>
                <Select value={selectedPaymentId} onValueChange={handleSelectPayment}>
                  <SelectTrigger className={`rounded-xl text-xs h-10 bg-background font-medium ${!selectedPaymentId ? "border-dashed" : ""}`}>
                    <SelectValue placeholder="Seleccionar cobro a facturar..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[220px] overflow-y-auto rounded-xl">
                    {eligiblePayments.length === 0 ? (
                      <div className="p-3 text-xs text-muted-foreground text-center">
                        No hay pagos disponibles (o ya fueron anulados con NC)
                      </div>
                    ) : (
                      eligiblePayments.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.paymentNumber || `#REC-${p.id.slice(-6)}`} — ${Number(p.amount || 0).toFixed(2)} USD
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">
                  Clave de Acceso / Autorización <span className="text-muted-foreground/60 font-normal">(Opcional)</span>
                </Label>
                <Input 
                  value={authorizationNum} 
                  onChange={(e) => setAuthorizationNum(e.target.value)}
                  placeholder="49 dígitos o Nº Autorización SRI" 
                  maxLength={49}
                  className="rounded-xl text-xs h-10 bg-background font-mono tracking-tight focus-visible:ring-[#008bcd]"
                />
              </div>

              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-tight">
                  Servicios odontológicos reportados con <b>Tarifa 0% IVA</b> según Ley Orgánica de Régimen Tributario Interno del SRI.
                </p>
              </div>

            </div>

          </div>

          {/* FOOTER CON TOTAL Y BOTONES */}
          <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                TOTAL FACTURADO
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
              </span>
              {!selectedPaymentId && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> Selecciona un pago para cargar el valor
                </p>
              )}
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
                disabled={isSubmitting || totalAmount <= 0 || !selectedPaymentId}
                className="bg-[#008bcd] hover:bg-[#0074a8] disabled:opacity-50 text-white rounded-xl text-xs font-bold h-11 px-6 shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
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