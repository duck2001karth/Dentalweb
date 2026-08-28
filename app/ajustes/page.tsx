"use client"

import React, { useState, useEffect, useRef } from "react"
import { 
  Building2, Image as ImageIcon, Receipt, Save, Loader2, 
  Phone, MapPin, Mail, Percent, Type, UploadCloud, X, 
  Stethoscope, Plus, Trash2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { AppLayout } from "@/components/layouts/app-layout"

export default function ClinicSettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"SRI" | "CONTACT" | "BRAND" | "BOXES">("SRI")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newBoxName, setNewBoxName] = useState("")
  
  const [settings, setSettings] = useState({
    clinicName: "",
    ruc: "",
    razonSocial: "",
    estabCode: "001",
    ptoEmiCode: "001",
    obligadoContab: false,
    taxRate: 0,
    currency: "USD",
    address: "",
    phone: "",
    whatsappNumber: "",
    email: "",
    website: "",
    availableBoxes: [] as string[],
    footerText: "",
    logoUrl: "",
    watermarkUrl: ""
  })

  const [dragActiveLogo, setDragActiveLogo] = useState(false)
  const [dragActiveWatermark, setDragActiveWatermark] = useState(false)

  useEffect(() => {
    fetch("/api/configuration")
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setSettings({
            clinicName: data.clinicName || "",
            ruc: data.ruc || "",
            razonSocial: data.razonSocial || "",
            estabCode: data.estabCode || "001",
            ptoEmiCode: data.ptoEmiCode || "001",
            obligadoContab: Boolean(data.obligadoContab),
            taxRate: Number(data.taxRate) || 0,
            currency: data.currency || "USD",
            address: data.address || "",
            phone: data.phone || "",
            whatsappNumber: data.whatsappNumber || "",
            email: data.email || "",
            website: data.website || "",
            availableBoxes: data.availableBoxes || ["Box 1 (Principal)", "Box 2 (Ortodoncia)"],
            footerText: data.footerText || "",
            logoUrl: data.logoUrl || "",
            watermarkUrl: data.watermarkUrl || ""
          })
        }
      })
      .catch(() => toast({ title: "Error", description: "No se pudieron cargar los ajustes.", variant: "destructive" }))
      .finally(() => setIsLoading(false))
  }, [toast])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/configuration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      })
      if (!res.ok) throw new Error()
      toast({ title: "Configuración Actualizada", description: "Los parámetros de la clínica se han guardado con éxito." })
    } catch {
      toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileChange = (file: File | null, field: "logoUrl" | "watermarkUrl") => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato no válido", description: "Sube archivos PNG, JPG o SVG.", variant: "destructive" })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setSettings(prev => ({ ...prev, [field]: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleAddBox = () => {
    if (!newBoxName.trim()) return
    setSettings(prev => ({ ...prev, availableBoxes: [...prev.availableBoxes, newBoxName.trim()] }))
    setNewBoxName("")
  }

  const handleRemoveBox = (index: number) => {
    setSettings(prev => ({ ...prev, availableBoxes: prev.availableBoxes.filter((_, i) => i !== index) }))
  }

  const ImageDropzone = ({ field, label, helper, dragState, setDragState }: { 
    field: "logoUrl" | "watermarkUrl"
    label: string
    helper: string
    dragState: boolean
    setDragState: (val: boolean) => void 
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const hasImage = Boolean(settings[field])

    return (
      <div className="space-y-3 bg-muted/20 border border-border/60 rounded-2xl p-5">
        <div>
          <Label className="text-[11px] font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#008bcd]" /> {label}
          </Label>
          <p className="text-[10px] text-muted-foreground mt-0.5">{helper}</p>
        </div>
        
        {!hasImage ? (
          <div 
            onDragOver={(e) => { e.preventDefault(); setDragState(true) }}
            onDragLeave={() => setDragState(false)}
            onDrop={(e) => { e.preventDefault(); setDragState(false); handleFileChange(e.dataTransfer.files[0], field) }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
              dragState ? "border-[#008bcd] bg-[#008bcd]/5" : "border-border/80 bg-background hover:border-[#008bcd]/50 hover:bg-muted/30"
            )}
          >
            <UploadCloud className={cn("w-7 h-7 mb-2 transition-colors", dragState ? "text-[#008bcd]" : "text-muted-foreground")} />
            <p className="text-xs font-bold text-foreground">Arrastra una imagen o haz clic</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">PNG, JPG o SVG (Máx. 2MB)</p>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e.target.files?.[0] || null, field)} />
          </div>
        ) : (
          <div className="w-full h-36 border border-border/80 rounded-xl relative overflow-hidden bg-background flex items-center justify-center group shadow-inner">
            <img src={settings[field]} alt={label} className="w-auto h-full object-contain p-3" />
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button 
                variant="destructive" size="sm" 
                onClick={() => setSettings(prev => ({ ...prev, [field]: "" }))}
                className="h-8 rounded-xl text-xs font-bold shadow-lg"
              >
                <X className="w-3.5 h-3.5 mr-1.5" /> Quitar Imagen
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <AppLayout>
      {/* Contenedor sin restricciones de ancho máximo */}
      <div className="w-full px-4 md:px-6 py-6 lg:py-8 animate-in fade-in duration-500 flex flex-col min-h-[calc(100vh-6rem)]">
        
        {/* HEADER DE PÁGINA (100% WIDTH) */}
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border/60 rounded-[24px] p-6 md:p-8 shadow-sm relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#008bcd]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 bg-[#008bcd] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#008bcd]/20 shrink-0">
              <Building2 className="w-7 h-7 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Ajustes de Clínica</h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium">
                Parámetros maestros fiscales, facturación SRI, imagen institucional y sillones clínicos.
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving || isLoading}
            className="bg-[#008bcd] hover:bg-[#007bb6] text-white font-bold h-11 px-7 rounded-xl shadow-md shadow-[#008bcd]/20 transition-all active:scale-95 relative z-10 w-full md:w-auto"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2 stroke-[2.5]" />} 
            Guardar Cambios
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-28">
            <Loader2 className="w-8 h-8 animate-spin text-[#008bcd]" />
          </div>
        ) : (
          /* GRID PRINCIPAL FLUIDO A TODA LA PANTALLA */
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
            
            {/* SIDEBAR TABS (3 Columnas en desktop) */}
            <div className="lg:col-span-3 flex flex-col gap-1.5 bg-card p-2.5 rounded-[20px] border border-border/60 shadow-sm">
              <button 
                onClick={() => setActiveTab("SRI")} 
                className={cn(
                  "px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center gap-3 w-full text-left",
                  activeTab === "SRI" ? "bg-[#008bcd]/10 text-[#008bcd]" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <Receipt className="w-4 h-4" /> Datos Fiscales & SRI
              </button>
              <button 
                onClick={() => setActiveTab("CONTACT")} 
                className={cn(
                  "px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center gap-3 w-full text-left",
                  activeTab === "CONTACT" ? "bg-[#008bcd]/10 text-[#008bcd]" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <MapPin className="w-4 h-4" /> Contacto & Ubicación
              </button>
              <button 
                onClick={() => setActiveTab("BRAND")} 
                className={cn(
                  "px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center gap-3 w-full text-left",
                  activeTab === "BRAND" ? "bg-[#008bcd]/10 text-[#008bcd]" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <ImageIcon className="w-4 h-4" /> Logotipo & Marca
              </button>
              <button 
                onClick={() => setActiveTab("BOXES")} 
                className={cn(
                  "px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center gap-3 w-full text-left",
                  activeTab === "BOXES" ? "bg-[#008bcd]/10 text-[#008bcd]" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <Stethoscope className="w-4 h-4" /> Sillones (Boxes)
              </button>
            </div>

            {/* PANEL DE FORMULARIOS (9 Columnas en desktop) */}
            <div className="lg:col-span-9 bg-card border border-border/60 rounded-[24px] p-6 md:p-8 shadow-sm min-h-[420px]">
              
              {/* 1. FISCAL & SRI */}
              {activeTab === "SRI" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Nombre Comercial de la Clínica *</Label>
                    <Input value={settings.clinicName} onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })} className="h-11 rounded-xl bg-background font-bold text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Razón Social (Legal) *</Label>
                    <Input value={settings.razonSocial} onChange={(e) => setSettings({ ...settings, razonSocial: e.target.value })} className="h-11 rounded-xl bg-background font-semibold text-sm" placeholder="Ej: CARMODENTAL S.A.S." />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">RUC de la Clínica (13 Dígitos)</Label>
                    <Input value={settings.ruc} onChange={(e) => setSettings({ ...settings, ruc: e.target.value })} className="h-11 rounded-xl bg-background font-mono font-bold text-sm" placeholder="1790000000001" maxLength={13} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Establecimiento</Label>
                      <Input value={settings.estabCode} onChange={(e) => setSettings({ ...settings, estabCode: e.target.value })} className="h-11 rounded-xl bg-background font-mono text-center font-bold text-sm" placeholder="001" maxLength={3} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Punto Emisión</Label>
                      <Input value={settings.ptoEmiCode} onChange={(e) => setSettings({ ...settings, ptoEmiCode: e.target.value })} className="h-11 rounded-xl bg-background font-mono text-center font-bold text-sm" placeholder="001" maxLength={3} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Tasa IVA General (%)</Label>
                    <Input type="number" value={settings.taxRate} onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })} className="h-11 rounded-xl bg-background font-mono font-bold text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Moneda Oficial</Label>
                    <select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-sm font-bold outline-none cursor-pointer">
                      <option value="USD">Dólares Estadounidenses (USD)</option>
                      <option value="BOB">Bolivianos (BOB)</option>
                      <option value="COP">Pesos Colombianos (COP)</option>
                      <option value="MXN">Pesos Mexicanos (MXN)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between p-4 bg-muted/20 border border-border/60 rounded-xl mt-2">
                    <div>
                      <p className="text-xs font-bold text-foreground">Obligado a llevar contabilidad</p>
                      <p className="text-[11px] text-muted-foreground">Requerido por el SRI según el régimen tributario de la clínica.</p>
                    </div>
                    <Switch checked={settings.obligadoContab} onCheckedChange={(c) => setSettings({ ...settings, obligadoContab: c })} />
                  </div>
                </div>
              )}

              {/* 2. CONTACTO */}
              {activeTab === "CONTACT" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Dirección Física de la Clínica</Label>
                    <Input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className="h-11 rounded-xl bg-background text-sm" placeholder="Ej: Av. Amazonas y República, Quito" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Teléfono Convencional</Label>
                    <Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="h-11 rounded-xl bg-background font-mono text-sm" placeholder="(02) 222-0000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">WhatsApp para Recordatorios</Label>
                    <Input value={settings.whatsappNumber} onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })} className="h-11 rounded-xl bg-background font-mono text-sm" placeholder="+593 999999999" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Correo de Facturación</Label>
                    <Input type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} className="h-11 rounded-xl bg-background text-sm" placeholder="facturacion@carmodental.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Sitio Web Oficial</Label>
                    <Input value={settings.website} onChange={(e) => setSettings({ ...settings, website: e.target.value })} className="h-11 rounded-xl bg-background text-sm" placeholder="https://carmodental.com" />
                  </div>
                </div>
              )}

              {/* 3. LOGOTIPO */}
              {activeTab === "BRAND" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ImageDropzone field="logoUrl" label="Logotipo Oficial" helper="Aparece en RIDE/PDFs tributarios y cabecera." dragState={dragActiveLogo} setDragState={setDragActiveLogo} />
                    <ImageDropzone field="watermarkUrl" label="Marca de Agua" helper="Fondo transparente opcional en odontogramas." dragState={dragActiveWatermark} setDragState={setDragActiveWatermark} />
                  </div>
                  <div className="space-y-1.5 pt-4 border-t border-border/40">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pie de Página en Recetas y Documentos</Label>
                    <textarea value={settings.footerText} onChange={(e) => setSettings({ ...settings, footerText: e.target.value })} className="w-full min-h-[90px] p-3.5 rounded-xl border border-input bg-background text-xs font-medium outline-none resize-y" />
                  </div>
                </div>
              )}

              {/* 4. SILLONES / BOXES */}
              {activeTab === "BOXES" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div>
                    <p className="text-xs font-bold text-foreground">Sillones Odontológicos Habilitados</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Estos Boxes estarán disponibles para seleccionar en las citas e inventario.</p>
                  </div>

                  <div className="flex gap-2">
                    <Input value={newBoxName} onChange={(e) => setNewBoxName(e.target.value)} placeholder="Ej: Box 4 (Endodoncia)" className="h-10 rounded-xl bg-background text-sm" />
                    <Button onClick={handleAddBox} type="button" className="bg-[#008bcd] hover:bg-[#007bb6] text-white font-bold h-10 px-5 rounded-xl text-xs">
                      <Plus className="w-4 h-4 mr-1.5" /> Añadir
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {settings.availableBoxes.map((box, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-3 bg-muted/20 border border-border/60 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <Stethoscope className="w-4 h-4 text-[#008bcd]" />
                          <span className="text-xs font-bold text-foreground">{box}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveBox(idx)} className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}