"use client"

import React, { useRef, useState, useEffect } from "react"
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

  const setupCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = "#0f172a"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }

  useEffect(() => {
    setupCanvas()

    const canvas = canvasRef.current
    if (!canvas) return

    const observer = new ResizeObserver(() => {
      if (!hasSignature) {
        setupCanvas()
      }
    })

    observer.observe(canvas)
    return () => observer.disconnect()
  }, [hasSignature])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    if (onClear) onClear()
  }

  const handleConfirmSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return
    onSign(canvas.toDataURL("image/png"))
  }

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-[#008bcd]" /> {label}
        </span>

        <div className="flex items-center gap-2">
          {hasSignature ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Trazo detectado
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
              Lienzo vacío
            </span>
          )}

          {hasSignature && (
            <button
              type="button"
              onClick={clearCanvas}
              className="text-[11px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Limpiar trazo
            </button>
          )}
        </div>
      </div>

      <div className="relative w-full rounded-2xl border-2 border-dashed border-border/80 bg-white dark:bg-slate-100 shadow-2xs overflow-hidden">
        <canvas
        ref={canvasRef}
        width={600}
        height={270}
        className="w-full h-[180px] cursor-crosshair touch-none select-none rounded-lg block"
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
            Firme aquí con el cursor o pantalla táctil
          </div>
        )}
      </div>

      {/* BOTONES DE CONTROL DE ACCIÓN */}
      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          disabled={!hasSignature}
          className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer text-muted-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reintentar
        </Button>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer"
            >
              Cancelar
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleConfirmSignature}
            disabled={!hasSignature}
            className="rounded-xl font-bold text-xs h-9 px-5 bg-[#008bcd] hover:bg-[#0070a8] text-white shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <Check className="w-4 h-4 mr-1.5 stroke-[2.5]" /> {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  )
}