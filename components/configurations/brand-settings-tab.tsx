"use client"

import React, { useRef, useState } from "react"
import { 
  Image as ImageIcon, UploadCloud, Trash2, Sliders, Eye, 
  FileText, RefreshCw, ZoomIn, Printer, Sun, Moon, Type
} from "lucide-react"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export interface BrandSettingsData {
  clinicName?: string
  slogan?: string
  razonSocial?: string
  ruc?: string
  logoUrl?: string
  logoScale?: number
  watermarkUrl?: string
  watermarkOpacity?: number
  watermarkScale?: number
  footerText?: string
  defaultPrintMode?: "color" | "bw"
  [key: string]: any
}

interface BrandSettingsTabProps {
  settings: BrandSettingsData
  setSettings: React.Dispatch<React.SetStateAction<any>>
}

export function BrandSettingsTab({ settings, setSettings }: BrandSettingsTabProps) {
  const { toast } = useToast()
  const [dragActiveLogo, setDragActiveLogo] = useState(false)
  const [dragActiveWatermark, setDragActiveWatermark] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<"logoUrl" | "watermarkUrl" | null>(null)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const watermarkInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (file: File | null, field: "logoUrl" | "watermarkUrl") => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato no válido",
        description: "Sube archivos PNG, JPG o SVG.",
        variant: "destructive",
      })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setSettings((prev: any) => ({ ...prev, [field]: reader.result as string }))
      toast({
        title: "Imagen cargada",
        description: "Recuerda pulsar 'Guardar Cambios' para aplicar.",
      })
    }
    reader.readAsDataURL(file)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setSettings((prev: any) => ({ ...prev, [deleteTarget]: "" }))
    toast({
      title: "Elemento removido",
      description: "La imagen se eliminará permanentemente al guardar.",
    })
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. SECCIÓN DE ESLOGAN INSTITUCIONAL */}
      <div className="p-5 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
        <div>
          <Label htmlFor="slogan-input" className="text-[11px] font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Type className="w-4 h-4 text-[#008bcd]" /> Eslogan / Subtítulo Institucional
          </Label>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Aparece directamente debajo del nombre de la clínica en reportes e impresiones oficiales.
          </p>
        </div>
        <Input
          id="slogan-input"
          value={settings.slogan || ""}
          onChange={(e) => setSettings((prev: any) => ({ ...prev, slogan: e.target.value }))}
          placeholder="Ej: CLÍNICA DE ESPECIALIDADES ODONTOLÓGICAS"
          className="h-10 text-xs font-semibold rounded-xl bg-background border-border/80"
        />
      </div>

      {/* 2. SECCIÓN DE IMÁGENES (LOGO Y MARCA DE AGUA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* LOGOTIPO */}
        <div className="space-y-3 bg-muted/20 border border-border/60 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <Label className="text-[11px] font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#008bcd]" /> Logotipo Oficial
            </Label>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Aparece en la barra lateral, recetas y comprobantes.
            </p>
          </div>

          {!settings.logoUrl ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActiveLogo(true) }}
              onDragLeave={() => setDragActiveLogo(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragActiveLogo(false)
                handleFileChange(e.dataTransfer.files[0], "logoUrl")
              }}
              onClick={() => logoInputRef.current?.click()}
              className={cn(
                "w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
                dragActiveLogo
                  ? "border-[#008bcd] bg-[#008bcd]/5"
                  : "border-border/80 bg-background hover:border-[#008bcd]/50 hover:bg-muted/30"
              )}
            >
              <UploadCloud className={cn("w-8 h-8 mb-2 transition-colors", dragActiveLogo ? "text-[#008bcd]" : "text-muted-foreground")} />
              <p className="text-xs font-bold text-foreground">Arrastra una imagen o haz clic</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">PNG, JPG o SVG (Máx. 2MB)</p>
            </div>
          ) : (
            <div className="w-full h-48 border border-border/80 rounded-2xl relative overflow-hidden bg-background/50 flex items-center justify-center p-4">
              <img
                src={settings.logoUrl}
                alt="Logotipo"
                style={{ transform: `scale(${(settings.logoScale || 100) / 100})` }}
                className="w-auto h-full max-h-32 object-contain drop-shadow-sm transition-all duration-200"
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  className="h-8 px-2.5 rounded-xl text-xs font-bold bg-background/90 shadow-sm border-border hover:bg-muted cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Cambiar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTarget("logoUrl")}
                  className="h-8 px-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                </Button>
              </div>
            </div>
          )}
          <input
            type="file"
            ref={logoInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null, "logoUrl")}
          />
        </div>

        {/* MARCA DE AGUA */}
        <div className="space-y-3 bg-muted/20 border border-border/60 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <Label className="text-[11px] font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#008bcd]" /> Marca de Agua
            </Label>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Fondo transparente para odontogramas e impresiones.
            </p>
          </div>

          {!settings.watermarkUrl ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActiveWatermark(true) }}
              onDragLeave={() => setDragActiveWatermark(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragActiveWatermark(false)
                handleFileChange(e.dataTransfer.files[0], "watermarkUrl")
              }}
              onClick={() => watermarkInputRef.current?.click()}
              className={cn(
                "w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
                dragActiveWatermark
                  ? "border-[#008bcd] bg-[#008bcd]/5"
                  : "border-border/80 bg-background hover:border-[#008bcd]/50 hover:bg-muted/30"
              )}
            >
              <UploadCloud className={cn("w-8 h-8 mb-2 transition-colors", dragActiveWatermark ? "text-[#008bcd]" : "text-muted-foreground")} />
              <p className="text-xs font-bold text-foreground">Arrastra una imagen o haz clic</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">PNG transparente recomendado</p>
            </div>
          ) : (
            <div className="w-full h-48 border border-border/80 rounded-2xl relative overflow-hidden bg-background/50 flex items-center justify-center p-4">
              <img
                src={settings.watermarkUrl}
                alt="Marca de agua"
                style={{
                  transform: `scale(${(settings.watermarkScale || 100) / 100})`,
                  opacity: (settings.watermarkOpacity ?? 15) / 100,
                }}
                className="w-auto h-full max-h-32 object-contain drop-shadow-sm transition-all duration-200"
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => watermarkInputRef.current?.click()}
                  className="h-8 px-2.5 rounded-xl text-xs font-bold bg-background/90 shadow-sm border-border hover:bg-muted cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Cambiar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTarget("watermarkUrl")}
                  className="h-8 px-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                </Button>
              </div>
            </div>
          )}
          <input
            type="file"
            ref={watermarkInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null, "watermarkUrl")}
          />
        </div>

      </div>

      {/* 3. CONTROLES DE ESCALA & OPACIDAD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* ESCALA LOGO */}
        {settings.logoUrl && (
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[#008bcd]" /> Escala del Logo
              </Label>
              <span className="text-xs font-mono font-bold text-[#008bcd] bg-[#008bcd]/10 px-2 py-0.5 rounded-md">
                {settings.logoScale || 100}%
              </span>
            </div>
            <input
              type="range"
              min={70}
              max={160}
              step={5}
              value={settings.logoScale || 100}
              onChange={(e) => setSettings((prev: any) => ({ ...prev, logoScale: Number(e.target.value) }))}
              className="w-full accent-[#008bcd] cursor-pointer"
            />
            <p className="text-[10px] text-muted-foreground font-medium">
              Calibra el tamaño en el menú principal.
            </p>
          </div>
        )}

        {/* TAMAÑO MARCA DE AGUA */}
        {settings.watermarkUrl && (
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-2">
                <ZoomIn className="w-3.5 h-3.5 text-[#008bcd]" /> Tamaño Marca de Agua
              </Label>
              <span className="text-xs font-mono font-bold text-[#008bcd] bg-[#008bcd]/10 px-2 py-0.5 rounded-md">
                {settings.watermarkScale || 100}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={160}
              step={5}
              value={settings.watermarkScale || 100}
              onChange={(e) => setSettings((prev: any) => ({ ...prev, watermarkScale: Number(e.target.value) }))}
              className="w-full accent-[#008bcd] cursor-pointer"
            />
            <p className="text-[10px] text-muted-foreground font-medium">
              Proporción en el centro de documentos.
            </p>
          </div>
        )}

        {/* OPACIDAD MARCA DE AGUA */}
        {settings.watermarkUrl && (
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-[#008bcd]" /> Opacidad de Fondo
              </Label>
              <span className="text-xs font-mono font-bold text-[#008bcd] bg-[#008bcd]/10 px-2 py-0.5 rounded-md">
                {settings.watermarkOpacity ?? 15}%
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={40}
              step={1}
              value={settings.watermarkOpacity ?? 15}
              onChange={(e) => setSettings((prev: any) => ({ ...prev, watermarkOpacity: Number(e.target.value) }))}
              className="w-full accent-[#008bcd] cursor-pointer"
            />
            <p className="text-[10px] text-muted-foreground font-medium">
              10% - 20% recomendado para legibilidad.
            </p>
          </div>
        )}

      </div>

      {/* 4. PREFERENCIA DE IMPRESIÓN POR DEFECTO */}
      <div className="p-5 rounded-2xl bg-muted/20 border border-border/60 space-y-4">
        <div>
          <Label className="text-xs font-bold text-foreground flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#008bcd]" /> Formato de Impresión Predeterminado
          </Label>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Define cómo saldrán por defecto los reportes de agenda, recetas y presupuestos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSettings((prev: any) => ({ ...prev, defaultPrintMode: "color" }))}
            className={cn(
              "p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer",
              (settings.defaultPrintMode || "color") === "color"
                ? "border-[#008bcd] bg-[#008bcd]/10 text-foreground ring-1 ring-[#008bcd]"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted/30"
            )}
          >
            <Sun className="w-5 h-5 text-[#008bcd] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Color Institucional</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Logotipos y acentos con el color oficial. Para PDFs y láser a color.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSettings((prev: any) => ({ ...prev, defaultPrintMode: "bw" }))}
            className={cn(
              "p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer",
              settings.defaultPrintMode === "bw"
                ? "border-foreground bg-foreground/10 text-foreground ring-1 ring-foreground"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted/30"
            )}
          >
            <Moon className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Monocromático / Alto Contraste</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Negros nítidos. Ahorra tóner y optimiza para impresoras B/N.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 5. PIE DE PÁGINA */}
      <div className="space-y-1.5 pt-4 border-t border-border/40">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Pie de Página en Recetas y Documentos
        </Label>
        <textarea
          value={settings.footerText || ""}
          onChange={(e) => setSettings((prev: any) => ({ ...prev, footerText: e.target.value }))}
          placeholder="Ej: Documento emitido por Carmo Dental. Información médica confidencial."
          className="w-full min-h-[90px] p-3.5 rounded-xl border border-input bg-background text-xs font-medium outline-none resize-y"
        />
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              ¿Eliminar {deleteTarget === "logoUrl" ? "Logotipo" : "Marca de Agua"}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              Esta acción quitará el recurso de la vista previa. Deberás pulsar &quot;Guardar Cambios&quot; para confirmar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="rounded-xl text-xs font-bold cursor-pointer">
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete} className="rounded-xl text-xs font-bold cursor-pointer">
              Sí, Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}