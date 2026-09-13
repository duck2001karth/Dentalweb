"use client"

import React, { useState } from "react"
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { InventoryItem, InventoryMovement } from "./inventory-tab"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface InventoryExportProps {
  activeTab: "PRODUCTS" | "MOVEMENTS"
  items: InventoryItem[]
  movements: InventoryMovement[]
  clinicSettings?: {
    name?: string
    razonSocial?: string
    ruc?: string
    address?: string
  }
}

export function InventoryExportMenu({
  activeTab,
  items,
  movements,
  clinicSettings,
}: InventoryExportProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const clinicTradeName = (clinicSettings?.name || "Clinica").trim()
  const clinicLegalName = (clinicSettings?.razonSocial || clinicTradeName).trim()
  const clinicRuc = (clinicSettings?.ruc || "").trim()
  const clinicAddress = (clinicSettings?.address || "").trim()
  const currentDate = format(new Date(), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })

  // ==========================================
  // 1. EXPORTACIÓN A EXCEL (.xlsx)
  // ==========================================
  const exportToExcel = async () => {
    setIsExporting(true)
    try {
      const workbook = XLSX.utils.book_new()
      const isProducts = activeTab === "PRODUCTS"
      const fileName = `Reporte_${isProducts ? "Inventario" : "Movimientos"}_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`

      if (isProducts) {
        const data = items.map((item) => ({
          "Clínica": clinicTradeName,
          "RUC": clinicRuc || "N/A",
          "Código SKU": item.sku || "N/A",
          "Producto": item.name,
          "Marca": item.marca || "S/M",
          "Presentación": item.presentacion || "S/P",
          "Stock Actual": item.stock,
          "Stock de Seguridad": item.minStock,
          "Costo Unitario ($)": Number(item.unitCost),
          "Valorización Total ($)": Number((item.stock * item.unitCost).toFixed(2)),
          "Estado de Stock":
            item.stock === 0
              ? "Agotado"
              : item.stock <= item.minStock
              ? "Bajo Stock"
              : "Óptimo",
        }))

        const worksheet = XLSX.utils.json_to_sheet(data)
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario Actual")
      } else {
        const data = movements.map((mov) => ({
          "Clínica": clinicTradeName,
          "Fecha": format(new Date(mov.createdAt), "dd/MM/yyyy HH:mm"),
          "Operación": mov.type === "INCOMING" ? "ENTRADA" : "SALIDA",
          "Insumo / Producto": mov.item?.name || "Insumo Desconocido",
          "Cantidad Afectada": mov.quantity,
          "Motivo / Documento / Solicitante": mov.reason || "Sin detalle registrado",
        }))

        const worksheet = XLSX.utils.json_to_sheet(data)
        XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos")
      }

      XLSX.writeFile(workbook, fileName)
      toast({
        title: "Excel exportado",
        description: `El archivo ${fileName} se descargó correctamente.`,
        variant: "success"
      })
    } catch (error) {
      console.error("Error al generar Excel:", error)
      toast({
        title: "Error de exportación",
        description: "No se pudo generar el archivo Excel.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // ==========================================
  // 2. EXPORTACIÓN A PDF CORPORATIVO
  // ==========================================
  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      const doc = new jsPDF()
      const isProducts = activeTab === "PRODUCTS"
      const title = isProducts
        ? "Reporte de Existencias - Inventario Clínico"
        : "Historial de Movimientos de Bodega"
      const fileName = `Reporte_${isProducts ? "Inventario" : "Movimientos"}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`

      doc.setFont("helvetica", "bold")
      doc.setFontSize(15)
      doc.setTextColor(0, 139, 205) 
      doc.text(clinicTradeName.toUpperCase(), 14, 18)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8.5)
      doc.setTextColor(80, 80, 80)
      doc.text(`Razón Social: ${clinicLegalName}`, 14, 23.5)
      if (clinicRuc) doc.text(`RUC: ${clinicRuc}`, 14, 28)
      if (clinicAddress) doc.text(`Dirección: ${clinicAddress}`, 14, 32.5)

      doc.setFontSize(8)
      doc.setTextColor(130, 130, 130)
      doc.text("Fecha de emisión:", 196, 18, { align: "right" })
      doc.setFont("helvetica", "bold")
      doc.setTextColor(40, 40, 40)
      doc.text(currentDate, 196, 23, { align: "right" })
      const headerEndY = clinicAddress ? 36 : 32
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.5)
      doc.line(14, headerEndY, 196, headerEndY)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42)
      doc.text(title, 14, headerEndY + 8)

      if (isProducts) {
        const tableBody = items.map((item) => [
          item.sku || "S/N",
          item.name,
          item.marca || "-",
          item.stock.toString(),
          item.minStock.toString(),
          `$${Number(item.unitCost).toFixed(2)}`,
          `$${Number(item.stock * item.unitCost).toFixed(2)}`,
        ])

        autoTable(doc, {
          startY: headerEndY + 13,
          head: [["SKU", "Producto", "Marca", "Stock", "Mínimo", "Costo", "Total"]],
          body: tableBody,
          theme: "grid",
          headStyles: {
            fillColor: [0, 139, 205],
            textColor: [255, 255, 255],
            fontSize: 8.5,
            fontStyle: "bold",
          },
          bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            0: { fontStyle: "bold" },
            3: { halign: "center", fontStyle: "bold" },
            4: { halign: "center" },
            5: { halign: "right" },
            6: { halign: "right", fontStyle: "bold" },
          },
        })
      } else {
        const tableBody = movements.map((mov) => [
          format(new Date(mov.createdAt), "dd/MM/yyyy HH:mm"),
          mov.type === "INCOMING" ? "ENTRADA" : "SALIDA",
          mov.item?.name || "Desconocido",
          mov.quantity.toString(),
          mov.reason || "Sin detalle",
        ])

        autoTable(doc, {
          startY: headerEndY + 13,
          head: [["Fecha y Hora", "Operación", "Insumo / Producto", "Cantidad", "Motivo / Justificación"]],
          body: tableBody,
          theme: "grid",
          headStyles: {
            fillColor: [0, 139, 205],
            textColor: [255, 255, 255],
            fontSize: 8.5,
            fontStyle: "bold",
          },
          bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          didParseCell: (data) => {
            if (data.section === "body" && data.column.index === 1) {
              if (data.cell.raw === "ENTRADA") data.cell.styles.textColor = [5, 150, 105] 
              if (data.cell.raw === "SALIDA") data.cell.styles.textColor = [225, 29, 72] 
              data.cell.styles.fontStyle = "bold"
            }
          },
          columnStyles: {
            0: { halign: "center" },
            1: { halign: "center" },
            3: { halign: "center", fontStyle: "bold" },
          },
        })
      }

      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: "right" })
        doc.text(`${clinicTradeName} - Documento Oficial de Control Interno`, 14, 285)
      }

      doc.save(fileName)
      toast({
        title: "PDF generado",
        description: "El reporte oficial se descargó correctamente.",
        variant: "success"
      })
    } catch (error) {
      console.error("Error al generar PDF:", error)
      toast({
        title: "Error de exportación",
        description: "No se pudo generar el archivo PDF.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isExporting}
          className="h-10 rounded-xl font-bold text-xs shadow-sm bg-card border-border/80 hover:bg-muted transition-all"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-1.5" />
          )}
          Exportar Reporte
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-border/80 p-1.5">
        <DropdownMenuItem
          onClick={exportToPDF}
          disabled={isExporting}
          className="cursor-pointer text-xs font-bold py-2.5 rounded-lg text-foreground hover:bg-muted"
        >
          <FileText className="w-4 h-4 mr-2 text-rose-600" /> Exportar a PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/60 my-1" />
        <DropdownMenuItem
          onClick={exportToExcel}
          disabled={isExporting}
          className="cursor-pointer text-xs font-bold py-2.5 rounded-lg text-foreground hover:bg-muted"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" /> Exportar a Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}