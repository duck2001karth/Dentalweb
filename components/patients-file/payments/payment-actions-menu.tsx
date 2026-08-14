"use client"

import React from "react"
import { 
  MoreHorizontal, Printer, Mail, FileText, 
  RotateCcw, Edit, Trash2 
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
  onPrintDaily: (payment: any) => void
  onSendEmail: (payment: any) => void
  onEdit: (payment: any) => void
  onCreditNote: (payment: any) => void
  onDelete: (payment: any) => void
}

export function PaymentActionsMenu({
  payment,
  canEdit,
  canDelete,
  onPrintReceipt,
  onPrintDaily,
  onSendEmail,
  onEdit,
  onCreditNote,
  onDelete,
}: PaymentActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 rounded-full hover:bg-muted/80 flex items-center justify-center cursor-pointer"
          title="Opciones del pago"
        >
          <MoreHorizontal className="w-4 h-4 text-foreground/80" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-52 rounded-xl font-sans text-xs p-1 shadow-xl">
        {/* Acciones Generales */}
        <DropdownMenuItem onClick={() => onPrintReceipt(payment)} className="cursor-pointer font-medium py-2">
          <Printer className="w-4 h-4 mr-2 text-[#008bcd]" /> Imprimir comprobante
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => onPrintDaily(payment)} className="cursor-pointer font-medium py-2">
          <FileText className="w-4 h-4 mr-2 text-slate-500" /> Imprimir comprobante diario
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onSendEmail(payment)} className="cursor-pointer font-medium py-2">
          <Mail className="w-4 h-4 mr-2 text-slate-500" /> Enviar comprobante
        </DropdownMenuItem>

        {/* Acciones con Permisos (Recepción y Admin) */}
        {canEdit && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(payment)} className="cursor-pointer font-medium py-2 text-blue-600 dark:text-blue-400">
              <Edit className="w-4 h-4 mr-2" /> Modificar datos
            </DropdownMenuItem>
          </>
        )}

        {canDelete && (
          <>
            <DropdownMenuItem onClick={() => onCreditNote(payment)} className="cursor-pointer font-medium py-2 text-amber-600 dark:text-amber-400">
              <RotateCcw className="w-4 h-4 mr-2" /> Nota de crédito
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(payment)} className="cursor-pointer font-medium py-2 text-red-600 dark:text-red-400">
              <Trash2 className="w-4 h-4 mr-2" /> Eliminar pago
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}