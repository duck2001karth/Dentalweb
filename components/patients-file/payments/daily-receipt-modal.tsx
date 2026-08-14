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

// 📍 1. Declarar la función helper ARRIBA del componente
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

// 📍 2. Interface con 'patient' declarado explícitamente
interface DailyReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  payment: any
  patient?: any
  allPaymentsOfDay?: any[]
  clinicInfo?: any
}

export function DailyReceiptModal({
  isOpen,
  onClose,
  payment,
  patient, // 👈 Ya está recibido como prop
  allPaymentsOfDay = [],
  clinicInfo,
}: DailyReceiptModalProps) {
  if (!payment) return null

  // DATOS REALES CLÍNICA
  const clinicName = clinicInfo?.clinicName || "CARMO DENTAL"
  const clinicAddress = clinicInfo?.address || "Av. Principal #123 - Centro Médico"
  const clinicPhone = clinicInfo?.phone || "Teléfono: +593 99 999 9999"
  const logoUrl = clinicInfo?.logoUrl || "/logo.png"

  const transactionDate = payment.createdAt ? new Date(payment.createdAt) : new Date()

  // Pagos del día
  const dayPayments = allPaymentsOfDay.length > 0 ? allPaymentsOfDay : [payment]
  
  const totalCash = dayPayments
    .filter((p: any) => p.method === "CASH" || p.method === "EFECTIVO")
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

  const totalCard = dayPayments
    .filter((p: any) => p.method?.includes("CARD") || p.method?.includes("TARJETA"))
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

  const totalTransfer = dayPayments
    .filter((p: any) => p.method === "TRANSFER" || p.method === "TRANSFERENCIA")
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

  const totalDay = dayPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[880px] bg-muted/30 border-border p-0 overflow-hidden rounded-2xl [&>button]:hidden font-sans antialiased">
        
        {/* CABECERA (NO SE IMPRIME) */}
        <div className="bg-background px-6 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
          <div>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#008bcd]" />
              Comprobante Diario de Caja — {format(transactionDate, "dd/MM/yyyy")}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Resumen consolidado de ingresos de la jornada.</p>
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
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ESTILOS DE IMPRESIÓN */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { margin: 8mm 10mm; size: A4 portrait; }
            body { background: white !important; color: black !important; }
            body * { visibility: hidden !important; }
            .no-print, .no-print * { display: none !important; }
            #area-imprimible-diario, #area-imprimible-diario * { visibility: visible !important; }
            #area-imprimible-diario {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
            }
          }
        `}} />

        {/* CONTENEDOR PRINCIPAL */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[82vh] custom-scrollbar flex justify-center bg-slate-100 dark:bg-slate-900/50">
          <div 
            id="area-imprimible-diario" 
            className="bg-white p-8 text-slate-900 w-full max-w-[210mm] shadow-lg border border-slate-300 rounded-sm font-sans"
          >
            {/* CABECERA */}
            <div className="flex justify-between items-center border-b-2 border-slate-800 pb-5 mb-5">
              <div className="flex items-center gap-4">
                <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain" />
                <div>
                  <h1 className="text-2xl font-black text-[#008bcd] uppercase">{clinicName}</h1>
                  <h2 className="text-xs font-bold text-slate-500 uppercase mt-1">Cierre y Arqueo Diario de Caja</h2>
                </div>
              </div>
              <div className="text-right text-xs font-semibold text-slate-600">
                <p className="text-slate-900 font-bold">{clinicAddress}</p>
                <p>{clinicPhone}</p>
                <p className="text-[#008bcd] font-bold">
                  FECHA: {format(transactionDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>

            {/* RESUMEN POR MÉTODOS DE PAGO */}
            <div className="grid grid-cols-4 gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Efectivo</p>
                <p className="text-sm font-extrabold text-slate-900">${totalCash.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Tarjetas</p>
                <p className="text-sm font-extrabold text-slate-900">${totalCard.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Transferencias</p>
                <p className="text-sm font-extrabold text-slate-900">${totalTransfer.toFixed(2)}</p>
              </div>
              <div className="border-l border-slate-300 pl-3">
                <p className="text-[10px] font-bold text-[#008bcd] uppercase">Total Recaudado</p>
                <p className="text-base font-black text-[#008bcd]">${totalDay.toFixed(2)}</p>
              </div>
            </div>

            {/* TABLA DE COBROS */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider border-b-2 border-slate-800 pb-1 text-slate-900">
                Detalle de Cobros Registrados
              </h3>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-100 font-bold text-slate-700">
                    <th className="py-2 px-2"># Recibo</th>
                    <th className="py-2 px-2">Hora</th>
                    <th className="py-2 px-2">Paciente</th>
                    <th className="py-2 px-2">Medio</th>
                    <th className="py-2 px-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {dayPayments.map((item: any, idx: number) => {
                    // Lógica segura para obtener el nombre del paciente
                    const itemPatientName = item.patient
                      ? `${item.patient.firstName || ''} ${item.patient.lastName || ''}`.trim()
                      : (patient 
                          ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
                          : "Paciente registrado")

                    return (
                      <tr key={idx}>
                        <td className="py-2.5 px-2 font-bold text-[#008bcd]">
                          {item.receiptNumber || `#REC-${item.id?.slice(-6)}`}
                        </td>
                        <td className="py-2.5 px-2">
                          {format(new Date(item.createdAt || new Date()), "HH:mm")}
                        </td>
                        <td className="py-2.5 px-2 font-bold text-slate-900">
                          {itemPatientName}
                        </td>
                        <td className="py-2.5 px-2">
                          {formatPaymentMethod(item.method || item.paymentMethod)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-black">
                          ${Number(item.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* PIE DE PÁGINA */}
            <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Documento de Cierre Contable Interno — Carmo Dental
            </div>

          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}