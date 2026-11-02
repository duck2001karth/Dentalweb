
"use client"

import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { format, isValid } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useClinicSettings } from "@/config/clinic-settings"
import {
  printArqueoReport,
  type ArqueoPayment,
} from "./print-arqueo-template"

interface ExportBillingMenuProps {
  payments: ArqueoPayment[]
}

const csv = (value: unknown) => {
  const text = String(value ?? "")
  const protectedText = /^[\s\u0000-\u001f]*[=+\-@]/u.test(text)
    ? `'${text}`
    : text
  return `"${protectedText.replace(/"/g, '""')}"`
}

export function ExportBillingMenu({
  payments = [],
}: ExportBillingMenuProps) {
  const { toast } = useToast()
  const { settings } = useClinicSettings()

  const exportToCSV = () => {
    if (payments.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay registros disponibles para exportar.",
        variant: "destructive",
      })
      return
    }

    const headers = "Fecha,Hora,Recibo,Paciente,CI,Metodo,Estado,Monto"

    const rows = payments.map(p => {
      const date = new Date(p.createdAt)
      const valid = isValid(date)
      const patient = `${p.patient?.firstName || ""} ${p.patient?.lastName || ""}`.trim()

      return [
        valid ? format(date, "dd/MM/yyyy") : "",
        valid ? format(date, "HH:mm") : "",
        p.receiptNumber || "",
        patient,
        p.patient?.ci || "",
        p.method,
        p.status || "",
        p.amount,
      ].map(csv).join(",")
    }).join("\r\n")

    const blob = new Blob(
      ["\uFEFF", headers, "\r\n", rows],
      { type: "text/csv;charset=utf-8;" }
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Arqueo_Caja_${format(new Date(), "dd-MM-yyyy")}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const exportToPDF = () => {
    if (payments.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay registros para generar el informe PDF.",
        variant: "destructive",
      })
      return
    }

    try {
      printArqueoReport({
        payments,
        dateFilter: "Historial",
        cashierName: "Cajero de Turno",
        settings,
      })
    } catch (error) {
      console.error("Error al imprimir arqueo:", error)
      toast({
        title: "Error de impresión",
        description: "No se pudo preparar el informe.",
        variant: "destructive",
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 px-4 rounded-xl text-[#008bcd] border-[#008bcd]/30 hover:bg-[#008bcd]/10 bg-card font-bold text-xs shrink-0 cursor-pointer shadow-none focus:ring-0 focus:outline-none transition-colors"
        >
          <Download className="w-4 h-4 mr-2" /> Exportar
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-52 rounded-xl p-1.5 shadow-xl border-border print:hidden"
      >
        <DropdownMenuItem
          onClick={exportToCSV}
          className="cursor-pointer text-xs font-bold py-2.5 rounded-lg focus:bg-emerald-50 focus:text-emerald-700 dark:focus:bg-emerald-500/10"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2.5 text-emerald-600" />
          Exportar a Excel (CSV)
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={exportToPDF}
          className="cursor-pointer text-xs font-bold py-2.5 rounded-lg focus:bg-rose-50 focus:text-rose-700 dark:focus:bg-rose-500/10"
        >
          <FileText className="w-4 h-4 mr-2.5 text-rose-600" />
          Imprimir / PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
