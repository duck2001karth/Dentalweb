"use client"

import React, { useRef, useState } from "react"
import { FileSignature, Eraser, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function SignaturePadModal({
  isOpen,
  setIsOpen,
  onSaveSignature,
  patientName
}: {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onSaveSignature: (base64Signature: string) => void
  patientName: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    setIsDrawing(true)
    setIsEmpty(false)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const handleConfirmSave = () => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return
    const base64Image = canvas.toDataURL("image/png")
    onSaveSignature(base64Image)
    setIsOpen(false)
    clearCanvas()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-5 border-b border-border bg-slate-900 text-white dark:bg-slate-950">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-[#00b0e9]" />
            Captura de Firma Digital
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-300">
            Paciente: <b className="text-white">{patientName}</b>
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-3 text-center">
          <p className="text-xs text-muted-foreground font-medium">
            Dibuje la firma en el recuadro utilizando el mouse o pantalla táctil:
          </p>

          <div className="border-2 border-dashed border-border rounded-xl bg-white p-1 relative shadow-inner">
            <canvas
              ref={canvasRef}
              width={400}
              height={180}
              className="w-full h-[180px] cursor-crosshair touch-none rounded-lg"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCanvas}
              disabled={isEmpty}
              className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Eraser className="w-3.5 h-3.5 mr-1" /> Limpiar firma
            </Button>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmSave}
            disabled={isEmpty}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5"
          >
            <Check className="w-4 h-4 mr-1.5" /> Guardar y Vincular Firma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}