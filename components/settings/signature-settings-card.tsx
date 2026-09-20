"use client"

import React, { useRef, useState, useEffect } from "react"
import SignatureCanvas from "react-signature-canvas"
import { Check, Trash2, Upload, PenTool, ShieldCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function SignatureSettingsCard() {
  const { toast } = useToast()
  const sigCanvas = useRef<any>(null)
  
  const [currentSignature, setCurrentSignature] = useState<string | null>(null)
  const [professionalCard, setProfessionalCard] = useState("")
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/user/signature")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setCurrentSignature(data.signatureBase64 || null)
          setProfessionalCard(data.professionalCard || "")
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleClear = () => {
    sigCanvas.current?.clear()
  }

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato no válido", description: "Sube un archivo PNG o JPG", variant: "destructive" })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setCurrentSignature(base64)
      setIsDrawingMode(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    let finalSignature = currentSignature

    if (isDrawingMode && sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        toast({ title: "Trazo vacío", description: "Dibuja tu firma antes de guardar.", variant: "destructive" })
        return
      }
      finalSignature = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png")
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/users/signature", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureBase64: finalSignature,
          professionalCard,
        }),
      })

      if (!res.ok) throw new Error()

      setCurrentSignature(finalSignature)
      setIsDrawingMode(false)
      toast({ title: "Guardado con éxito", description: "Tu firma o huella se ha actualizado para todos los módulos." })
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar la firma.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#008bcd]" />
      </div>
    )
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-5">
      <div>
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#008bcd]" /> Firma y Sello Profesional
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Esta firma o huella se estampará de forma automática en recetas, prescripciones, presupuestos y consentimientos informados.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase text-muted-foreground">Registro Médico / N° Licencia</Label>
        <Input
          placeholder="Ej: MSP-172839 / Reg. Odontológico 4501"
          value={professionalCard}
          onChange={(e) => setProfessionalCard(e.target.value)}
          className="rounded-xl h-10 text-xs bg-background"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Firma o Huella Registrada</Label>
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-[#008bcd] hover:underline cursor-pointer flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" /> Subir Imagen
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
            </label>
            <button
              type="button"
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              className="text-xs font-bold text-foreground hover:text-[#008bcd] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" /> {isDrawingMode ? "Ver Actual" : "Dibujar Nueva"}
            </button>
          </div>
        </div>

        {isDrawingMode ? (
          <div className="border border-border/80 rounded-xl overflow-hidden bg-background">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="#0f172a"
              canvasProps={{
                className: "w-full h-44 bg-white cursor-crosshair",
              }}
            />
            <div className="p-2 bg-muted/20 border-t border-border/60 flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground italic">Dibuja con el mouse o pantalla táctil</span>
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs text-destructive hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Limpiar Trazo
              </Button>
            </div>
          </div>
        ) : currentSignature ? (
          <div className="border border-border/80 rounded-xl p-4 bg-white dark:bg-slate-900 flex items-center justify-center min-h-[140px]">
            <img src={currentSignature} alt="Firma Profesional" className="max-h-32 object-contain" />
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-xl p-8 text-center bg-muted/10">
            <p className="text-xs text-muted-foreground font-medium">No tienes ninguna firma o huella registrada.</p>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={isSaving} className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold h-10 px-6 rounded-xl">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />} Guardar Firma
        </Button>
      </div>
    </div>
  )
}