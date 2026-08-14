"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Printer, FileText, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

interface PaymentReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  payment: any
  patient: any
  clinicInfo?: any
}

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
      return "Transferencia Bancaria"
    case "CHECK":
    case "CHEQUE":
      return "Cheque"
    default:
      return method
  }
}

export function PaymentReceiptModal({
  isOpen,
  onClose,
  payment,
  patient,
  clinicInfo,
}: PaymentReceiptModalProps) {
  if (!payment) return null

  const clinicName = clinicInfo?.clinicName || "CARMO DENTAL"
  const clinicAddress = clinicInfo?.address || "Solanda Sector 4, José Argudo S24-72 y Av. Solanda"
  const clinicPhone = clinicInfo?.phone || "Teléfono: +593 0998990215"
  const logoUrl = clinicInfo?.logoUrl || "/logosn.png"

  const patientName = patient 
    ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
    : payment?.patientName || "Paciente registrado"
  const patientCi = patient?.ci || payment?.patientCi || payment?.patientIdNum || "S/I"

  const receiptNum = payment.paymentNumber || payment.receiptNumber || `#REC-${payment.id?.slice(-6)}`
  const cleanReceiptNum = receiptNum.replace(/^#+/, "#")
  
  const treatmentName = payment.treatmentPlan?.name || payment.treatmentName || "Tratamiento Odontológico"
  const rawAmount = Number(payment.amount || payment.paidAmount || 0)
  const methodSpanish = formatPaymentMethod(payment.method || payment.paymentMethod)
  const invoiceNum = payment.invoiceNumber || payment.receiptNumberFiscal || "-"
  const refCode = payment.reference ? `Ref: ${payment.reference}` : ""

  const receiptDate = payment.createdAt || payment.receiptDate || new Date()
  const dueDate = payment.dueDate || receiptDate

  let detailedItems: any[] = []
  if (payment.notes) {
    try {
      const parsedNotes = JSON.parse(payment.notes)
      if (Array.isArray(parsedNotes)) detailedItems = parsedNotes
    } catch (e) {
      // Ignorar si no es JSON
    }
  }
  if (detailedItems.length === 0) {
    detailedItems = payment.itemsPaid || payment.treatmentPlan?.items || []
  }
  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[880px] bg-muted/30 border-border p-0 overflow-hidden rounded-2xl [&>button]:hidden font-sans antialiased">
        
        {/* CABECERA (SE OCULTA AL IMPRIMIR) */}
        <div className="bg-background px-6 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
          <div>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#008bcd]" />
              Vista Previa de Comprobante {cleanReceiptNum}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Revisa el formato antes de mandarlo a la impresora física.</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              className="bg-[#008bcd] hover:bg-[#0070a8] text-white shadow-xs font-bold w-full sm:w-auto rounded-xl h-10 px-4 cursor-pointer" 
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 mr-2" /> Mandar a Impresora
            </Button>

            <Button 
              variant="outline" 
              onClick={onClose} 
              className="rounded-xl h-10 w-10 p-0 cursor-pointer border-border hover:bg-muted"
              title="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* --- ESTILOS DE IMPRESIÓN --- */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { 
              margin: 8mm 10mm; 
              size: A4 portrait; 
            }
            
            body { 
              background: white !important; 
              color: black !important;
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            body * { 
              visibility: hidden !important; 
            }
            
            .no-print, .no-print * { 
              display: none !important; 
            }

            #area-imprimible, #area-imprimible * { 
              visibility: visible !important; 
            }
            #area-imprimible {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
              color: black !important;
              overflow: visible !important;
            }

            .print-row { page-break-inside: avoid; }
          }
        `}} />
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[82vh] custom-scrollbar flex justify-center bg-slate-100 dark:bg-slate-900/50">
          <div 
            id="area-imprimible" 
            className="relative bg-white p-8 text-slate-900 w-full max-w-[210mm] shadow-lg border border-slate-300 rounded-sm font-sans overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
              <img 
                src={logoUrl} 
                alt="Watermark Carmo Dental" 
                className="w-[420px] h-[420px] object-contain opacity-[0.06] grayscale-0 print:opacity-[0.08]"
              />
            </div>

            {/* CONTENIDO PRINCIPAL POR ENCIMA DE LA MARCA DE AGUA */}
            <div className="relative z-10">
              
              {/* CABECERA: LOGO MÁS GRANDE (24x24 / 96px) Y DATOS DE LA CLÍNICA */}
              <div className="flex justify-between items-center border-b-2 border-slate-800 pb-5 mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                    <img 
                      src={logoUrl} 
                      alt="Logo Carmo Dental" 
                      className="w-40 h-40 object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black tracking-tighter text-[#008bcd] uppercase leading-none">
                      {clinicName}
                    </h1>
                    <h2 className="text-xs font-bold text-slate-500 tracking-widest uppercase mt-1.5">
                      Especialidades Odontológicas
                    </h2>
                  </div>
                </div>

                <div className="text-right text-xs font-semibold text-slate-600 space-y-0.5">
                  <p className="text-slate-900 font-bold">{clinicAddress}</p>
                  <p>{clinicPhone}</p>
                  <p className="text-[#008bcd] font-bold">Quito - Ecuador</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase">
                    EMISIÓN: {format(new Date(), "dd/MM/yyyy • HH:mm")}
                  </p>
                </div>
              </div>

              {/* DATOS DEL PACIENTE (FORMATO ECUADOR C.I.) */}
              <div className="py-2 space-y-1 mb-5">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Comprobante de Pago</h2>
                <p className="text-xs font-medium text-slate-700">
                  Paciente: <span className="font-extrabold text-slate-900">{patientName}</span> &nbsp;•&nbsp; C.I.: <span className="font-extrabold text-slate-900">{patientCi}</span>
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Transacción registrada el {format(new Date(receiptDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>

              {/* SECCIÓN 1: CARGOS A ABONAR */}
              <div className="space-y-2 mt-4 print-row">
                <h3 className="text-xs font-black uppercase tracking-wider border-b-2 border-slate-800 pb-1 text-slate-900">
                  Cargos a abonar
                </h3>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50 font-bold text-slate-700">
                      <th className="py-2 px-2">Nº Ref</th>
                      <th className="py-2 px-2">Descripción</th>
                      <th className="py-2 px-2 text-right">Abono</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    <tr>
                      <td className="py-2.5 px-2 font-bold text-[#008bcd]">{cleanReceiptNum}</td>
                      <td className="py-2.5 px-2">
                        Tratamiento: <span className="font-bold text-slate-900">{treatmentName}</span>
                        <br />
                        <span className="text-[10px] text-slate-500">Convenio: {patient?.convenio || "Sin convenio"}</span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-extrabold text-slate-900">
                        ${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex justify-end pt-1 text-xs font-bold">
                  <span>Total: <b className="text-base font-black ml-4 text-slate-900">${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</b></span>
                </div>
              </div>

              {/* SECCIÓN 2: TRANSACCIONES */}
              <div className="space-y-2 mt-5 print-row">
                <h3 className="text-xs font-black uppercase tracking-wider border-b-2 border-slate-800 pb-1 text-slate-900">
                  Transacciones
                </h3>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50 font-bold text-slate-700">
                      <th className="py-2 px-2">Nº Transacción</th>
                      <th className="py-2 px-2">Factura / Boleta</th>
                      <th className="py-2 px-2">Medio de Pago</th>
                      <th className="py-2 px-2">Fecha Vencimiento</th>
                      <th className="py-2 px-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    <tr>
                      <td className="py-2.5 px-2 font-bold text-[#008bcd]">{cleanReceiptNum}</td>
                      <td className="py-2.5 px-2">{invoiceNum}</td>
                      <td className="py-2.5 px-2 font-semibold">
                        {methodSpanish} {refCode && <span className="text-[10px] text-slate-500">({refCode})</span>}
                      </td>
                      <td className="py-2.5 px-2">{format(new Date(dueDate), "dd/MM/yyyy")}</td>
                      <td className="py-2.5 px-2 text-right font-extrabold text-slate-900">
                        ${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex justify-end pt-1 text-xs font-bold border-t border-slate-300">
                  <span>Total Recibido: <b className="text-base font-black ml-4 text-slate-900">${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</b></span>
                </div>
              </div>

              {/* SECCIÓN 3: DETALLE DE PRESTACIONES ABONADAS */}
              {detailedItems.length > 0 && (
                <div className="space-y-2 mt-5 print-row">
                  <h3 className="text-xs font-black uppercase tracking-wider border-b-2 border-slate-800 pb-1 text-slate-900">
                    Detalle de prestaciones abonadas
                  </h3>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-300 bg-slate-50 font-bold text-slate-700">
                        <th className="py-2 px-2">Pieza</th>
                        <th className="py-2 px-2">Prestación / Procedimiento</th>
                        <th className="py-2 px-2 text-right">Abonado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {detailedItems.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-2 font-bold text-slate-700">{item.tooth || item.toothNumber || "General"}</td>
                          <td className="py-2 px-2 font-semibold text-slate-900">{item.procedureName || item.name || item.description || "Consulta / Procedimiento"}</td>
                          <td className="py-2 px-2 text-right font-extrabold text-slate-900">
                            ${Number(item.appliedAmount || item.applied || item.cost || rawAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PIE DE PÁGINA LIMPIO */}
              <div className="mt-10 pt-4 border-t border-slate-200 text-center flex flex-col items-center print-row">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                  Comprobante de pago emitido por Carmo Dental. <br/> Gracias por su preferencia.
                </p>
              </div>

            </div>

          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}