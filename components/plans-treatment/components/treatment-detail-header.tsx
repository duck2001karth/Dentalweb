"use client"

import React from "react"
import { ChevronLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TreatmentActions } from "./treatment-actions"

interface TreatmentDetailHeaderProps {
  planId: string
  patient: any
  onBack: () => void
  onRefreshData?: () => void
  isRefreshing?: boolean
  onClearPlan?: () => void
  onPrintPDF?: () => void
}

export function TreatmentDetailHeader({
  planId,
  patient,
  onBack,
  onRefreshData,
  isRefreshing = false,
  onClearPlan,
  onPrintPDF,
}: TreatmentDetailHeaderProps) {
  const patientFullName = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Paciente"

  return (
    <div className="flex items-center justify-between pb-4 border-b border-border/80">
      <div className="flex items-center gap-4">
        <Button 
          type="button"
          variant="outline" 
          size="icon" 
          onClick={onBack} 
          className="h-10 w-10 rounded-xl border-border/80 bg-background hover:bg-muted text-foreground transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
          title="Regresar a la lista de planes"
        >
          <ChevronLeft className="h-5 w-5 stroke-[2.2]" />
        </Button>
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            Plan de Tratamiento <span className="text-[#008bcd] font-mono font-bold">#{planId?.slice(-6)?.toUpperCase()}</span>
          </h2>
          <p className="text-xs md:text-sm font-semibold text-muted-foreground mt-0.5">
            Paciente: <span className="text-foreground font-bold">{patientFullName}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {onRefreshData && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="h-10 w-10 rounded-xl border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer shadow-xs"
            title="Actualizar datos del plan"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-[#008bcd]" : ""}`} />
          </Button>
        )}

        <TreatmentActions 
          planId={planId}
          onClearPlan={onClearPlan}
          onPrintPDF={onPrintPDF}
        />
      </div>
    </div>
  )
}

export default TreatmentDetailHeader