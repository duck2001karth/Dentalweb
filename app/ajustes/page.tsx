"use client"

import React, { useState, useEffect } from "react"
import { Building2, Receipt, MapPin, ImageIcon, Stethoscope, Save, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { AppLayout } from "@/components/layouts/app-layout"
import { useClinicSettings } from "@/config/clinic-settings"

import { SriSettingsTab } from "@/components/configurations/sri-settings"
import { ContactSettingsTab } from "@/components/configurations/contact-settings"
import { BrandSettingsTab } from "@/components/configurations/brand-settings-tab"
import { BoxesSettingsTab } from "@/components/configurations/boxes-settings"

export default function ClinicSettingsPage() {
  const { toast } = useToast()
  const { refreshSettings } = useClinicSettings()
  const [activeTab, setActiveTab] = useState<"SRI" | "CONTACT" | "BRAND" | "BOXES">("SRI")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
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
    logoScale: 100,
    watermarkUrl: "",
    watermarkOpacity: 15,
    watermarkScale: 100,
  })

  useEffect(() => {
    const savedScale = typeof window !== "undefined" ? localStorage.getItem("clinic_logo_scale") : null
    const savedOpacity = typeof window !== "undefined" ? localStorage.getItem("clinic_watermark_opacity") : null
    const savedWScale = typeof window !== "undefined" ? localStorage.getItem("clinic_watermark_scale") : null

    fetch("/api/configuration")
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setSettings(prev => ({
            ...prev,
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
            logoScale: savedScale ? Number(savedScale) : (data.logoScale || 100),
            watermarkUrl: data.watermarkUrl || "",
            watermarkOpacity: savedOpacity ? Number(savedOpacity) : 15,
            watermarkScale: savedWScale ? Number(savedWScale) : 100,
          }))
        }
      })
      .catch(() => toast({ title: "Error", description: "No se pudieron cargar los ajustes.", variant: "destructive" }))
      .finally(() => setIsLoading(false))
  }, [toast])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("clinic_logo_scale", String(settings.logoScale || 100))
        localStorage.setItem("clinic_watermark_opacity", String(settings.watermarkOpacity ?? 15))
        localStorage.setItem("clinic_watermark_scale", String(settings.watermarkScale || 100))
        window.dispatchEvent(new Event("logoScaleUpdated"))
      }

      const res = await fetch("/api/configuration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()

      if (refreshSettings) {
        await refreshSettings()
      }

      toast({ 
        title: "Configuración Actualizada", 
        description: "Los parámetros de la clínica se han guardado con éxito." 
      })
    } catch {
      toast({ 
        title: "Error", 
        description: "No se pudieron guardar los cambios.", 
        variant: "destructive" 
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="w-full px-4 md:px-6 py-6 lg:py-8 animate-in fade-in duration-500 flex flex-col min-h-[calc(100vh-6rem)]">
        
        {/* CABECERA */}
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
            className="bg-[#008bcd] hover:bg-[#007bb6] text-white font-bold h-11 px-7 rounded-xl shadow-md shadow-[#008bcd]/20 transition-all active:scale-95 relative z-10 w-full md:w-auto cursor-pointer"
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
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
            
            {/* TABS LATERALES */}
            <div className="lg:col-span-3 flex flex-col gap-1.5 bg-card p-2.5 rounded-[20px] border border-border/60 shadow-sm">
              <button 
                type="button"
                onClick={() => setActiveTab("SRI")} 
                className={cn(
                  "px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center gap-3 w-full text-left cursor-pointer",
                  activeTab === "SRI" ? "bg-[#008bcd]/10 text-[#008bcd]" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <Receipt className="w-4 h-4" /> Datos Fiscales & SRI
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab("CONTACT")} 
                className={cn(
                  "px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center gap-3 w-full text-left cursor-pointer",
                  activeTab === "CONTACT" ? "bg-[#008bcd]/10 text-[#008bcd]" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <MapPin className="w-4 h-4" /> Contacto & Ubicación
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab("BRAND")} 
                className={cn(
                  "px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center gap-3 w-full text-left cursor-pointer",
                  activeTab === "BRAND" ? "bg-[#008bcd]/10 text-[#008bcd]" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <ImageIcon className="w-4 h-4" /> Logotipo & Marca
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab("BOXES")} 
                className={cn(
                  "px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center gap-3 w-full text-left cursor-pointer",
                  activeTab === "BOXES" ? "bg-[#008bcd]/10 text-[#008bcd]" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <Stethoscope className="w-4 h-4" /> Sillones (Boxes)
              </button>
            </div>

            {/* CONTENEDOR MODULAR */}
            <div className="lg:col-span-9 bg-card border border-border/60 rounded-[24px] p-6 md:p-8 shadow-sm min-h-[420px]">
              {activeTab === "SRI" && <SriSettingsTab settings={settings} setSettings={setSettings} />}
              {activeTab === "CONTACT" && <ContactSettingsTab settings={settings} setSettings={setSettings} />}
              {activeTab === "BRAND" && <BrandSettingsTab settings={settings} setSettings={setSettings} />}
              {activeTab === "BOXES" && <BoxesSettingsTab settings={settings} setSettings={setSettings} />}
            </div>

          </div>
        )}

      </div>
    </AppLayout>
  )
}