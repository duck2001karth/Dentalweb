"use client"

import React from "react"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface ExportBillingMenuProps {
  payments: any[]
}

export function ExportBillingMenu({ payments = [] }: ExportBillingMenuProps) {
  const { toast } = useToast()

  const exportToCSV = () => {
    if (payments.length === 0) {
      return toast({
        title: "Sin datos",
        description: "No hay registros disponibles para exportar.",
        variant: "destructive"
      })
    }

    const headers = "Fecha,Hora,Recibo,Paciente,CI,Metodo,Estado,Monto\n"
    
    const rows = payments.map(p => {
      const date = format(new Date(p.createdAt), "dd/MM/yyyy")
      const time = format(new Date(p.createdAt), "HH:mm")
      const patient = `${p.patient?.firstName || ''} ${p.patient?.lastName || ''}`.trim()
      const ci = p.patient?.ci || ''
      return `${date},${time},${p.receiptNumber || ''},"${patient}",${ci},${p.method},${p.status},${p.amount}`
    }).join("\n")

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `Arqueo_Caja_${format(new Date(), "dd-MM-yyyy")}.csv`
    link.click()
  }
  const exportToPDF = () => {
    if (payments.length === 0) {
      return toast({
        title: "Sin datos",
        description: "No hay registros para generar el informe PDF.",
        variant: "destructive"
      })
    }
    window.print()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-11 px-4 rounded-xl text-[#008bcd] border-[#008bcd]/30 hover:bg-[#008bcd]/10 font-bold text-[13px] shrink-0 cursor-pointer shadow-none focus:ring-0 focus:outline-none transition-colors"
        >
          <Download className="w-4 h-4 mr-2" /> Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-xl border-border">
        <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer text-[13px] font-bold py-2.5 rounded-lg focus:bg-emerald-50 focus:text-emerald-700 dark:focus:bg-emerald-500/10">
          <FileSpreadsheet className="w-4 h-4 mr-2.5 text-emerald-600" /> Exportar a Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer text-[13px] font-bold py-2.5 rounded-lg focus:bg-rose-50 focus:text-rose-700 dark:focus:bg-rose-500/10">
          <FileText className="w-4 h-4 mr-2.5 text-rose-600" /> Imprimir / PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}