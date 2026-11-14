"use client"

import * as React from "react"
import { Check, CheckCircle2, PenTool, RotateCcw } from "lucide-react"
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
  confirmButtonText = "Guardar firma",
}: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const drawingRef = React.useRef(false)
  const [hasSignature, setHasSignature] = React.useState(false)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return
    // Dimensions in HTML avoid clearing a signature while the user draws.
    context.strokeStyle = "#0f172a"
    context.lineWidth = 3
    context.lineCap = "round"
    context.lineJoin = "round"
  }, [])

  function coordinate(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const bounds = canvas.getBoundingClientRect()
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0 && event.pointerType === "mouse") return
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return
    canvas.setPointerCapture(event.pointerId)
    const { x, y } = coordinate(event)
    context.beginPath()
    context.moveTo(x, y)
    context.lineTo(x + 0.1, y + 0.1)
    context.stroke()
    drawingRef.current = true
    setHasSignature(true)
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const context = canvasRef.current?.getContext("2d")
    if (!context) return
    const { x, y } = coordinate(event)
    context.lineTo(x, y)
    context.stroke()
  }

  function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId)
    }
  }

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height)
    drawingRef.current = false
    setHasSignature(false)
    onClear?.()
  }

  return (
    <div className="space-y-3 font-sans text-foreground">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <PenTool className="h-4 w-4 text-primary" /> {label}
        </span>
        <span aria-live="polite" className="flex items-center gap-1 text-xs text-muted-foreground">
          {hasSignature ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : null}
          {hasSignature ? "Firma capturada" : "Sin firma"}
        </span>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-border bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          width={720}
          height={256}
          aria-label="Área para dibujar una firma"
          className="block h-36 w-full cursor-crosshair touch-none select-none bg-white"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {!hasSignature && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Firme aquí
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear} disabled={!hasSignature}>
          <RotateCcw className="h-4 w-4" /> Limpiar
        </Button>
        <div className="flex gap-2">
          {onCancel && <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>}
          <Button type="button" size="sm" disabled={!hasSignature} onClick={() => {
            if (canvasRef.current && hasSignature) onSign(canvasRef.current.toDataURL("image/png"))
          }}>
            <Check className="h-4 w-4" /> {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  )
}
