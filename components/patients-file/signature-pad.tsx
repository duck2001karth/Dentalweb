"use client"

import React, { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import { Label } from "@/components/ui/label"

import { signatureStatuses } from "@/constants/status"

interface SignaturePadProps {
  label: string
  onSign: (data: string) => void
  onClear: () => void
  initialImage?: string | null
}

export function SignaturePad({ label, onSign, onClear, initialImage }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(!!initialImage)

  useEffect(() => {
    setHasDrawn(!!initialImage);
  }, [initialImage]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    if (hasDrawn && canvasRef.current) {
      onSign(canvasRef.current.toDataURL("image/png"))
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasDrawn(false)
      onClear()
    }
  }
  const statusConfig = hasDrawn ? signatureStatuses.SIGNED : signatureStatuses.MISSING;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Label className="text-sm text-foreground font-bold">{label}</Label>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.color}`}>
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </div>
        </div>

        {hasDrawn && (
          <button type="button" onClick={clearCanvas} className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors">
            Limpiar lienzo
          </button>
        )}
      </div>
      
      {initialImage && !hasDrawn ? (
        <div className="relative border-2 border-dashed border-border rounded-xl bg-muted/20 w-full h-[120px] flex items-center justify-center transition-all hover:bg-muted/40">
          <img src={initialImage} alt="Firma registrada" className="max-h-full object-contain p-2" />
          <button type="button" onClick={clearCanvas} className="absolute top-2 right-2 bg-background hover:bg-red-50 text-red-500 border border-border shadow-sm rounded-full p-1.5 transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={400} 
          height={120}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerOut={stopDrawing}
          className={`border-2 border-dashed rounded-xl touch-action-none cursor-crosshair w-full h-[120px] transition-colors ${hasDrawn ? 'border-emerald-200 bg-emerald-50/10' : 'border-border bg-background'}`}
          style={{ touchAction: 'none' }}
        />
      )}
    </div>
  )
}