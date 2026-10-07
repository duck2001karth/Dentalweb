"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Printer, FileText, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useClinicSettings } from "@/config/clinic-settings"
import { executePrintEngine } from "@/lib/print-engine" // Importamos tu motor

const formatPaymentMethod = (method?: string) => {
  if (!method) return "Efectivo"
  const m = method.toUpperCase()
  switch (m) {
    case "CASH": case "EFECTIVO": return "Efectivo"
    case "CREDIT_CARD": case "TARJETA_CREDITO": case "TARJETA": return "Tarjeta de Crédito"
    case "DEBIT_CARD": case "TARJETA_DEBITO": return "Tarjeta de Débito"
    case "TRANSFER": case "TRANSFERENCIA": case "DEUNA": return "Transferencia Bancaria"
    case "CHECK": case "CHEQUE": return "Cheque"
    default: return method
  }
}

interface DailyReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  payment: any
  patient?: any
  allPaymentsOfDay?: any[]
}

export function DailyReceiptModal({
  isOpen,
  onClose,
  payment,
  patient,
  allPaymentsOfDay = [],
}: DailyReceiptModalProps) {
  const { settings } = useClinicSettings()
  if (!payment) return null

  const currencySymbol = (settings?.currency || "USD").trim() + " "
  const transactionDate = new Date()
  const dayPayments = allPaymentsOfDay.length > 0 ? allPaymentsOfDay : [payment]

  const totalCash = dayPayments.filter((p: any) => p.method === "CASH" || p.method === "EFECTIVO").reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
  const totalCard = dayPayments.filter((p: any) => p.method?.includes("CARD") || p.method?.includes("TARJETA")).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
  const totalTransfer = dayPayments.filter((p: any) => p.method === "TRANSFER" || p.method === "TRANSFERENCIA" || p.method === "DEUNA").reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
  const totalDay = dayPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

  const handlePrint = () => {
    const kpiHtml = `
      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <div style="flex: 1; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Efectivo</div>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 4px;">${currencySymbol}${totalCash.toFixed(2)}</div>
        </div>
        <div style="flex: 1; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Tarjetas</div>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 4px;">${currencySymbol}${totalCard.toFixed(2)}</div>
        </div>
        <div style="flex: 1; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Transferencias</div>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 4px;">${currencySymbol}${totalTransfer.toFixed(2)}</div>
        </div>
        <div style="flex: 1; padding: 14px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;">
          <div style="font-size: 9px; font-weight: 700; color: #0284c7; text-transform: uppercase;">Total Recaudado</div>
          <div style="font-size: 16px; font-weight: 900; color: #0284c7; margin-top: 4px;">${currencySymbol}${totalDay.toFixed(2)}</div>
        </div>
      </div>
    `

    // 2. Construir la tabla de cobros
    const tableRows = dayPayments.map((item: any) => {
      const patientName = item.patient ? `${item.patient.firstName || ''} ${item.patient.lastName || ''}`.trim() : (patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : "Paciente registrado")
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #008bcd;">${item.receiptNumber || `#REC-${item.id?.slice(-6)}`}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #475569;">${format(new Date(item.createdAt || new Date()), "HH:mm")}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #1e293b;">${patientName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #475569;">${formatPaymentMethod(item.method || item.paymentMethod)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 900; color: #1e293b;">${currencySymbol}${Number(item.amount || 0).toFixed(2)}</td>
        </tr>
      `
    }).join("")

    const tableHtml = `
      <h3 style="font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; border-bottom: 2px solid #0f172a; padding-bottom: 4px; margin-bottom: 12px;">
        Detalle de Cobros Registrados
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; text-align: left;">
        <thead>
          <tr style="background: #f1f5f9; color: #334155; text-transform: uppercase; font-size: 9px;">
            <th style="padding: 8px; border-bottom: 1px solid #cbd5e1;"># Recibo</th>
            <th style="padding: 8px; border-bottom: 1px solid #cbd5e1;">Hora</th>
            <th style="padding: 8px; border-bottom: 1px solid #cbd5e1;">Paciente</th>
            <th style="padding: 8px; border-bottom: 1px solid #cbd5e1;">Medio</th>
            <th style="padding: 8px; border-bottom: 1px solid #cbd5e1; text-align: right;">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `

    executePrintEngine({
      title: "Cierre y Arqueo Diario",
      documentTypeBadge: "ARQUEO DE CAJA",
      settings,
      bodyHtml: kpiHtml + tableHtml,
      showSignature: false 
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border p-6 rounded-2xl">
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-[#008bcd]/10 flex items-center justify-center text-[#008bcd]">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <DialogTitle className="text-xl font-black text-foreground">
              Comprobante Diario de Caja
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Día operativo: {format(transactionDate, "dd/MM/yyyy")}
            </p>
          </div>
        </div>

        <div className="bg-muted/30 border border-border rounded-xl p-5 mb-6 text-sm flex justify-between items-center">
          <div>
            <p className="font-bold text-foreground">Total de cobros registrados:</p>
            <p className="text-muted-foreground">{dayPayments.length} transacciones en la jornada.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-[#008bcd] tracking-wider">Recaudación Total</p>
            <p className="text-2xl font-black text-[#008bcd]">{currencySymbol}{totalDay.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="rounded-xl h-11 px-6 font-bold">
            Cancelar
          </Button>
          <Button onClick={handlePrint} className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl h-11 px-6 shadow-sm font-bold">
            <Printer className="w-4 h-4 mr-2" /> Imprimir Cierre
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}