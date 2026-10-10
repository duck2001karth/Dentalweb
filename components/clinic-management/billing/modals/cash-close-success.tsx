"use client"

import React from "react"
import { CheckCircle2, AlertTriangle, Printer, ArrowRight } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface CashCloseSummaryData {
  expectedCash: number
  countedCash: number
  difference: number
  status: "BALANCED" | "SURPLUS" | "DEFICIT"
}

interface CashCloseSuccessDialogProps {
  isOpen: boolean
  onClose: () => void
  summaryData: CashCloseSummaryData | null
  onPrintArqueo: () => void
}

export function CashCloseSuccessDialog({
  isOpen,
  onClose,
  summaryData,
  onPrintArqueo,
}: CashCloseSuccessDialogProps) {
  if (!summaryData) return null

  const isBalanced = Math.abs(summaryData.difference) < 0.01

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-[500px] w-[95vw] bg-card border border-border/80 rounded-[24px] p-6 shadow-2xl">
        <AlertDialogHeader className="flex flex-col items-center text-center space-y-2">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xs mb-2 ${
              isBalanced
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
            }`}
          >
            {isBalanced ? (
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            ) : (
              <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
            )}
          </div>

          {/* Radix necesita Title y Description como hijos directos del Header para resolver M_ID */}
          <AlertDialogTitle className="text-lg font-black tracking-tight text-foreground">
            {isBalanced ? "Arqueo de Caja Finalizado con Éxito" : "Cierre de Caja Registrado con Observación"}
          </AlertDialogTitle>
          
          <AlertDialogDescription className="text-xs text-muted-foreground">
            El turno actual ha quedado registrado y la bitácora de auditoría ha sido actualizada correctamente.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Resumen contable rápido */}
        <div className="bg-muted/15 border border-border/70 rounded-2xl p-4 my-4 space-y-2 text-xs">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Efectivo Teórico (Sistema):</span>
            <span className="font-mono font-bold text-foreground">
              ${summaryData.expectedCash.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Efectivo Físico Contado:</span>
            <span className="font-mono font-bold text-foreground">
              ${summaryData.countedCash.toFixed(2)}
            </span>
          </div>
          <div className="border-t border-border/50 pt-2 flex justify-between items-center font-bold">
            <span>Resultado:</span>
            <span
              className={`font-mono ${
                isBalanced
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isBalanced
                ? "Caja Cuadrada ($0.00)"
                : summaryData.difference > 0
                ? `+$${summaryData.difference.toFixed(2)} (Sobrante)`
                : `-$${Math.abs(summaryData.difference).toFixed(2)} (Faltante)`}
            </span>
          </div>
        </div>

        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2.5 sm:justify-between items-center w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onPrintArqueo}
            className="w-full sm:w-auto h-10 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border-border hover:bg-muted"
          >
            <Printer className="w-4 h-4 text-[#008bcd]" />
            Imprimir Reporte de Arqueo
          </Button>

          <Button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-10 px-5 rounded-xl text-xs font-bold bg-[#008bcd] hover:bg-[#0073ab] text-white flex items-center justify-center gap-2"
          >
            Aceptar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default CashCloseSuccessDialog