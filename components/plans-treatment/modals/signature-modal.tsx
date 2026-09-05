"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { FileSignature, Eraser, Check } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
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
  patientName
}: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { x, y } = getCoordinates(e)

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setIsEmpty(false)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { x, y } = getCoordinates(e)

    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        clearCanvas()
      }, 50)
    }
  }, [isOpen, clearCanvas])

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
      <DialogContent className="sm:max-w-[480px] bg-card border-border rounded-2xl p-0 overflow-hidden shadow-2xl font-sans antialiased">
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
            Dibuje la firma dentro del recuadro con el mouse o la pantalla táctil:
          </p>

          <div className="border-2 border-dashed border-border rounded-xl bg-white p-1 relative shadow-inner overflow-hidden">
            <canvas
              ref={canvasRef}
              width={600}
              height={270}
              className="w-full h-[180px] cursor-crosshair touch-none rounded-lg block"
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
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearCanvas}
              disabled={isEmpty}
              className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
            >
              <Eraser className="w-3.5 h-3.5 mr-1" /> Limpiar firma
            </Button>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="rounded-xl text-xs font-bold"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmSave}
            disabled={isEmpty}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5 text-xs shadow-xs cursor-pointer"
          >
            <Check className="w-4 h-4 mr-1.5" /> Guardar y Vincular Firma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SignaturePadModal