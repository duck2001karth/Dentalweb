"use client"

import React from "react"
import { Printer, Trash2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface TreatmentActionsProps {
  planId: string
  onClearPlan?: () => void
  onPrintPDF?: () => void
}

export function TreatmentActions({ 
  planId, 
  onClearPlan,
  onPrintPDF 
}: TreatmentActionsProps) {
  const handlePrint = () => {
    if (onPrintPDF) {
      onPrintPDF()
      return
    }
    window.print()
  }

  return (
    <div className="flex items-center gap-2.5 font-sans antialiased">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            className="h-10 px-4 bg-background border-border/80 hover:bg-muted text-foreground font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Acciones <ChevronDown className="w-4 h-4 ml-1.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 p-1.5 border-border/80 bg-card shadow-xl rounded-2xl text-xs font-semibold">
          <DropdownMenuItem 
            onClick={handlePrint}
            className="cursor-pointer py-2.5 rounded-xl text-foreground hover:bg-muted font-bold flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-[#008bcd]" /> Imprimir Presupuesto
          </DropdownMenuItem>
          {onClearPlan && (
            <>
              <DropdownMenuSeparator className="my-1 bg-border/60" />
              <DropdownMenuItem 
                onClick={onClearPlan}
                className="cursor-pointer py-2.5 rounded-xl text-red-600 focus:bg-red-500/10 focus:text-red-600 font-bold flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-red-500" /> Vaciar Presupuesto
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default TreatmentActions