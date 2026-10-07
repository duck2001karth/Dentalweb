"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { CheckCircle2, RotateCcw, Check, PenTool } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SignaturePadProps {
  label: string
  onSign: (base64: string) => void
  onClear?: () => void
  onCancel?: () => void
  confirmButtonText?: string
}

export function SignaturePad({
  label,
  onSign,
  onClear,
  onCancel,
  confirmButtonText = "Guardar Firma",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const rect = canvas.getBoundingClientRect()
    if (!ctx || rect.width === 0) return
    
    // Evitar parpadeos si ya hay firma
    if (hasSignature) return 

    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = "#0f172a"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [hasSignature])

  useEffect(() => {
    setupCanvas()
    const observer = new ResizeObserver(() => setupCanvas())
    if (canvasRef.current) observer.observe(canvasRef.current)
    return () => observer.disconnect()
  }, [setupCanvas])

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => setIsDrawing(false)

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    if (onClear) onClear()
  }

  const handleConfirmSignature = () => {
    if (canvasRef.current && hasSignature) {
      onSign(canvasRef.current.toDataURL("image/png"))
    }
  }

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-[#008bcd]" /> {label}
        </span>
        <div className="flex items-center gap-2">
          {hasSignature ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3" /> Trazo detectado
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">
              Lienzo vacío
            </span>
          )}
        </div>
      </div>
      
      <div className="relative w-full rounded-2xl border-2 border-dashed border-border/80 bg-white dark:bg-slate-100 shadow-2xs overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-[180px] cursor-crosshair touch-none select-none block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm font-medium select-none">
            Firme aquí
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button variant="outline" size="sm" onClick={clearCanvas} disabled={!hasSignature} className="rounded-xl text-xs h-9">
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reintentar
        </Button>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="rounded-xl text-xs h-9">Cancelar</Button>
          )}
          <Button size="sm" onClick={handleConfirmSignature} disabled={!hasSignature} className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl text-xs h-9">
            <Check className="w-4 h-4 mr-1.5" /> {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  )
}