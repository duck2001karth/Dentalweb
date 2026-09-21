"use client"

import React, { useRef, useState, useEffect } from "react"
import SignatureCanvas from "react-signature-canvas"
import { useTheme } from "next-themes"
import { Check, Trash2, Upload, PenTool, ShieldCheck, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface DoctorSignatureTabProps {
  initialLicense?: string
  initialSignature?: string | null
  accentColor?: string
  onSignatureUpdated?: (newSig: string, newLicense: string) => void
}

export function DoctorSignatureTab({
  initialLicense = "",
  initialSignature = null,
  accentColor = "#008bcd",
  onSignatureUpdated,
}: DoctorSignatureTabProps) {
  const { theme, resolvedTheme } = useTheme()
  const isDark = (resolvedTheme || theme) === "dark"
  const { toast } = useToast()

  const sigCanvas = useRef<any>(null)
  const [currentSignature, setCurrentSignature] = useState<string | null>(initialSignature)
  const [professionalCard, setProfessionalCard] = useState(initialLicense)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (initialLicense) {
      setProfessionalCard(initialLicense)
    }
  }, [initialLicense])

  useEffect(() => {
    setIsLoading(true)
    fetch("/api/users/signature")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const sig = data.signatureBase64 || null
          const license = data.professionalCard || data.licenseNumber || ""
          setCurrentSignature(sig)
          setProfessionalCard(license)
          if (onSignatureUpdated && license) {
            onSignatureUpdated(sig || "", license)
          }
        }
      })
      .catch((err) => console.error("Error al cargar firma:", err))
      .finally(() => setIsLoading(false))
  }, [])

  const handleClearCanvas = () => {
    sigCanvas.current?.clear()
  }

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo inválido",
        description: "Debes seleccionar una imagen en formato PNG o JPG.",
        variant: "destructive",
      })
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

  const handleSaveSignature = async () => {
    let finalBase64 = currentSignature
    if (isDrawingMode && sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        toast({
          title: "Trazo vacío",
          description: "Dibuja tu firma o huella antes de presionar guardar.",
          variant: "destructive",
        })
        return
      }
      finalBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png")
    }
    setIsSaving(true)
    try {
      const res = await fetch("/api/users/signature", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureBase64: finalBase64,
          professionalCard,
        }),
      })
      if (!res.ok) throw new Error()
      setCurrentSignature(finalBase64)
      setIsDrawingMode(false)
      toast({
        title: "Firma profesional guardada",
        description: "Se aplicará automáticamente a recetas, presupuestos y consentimientos.",
      })
      if (onSignatureUpdated) {
        onSignatureUpdated(finalBase64 || "", professionalCard)
      }
    } catch {
      toast({
        title: "Error al guardar",
        description: "No se pudo actualizar la firma en la base de datos.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10" style={{ color: accentColor }}>
        <Loader2 className="w-7 h-7 animate-spin mb-2" />
        <span className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Cargando credenciales de firma...
        </span>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 gap-5 items-start font-sans ${
      isDark ? "text-slate-100" : "text-slate-900"
    }`}>
      {/* COLUMNA IZQUIERDA */}
      <div className="md:col-span-5 space-y-4">
        <div className={`p-3.5 rounded-2xl border space-y-1 transition-colors ${
          isDark
            ? "border-[#1e293b] bg-[#070d18]"
            : "border-slate-200 bg-slate-50"
        }`}>
          <h4 className={`text-xs font-bold flex items-center gap-1.5 ${
            isDark ? "text-white" : "text-slate-900"
          }`}>
            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: accentColor }} /> Firma y Sello Clínico
          </h4>
          <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Esta rúbrica o huella se estampará en recetas, evoluciones y consentimientos legales.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Matrícula / Registro Profesional (MSP / Senescyt)
          </Label>
          <Input
            value={professionalCard}
            onChange={(e) => setProfessionalCard(e.target.value)}
            placeholder="Ej: 1719231696 / AC-08492"
            className={`h-9 rounded-xl text-xs font-medium font-mono transition-colors ${
              isDark
                ? "bg-[#070d18] border-[#1e293b] text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          />
        </div>

        <div className={`p-3 rounded-2xl border border-dashed text-[11px] space-y-1 transition-colors ${
          isDark
            ? "border-[#1e293b] text-slate-400"
            : "border-slate-200 text-slate-600"
        }`}>
          <p className={`font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>💡 Sugerencia técnica:</p>
          <p>Para resultados óptimos en recetarios impresos, sube una foto con fondo blanco o dibuja tu trazo con lápiz táctil.</p>
        </div>

        <Button
          type="button"
          onClick={handleSaveSignature}
          disabled={isSaving}
          style={{ backgroundColor: accentColor }}
          className="w-full text-white text-xs font-bold h-9 px-4 rounded-xl cursor-pointer shadow-xs mt-1 hover:opacity-90 transition-opacity border-0"
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
          ) : (
            <Check className="w-3.5 h-3.5 mr-1.5" />
          )}
          Guardar Firma
        </Button>
      </div>

      {/* COLUMNA DERECHA: VISOR / PAD */}
      <div className="md:col-span-7 space-y-2">
        <div className="flex items-center justify-between">
          <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Rúbrica o Huella Digital
          </Label>
          <div className="flex items-center gap-2.5">
            <label
              style={{ color: accentColor }}
              className="text-xs font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" /> Subir Imagen
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
            </label>
            <button
              type="button"
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              className={`text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                isDark ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              {isDrawingMode ? (
                <>
                  <RefreshCw className="w-3 h-3" /> Ver Guardada
                </>
              ) : (
                <>
                  <PenTool className="w-3 h-3" /> Dibujar Nueva
                </>
              )}
            </button>
          </div>
        </div>

        {isDrawingMode ? (
          <div className={`rounded-2xl border overflow-hidden shadow-xs transition-colors ${
            isDark ? "border-[#1e293b] bg-[#070d18]" : "border-slate-200 bg-white"
          }`}>
            <SignatureCanvas
              ref={sigCanvas}
              penColor={isDark ? "#ffffff" : "#0f172a"}
              canvasProps={{
                className: `w-full h-44 cursor-crosshair ${isDark ? "bg-[#030712]" : "bg-white"}`,
              }}
            />
            <div className={`p-2 border-t flex justify-between items-center ${
              isDark ? "border-[#1e293b] bg-[#070d18]" : "border-slate-200 bg-slate-50"
            }`}>
              <span className={`text-[10px] italic ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Traza tu firma aquí con mouse o pantalla táctil
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearCanvas}
                className="h-6 text-[11px] text-rose-500 hover:bg-rose-500/10 px-2"
              >
                <Trash2 className="w-3 h-3 mr-1" /> Limpiar
              </Button>
            </div>
          </div>
        ) : currentSignature ? (
          <div className={`rounded-2xl border p-3 flex flex-col items-center justify-center min-h-[175px] shadow-xs relative transition-colors ${
            isDark ? "border-[#1e293b] bg-[#070d18]" : "border-slate-200 bg-white"
          }`}>
            <div className={`w-full h-36 flex items-center justify-center rounded-xl overflow-hidden p-2 ${
              isDark ? "bg-[#030712]" : "bg-slate-50"
            }`}>
              <img
                src={currentSignature}
                alt="Firma Profesional"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <span className={`text-[10px] font-mono mt-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Estado: Vinculada al usuario
            </span>
          </div>
        ) : (
          <div className={`rounded-2xl border border-dashed p-8 text-center min-h-[175px] flex flex-col items-center justify-center transition-colors ${
            isDark ? "border-[#1e293b] bg-[#070d18]/40" : "border-slate-200 bg-slate-50"
          }`}>
            <PenTool className="w-6 h-6 text-slate-400 mb-1.5" />
            <p className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Sin firma registrada
            </p>
            <p className={`text-[10.5px] mt-0.5 max-w-[200px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Sube una imagen o dibuja una nueva para activarla.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}