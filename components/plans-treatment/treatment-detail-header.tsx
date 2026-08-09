"use client"

import React from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TreatmentDetailHeaderProps {
  planId: string
  patient: any
  onBack: () => void
  onRefreshData?: () => void
}

export function TreatmentDetailHeader({
  planId,
  patient,
  onBack
}: TreatmentDetailHeaderProps) {
  return (
    <div className="flex items-center gap-4 pb-4 border-b border-border/80">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onBack} 
        className="h-10 w-10 rounded-xl border-border/80 bg-background hover:bg-muted text-foreground transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
      >
        <ChevronLeft className="h-5 w-5 stroke-[2.2]" />
      </Button>
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-normal flex items-center gap-2.5">
          Plan de tratamiento <span className="text-[#008bcd] font-bold">#{planId?.slice(-6)?.toUpperCase()}</span>
        </h2>
        <p className="text-sm font-semibold text-muted-foreground mt-0.5">
          Paciente: <span className="text-foreground font-bold">{patient?.firstName} {patient?.lastName}</span>
        </p>
      </div>
    </div>
  )
}