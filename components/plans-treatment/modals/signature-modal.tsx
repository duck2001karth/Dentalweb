"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Check, Eraser, FileSignature } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SignaturePadModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onSaveSignature: (base64Signature: string) => void
  patientName: string
}

export function SignaturePadModal({
  isOpen,
  setIsOpen,
  onSaveSignature,
  patientName,
}: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const activePointer = useRef<number | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return

    activePointer.current = null
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.beginPath()
    setIsEmpty(true)
  }, [])

  useEffect(() => {
    if (isOpen) clearCanvas()
  }, [isOpen, clearCanvas])

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const bounds = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    }
  }

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== null || !event.isPrimary) return
    const context = event.currentTarget.getContext("2d")
    if (!context) return

    event.preventDefault()
    activePointer.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    const { x, y } = point(event)
    context.strokeStyle = "#111827"
    context.fillStyle = "#111827"
    context.lineWidth = 2.8
    context.lineCap = "round"
    context.lineJoin = "round"
    context.beginPath()
    context.arc(x, y, 1.4, 0, 2 * Math.PI)
    context.fill()
    context.beginPath()
    context.moveTo(x, y)
    setIsEmpty(false)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== event.pointerId) return
    const context = event.currentTarget.getContext("2d")
    if (!context) return
    event.preventDefault()
    const { x, y } = point(event)
    context.lineTo(x, y)
    context.stroke()
    context.beginPath()
    context.moveTo(x, y)
  }

  const onPointerEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== event.pointerId) return
    activePointer.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    event.currentTarget.getContext("2d")?.beginPath()
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty || activePointer.current !== null) return
    // Se conserva el contrato original: PNG en Data URL.
    onSaveSignature(canvas.toDataURL("image/png"))
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl sm:max-w-[420px] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
        <DialogHeader className="gap-1 border-b border-slate-200 bg-slate-50 px-4 py-3 text-left dark:border-slate-800 dark:bg-slate-900">
          <DialogTitle className="flex items-center gap-2 pr-6 text-base font-semibold text-slate-900 dark:text-slate-50">
            <FileSignature className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true" />
            Captura de firma digital
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 dark:text-slate-300">
            Paciente: <span className="font-semibold text-slate-900 dark:text-white">{patientName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 px-4 py-3">
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            Dibuje su firma dentro del recuadro.
          </p>
          <div className="overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white p-1 dark:border-slate-500">
            <canvas
              ref={canvasRef}
              width={600}
              height={240}
              aria-label="Área de captura de la firma del paciente"
              className="block h-[145px] w-full cursor-crosshair touch-none rounded-md bg-white"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onLostPointerCapture={onPointerEnd}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isEmpty}
              onClick={clearCanvas}
              className="h-8 px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <Eraser className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Limpiar firma
            </Button>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-9 rounded-lg border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isEmpty}
            className="h-9 rounded-lg bg-sky-700 px-3 text-xs font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
          >
            <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Guardar firma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SignaturePadModal
