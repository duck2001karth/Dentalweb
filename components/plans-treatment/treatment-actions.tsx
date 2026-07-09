"use client"

import React from "react"
import { Printer, Mail, Trash2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface TreatmentActionsProps {
  planId: string;
  patientEmail?: string;
  onClearPlan: () => void;
}

export function TreatmentActions({ planId, patientEmail, onClearPlan }: TreatmentActionsProps) {
  const { toast } = useToast()

  const handlePrint = () => {
    // Aquí puedes redirigir a una página de impresión específica
    // Ej: window.open(`/imprimir/presupuesto/${planId}`, '_blank');
    window.print()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white dark:bg-card hover:bg-slate-50 transition-colors">
          Acciones <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-1 border-border shadow-lg rounded-xl">
        <DropdownMenuItem onClick={handlePrint} className="cursor-pointer py-2.5 rounded-lg font-medium">
          <Printer className="w-4 h-4 mr-2 text-slate-500" /> Imprimir Presupuesto
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-1 bg-border/50" />
        
        <DropdownMenuItem onClick={onClearPlan} className="cursor-pointer py-2.5 rounded-lg text-red-600 focus:bg-red-50 focus:text-red-700 font-bold">
          <Trash2 className="w-4 h-4 mr-2" /> Vaciar Presupuesto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}