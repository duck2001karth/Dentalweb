"use client"

import React from "react"
import { RotateCcw } from "lucide-react"
import { PaymentsTable } from "./tab-payments"

interface RefundsViewProps {
  refunds: any[]
  patient: any
  onRefresh: () => void
}

export function RefundsView({ refunds = [], patient, onRefresh }: RefundsViewProps) {
  if (!refunds || refunds.length === 0) {
    return (
      <div className="p-12 text-center text-sm font-medium text-muted-foreground bg-card border border-border/80 rounded-2xl">
        <RotateCcw className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        No hay devoluciones ni notas de crédito registradas para este paciente.
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans antialiased">
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-amber-500" /> Historial de Devoluciones y Notas de Crédito
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Registro de ajustes a favor del paciente, devoluciones y saldos reabiertos.
        </p>
      </div>

      <PaymentsTable 
        paymentsList={refunds} 
        patient={patient} 
        onRefresh={onRefresh} 
      />
    </div>
  )
}