"use client"

import React, { useRef } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Printer, X } from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const formatPaymentMethod = (method?: string) => {
  if (!method) return "Efectivo"
  const m = method.toUpperCase()
  switch (m) {
    case "CASH":
    case "EFECTIVO":
      return "Efectivo"
    case "CREDIT_CARD":
    case "TARJETA_CREDITO":
      return "Tarjeta de Crédito"
    case "DEBIT_CARD":
    case "TARJETA_DEBITO":
      return "Tarjeta de Débito"
    case "TRANSFER":
    case "TRANSFERENCIA":
    case "NEQUI":
      return "Transferencia Bancaria"
    case "CHECK":
    case "CHEQUE":
      return "Cheque"
    default:
      return method
  }
}

export function PaymentReceiptModal({ isOpen, onClose, payment, patient, clinicInfo }: any) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!payment) return null

  // DATOS CLÍNICA (CARMO DENTAL)
  const clinicName = clinicInfo?.clinicName || "CARMO DENTAL"
  const clinicAddress = clinicInfo?.address || "Av. Principal #123 - Centro Médico"
  const clinicPhone = clinicInfo?.phone || "Teléfono: +593 99 999 9999"
  const logoUrl = clinicInfo?.logoUrl || "/logo.png" // Ruta de tu logo corporativo

  // DATOS PACIENTE (ADAPTADO A ECUADOR: C.I.)
  const patientName = patient 
    ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
    : payment?.patientName || "Paciente registrado"
  const patientCi = patient?.ci || payment?.patientCi || payment?.patientIdNum || "S/I"

  // DATOS TRANSACCIÓN
  const receiptNum = payment.paymentNumber || payment.receiptNumber || `#REC-${payment.id?.slice(-6)}`
  const cleanReceiptNum = receiptNum.replace(/^#+/, "#")
  
  const treatmentName = payment.treatmentPlan?.name || payment.treatmentName || "Tratamiento Odontológico"
  const rawAmount = Number(payment.amount || payment.paidAmount || 0)
  const methodSpanish = formatPaymentMethod(payment.method || payment.paymentMethod)
  const invoiceNum = payment.invoiceNumber || payment.receiptNumberFiscal || "-"
  const refCode = payment.reference ? `Ref: ${payment.reference}` : ""

  const receiptDate = payment.createdAt || payment.receiptDate || new Date()
  const dueDate = payment.dueDate || receiptDate

  // PRESTACIONES DETALLADAS PARA IMPRESIÓN
  let detailedItems: any[] = []
  if (payment.notes) {
    try {
      const parsedNotes = JSON.parse(payment.notes)
      if (Array.isArray(parsedNotes)) detailedItems = parsedNotes
    } catch (e) {
      // Si notes no es JSON
    }
  }
  if (detailedItems.length === 0) {
    detailedItems = payment.itemsPaid || payment.treatmentPlan?.items || []
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const windowUrl = "about:blank"
    const uniqueName = new Date().getTime().toString()
    const printWindow = window.open(windowUrl, uniqueName, "width=850,height=900")

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comprobante de Pago ${cleanReceiptNum}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #111; line-height: 1.4; }
              .header-grid { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
              .logo-box { display: flex; align-items: center; gap: 12px; }
              .brand-title { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #008bcd; text-transform: uppercase; margin: 0; }
              .clinic-info { text-align: right; font-size: 11px; color: #475569; line-height: 1.3; }
              .font-bold { font-weight: bold; }
              .text-right { text-align: right; }
              table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
              th { text-align: left; border-bottom: 2px solid #1e293b; padding: 6px 0; text-transform: uppercase; font-size: 10px; color: #475569; }
              td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
              .total-row { text-align: right; font-weight: bold; font-size: 13px; padding-top: 8px; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* [&>button]:hidden elimina la 'X' duplicada que inyecta Shadcn UI por defecto */}
      <DialogContent className="sm:max-w-[750px] bg-card border-border rounded-2xl p-0 overflow-hidden font-sans [&>button]:hidden">
        
        {/* BARRA SUPERIOR CON ACCIONES */}
        <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
          <DialogTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            Comprobante de Pago {cleanReceiptNum}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handlePrint} 
              className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold text-xs rounded-xl h-9 px-4 flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <Printer className="w-4 h-4 stroke-[2.2]" /> Imprimir Comprobante
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="rounded-xl h-9 w-9 p-0 cursor-pointer border-border hover:bg-muted"
              title="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PLANTILLA DE IMPRESIÓN OFICIAL */}
        <div className="p-8 bg-white text-slate-900 max-h-[75vh] overflow-y-auto" ref={printRef}>
          
          {/* CABECERA ESTILO LOGO IZQUIERDA Y DATOS DERECHA */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-200">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative w-12 h-12 shrink-0">
                  <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#008bcd]/10 flex items-center justify-center text-[#008bcd] font-black text-xl">
                  CD
                </div>
              )}
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#008bcd] uppercase leading-none">
                  {clinicName}
                </h1>
                <p className="text-[11px] font-bold text-slate-500 mt-1">Especialidades Odontológicas</p>
              </div>
            </div>

            <div className="text-right text-xs font-semibold text-slate-600 space-y-0.5">
              <p className="text-slate-900 font-bold">{clinicAddress}</p>
              <p>{clinicPhone}</p>
              <p className="text-[#008bcd] font-bold">Quito - Ecuador</p>
            </div>
          </div>

          {/* DATOS PACIENTE (FORMATO ECUADOR) */}
          <div className="py-5 space-y-1">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">Comprobante de Pago</h2>
            <p className="text-xs font-medium text-slate-700">
              Paciente: <span className="font-extrabold text-slate-900">{patientName}</span> &nbsp;•&nbsp; C.I.: <span className="font-extrabold text-slate-900">{patientCi}</span>
            </p>
            <p className="text-xs font-medium text-slate-500">
              Transacción realizada el {format(new Date(receiptDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>

          {/* TABLA 1: CARGOS A ABONAR */}
          <div className="space-y-2 mt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-1 text-slate-900">
              Cargos a abonar
            </h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 font-bold text-slate-700">
                  <th className="py-2">Nº Ref</th>
                  <th className="py-2">Descripción</th>
                  <th className="py-2 text-right">Abono</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                <tr>
                  <td className="py-2.5 font-bold text-[#008bcd]">{cleanReceiptNum}</td>
                  <td className="py-2.5">
                    Tratamiento: <span className="font-bold text-slate-900">{treatmentName}</span>
                    <br />
                    <span className="text-[10px] text-slate-500">Convenio: {patient?.convenio || "Sin convenio"}</span>
                  </td>
                  <td className="py-2.5 text-right font-extrabold text-slate-900">
                    ${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-end pt-1 text-xs font-bold">
              <span>Total: <b className="text-sm font-black ml-4 text-slate-900">${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</b></span>
            </div>
          </div>

          {/* TABLA 2: TRANSACCIONES */}
          <div className="space-y-2 mt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-1 text-slate-900">
              Transacciones
            </h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 font-bold text-slate-700">
                  <th className="py-2">Nº Transacción</th>
                  <th className="py-2">Factura/Boleta</th>
                  <th className="py-2">Medio de pago</th>
                  <th className="py-2">Fecha Vencimiento</th>
                  <th className="py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                <tr>
                  <td className="py-2.5 font-bold text-[#008bcd]">{cleanReceiptNum}</td>
                  <td className="py-2.5">{invoiceNum}</td>
                  <td className="py-2.5 font-semibold">
                    {methodSpanish} {refCode && <span className="text-[10px] text-slate-500">({refCode})</span>}
                  </td>
                  <td className="py-2.5">{format(new Date(dueDate), "dd/MM/yyyy")}</td>
                  <td className="py-2.5 text-right font-extrabold text-slate-900">
                    ${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-end pt-1 text-xs font-bold border-t border-slate-200">
              <span>Total Recibido: <b className="text-sm font-black ml-4 text-slate-900">${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</b></span>
            </div>
          </div>

          {/* TABLA 3: DETALLE DE PRESTACIONES ABONADAS (COMO LA 2DA IMAGEN DE REFERENCIA) */}
          {detailedItems.length > 0 && (
            <div className="space-y-2 mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-1 text-slate-900">
                Detalle de prestaciones abonadas
              </h3>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-300 font-bold text-slate-700">
                    <th className="py-2">Pieza</th>
                    <th className="py-2">Prestación / Procedimiento</th>
                    <th className="py-2 text-right">Abonado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {detailedItems.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 font-bold text-slate-700">{item.tooth || item.toothNumber || "General"}</td>
                      <td className="py-2 font-semibold text-slate-900">{item.procedureName || item.name || item.description || "Consulta / Procedimiento"}</td>
                      <td className="py-2 text-right font-extrabold text-slate-900">
                        ${Number(item.appliedAmount || item.applied || item.cost || rawAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}