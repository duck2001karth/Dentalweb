"use client"

import React from "react"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface DocumentVoidDialogProps {
  docId: string
  docTitle?: string
  onConfirmVoid: (id: string) => void
}

export function DocumentVoidDialog({
  docId,
  docTitle,
  onConfirmVoid,
}: DocumentVoidDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/15 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
          title="Anular documento"
        >
          <Trash2 className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 group-hover:text-red-700" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl max-w-[420px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-bold text-foreground">
            ¿Anular documento clínico?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {docTitle ? (
              <>
                Se marcará como nulo el documento <b>&quot;{docTitle}&quot;</b>.
              </>
            ) : (
              "Esta acción marcará como nulo el registro seleccionado."
            )}{" "}
            El historial permanecerá protegido en la auditoría médica legal.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-2">
          <AlertDialogCancel className="rounded-xl font-bold text-xs h-9 cursor-pointer">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirmVoid(docId)}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs h-9 cursor-pointer"
          >
            Sí, anular
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}