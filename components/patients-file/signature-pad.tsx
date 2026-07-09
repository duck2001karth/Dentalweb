"use client"

import React, { useState, useRef } from "react"
import { X } from "lucide-react"
import { Label } from "@/components/ui/label"

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

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <Label className="text-xs text-muted-foreground font-semibold">{label}</Label>
        {hasDrawn && (
          <button type="button" onClick={clearCanvas} className="text-xs text-red-500 hover:text-red-700 font-medium">
            Limpiar
          </button>
        )}
      </div>
      {initialImage && !hasDrawn ? (
        <div className="relative border border-border rounded-lg bg-background w-full h-[100px] flex items-center justify-center shadow-sm">
          <img src={initialImage} alt="Firma registrada" className="max-h-full object-contain p-2" />
          <button type="button" onClick={clearCanvas} className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors">
            <X size={12} />
          </button>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={250}
          height={100}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerOut={stopDrawing}
          className="border border-border rounded-lg bg-background touch-action-none cursor-crosshair w-full h-[100px] shadow-sm"
          style={{ touchAction: 'none' }}
        />
      )}
    </div>
  )
}