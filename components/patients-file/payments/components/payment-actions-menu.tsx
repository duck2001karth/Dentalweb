"use client"

import React from "react"
import { 
  MoreHorizontal, Printer, Mail, FileCheck,
  RotateCcw, Edit, Trash2, MessageCircle, ShieldAlert,
  FileX2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PaymentActionsMenuProps {
  payment: any
  canEdit: boolean
  canDelete: boolean
  onPrintReceipt: (payment: any) => void
  onSendEmail?: (payment: any) => void
  onSendWhatsApp?: (payment: any) => void
  onEdit?: (payment: any) => void
  onCreditNote?: (payment: any) => void
  onDelete?: (payment: any) => void
}

export function PaymentActionsMenu({
  payment,
  canEdit,
  canDelete,
  onPrintReceipt,
  onSendEmail,
  onSendWhatsApp,
  onEdit,
  onCreditNote,
  onDelete,
}: PaymentActionsMenuProps) {
  const targetId = payment.id

  // 1. Identificar si cuenta con comprobante SRI
  const hasFiscalInvoice = Boolean(
    (payment.taxDocuments && payment.taxDocuments.length > 0) ||
    payment.invoiceNumber ||
    payment.receiptNumberFiscal ||
    (payment.reference && payment.reference.toUpperCase().includes("SRI"))
  )

  // 2. Identificar si ya tiene una Nota de Crédito aplicada
  const hasCreditNote = Boolean(
    payment.hasCreditNote ||
    payment.creditNotes?.length > 0 ||
    payment.taxDocuments?.some((d: any) => d.docType === "NOTA_CREDITO") ||
    (payment.notes && typeof payment.notes === "string" && payment.notes.toUpperCase().includes("NOTA DE CRÉDITO"))
  )

  const allowEdit = canEdit && !hasFiscalInvoice && !hasCreditNote
  const allowDelete = canDelete && !hasFiscalInvoice && !hasCreditNote

  const handleOpenDocument = () => {
    if (hasFiscalInvoice) {
      window.open(`/comprobantes/${targetId}`, "_blank")
    } else {
      onPrintReceipt(payment)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer transition-colors"
          title="Opciones del pago"
        >
          <MoreHorizontal className="w-4 h-4 text-foreground/80" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-60 rounded-xl font-sans text-xs p-1.5 shadow-xl border-border bg-popover">
        {/* Documento principal unificado */}
        <DropdownMenuItem 
          onClick={handleOpenDocument} 
          className="cursor-pointer font-semibold py-2 rounded-lg text-foreground hover:bg-muted"
        >
          {hasFiscalInvoice ? (
            <>
              <FileCheck className="w-4 h-4 mr-2.5 text-emerald-600" /> Ver Factura SRI (PDF)
            </>
          ) : (
            <>
              <Printer className="w-4 h-4 mr-2.5 text-[#008bcd]" /> Ver / Imprimir Recibo
            </>
          )}
        </DropdownMenuItem>

        {/* Notificaciones */}
        {(onSendEmail || onSendWhatsApp) && <DropdownMenuSeparator className="my-1" />}

        {onSendWhatsApp && (
          <DropdownMenuItem 
            onClick={() => onSendWhatsApp(payment)} 
            className="cursor-pointer font-medium py-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <MessageCircle className="w-4 h-4 mr-2.5" /> Enviar por WhatsApp
          </DropdownMenuItem>
        )}

        {onSendEmail && (
          <DropdownMenuItem 
            onClick={() => onSendEmail(payment)} 
            className="cursor-pointer font-medium py-2 rounded-lg text-foreground hover:bg-muted"
          >
            <Mail className="w-4 h-4 mr-2.5 text-slate-500" /> Enviar por correo
          </DropdownMenuItem>
        )}

        {/* Modificar: solo permitido para cobros sin factura y sin nota de crédito */}
        {allowEdit && onEdit && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem 
              onClick={() => onEdit(payment)} 
              className="cursor-pointer font-medium py-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            >
              <Edit className="w-4 h-4 mr-2.5" /> Modificar datos
            </DropdownMenuItem>
          </>
        )}

        {/* Operaciones de anulación / Notas de crédito */}
        <DropdownMenuSeparator className="my-1" />

        {hasFiscalInvoice ? (
          <>
            {hasCreditNote ? (
              // Estado: Ya fue anulada previamente
              <div className="px-2.5 py-2 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                <FileX2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Factura anulada con NC</span>
              </div>
            ) : (
              // Estado: Factura activa disponible para anular con NC
              <>
                {onCreditNote && (
                  <DropdownMenuItem 
                    onClick={() => onCreditNote(payment)} 
                    className="cursor-pointer font-semibold py-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  >
                    <RotateCcw className="w-4 h-4 mr-2.5" /> Emitir nota de crédito
                  </DropdownMenuItem>
                )}
                <div className="px-2 py-1.5 text-[10px] text-muted-foreground flex items-center gap-1.5 bg-muted/40 rounded-md mt-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Facturado ante el SRI (Inalterable)</span>
                </div>
              </>
            )}
          </>
        ) : (
          allowDelete && onDelete && (
            <DropdownMenuItem 
              onClick={() => onDelete(payment)} 
              className="cursor-pointer font-semibold py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="w-4 h-4 mr-2.5" /> Anular / Eliminar pago
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}