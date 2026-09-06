"use client"

import React from "react"
import { MapPin, Globe, Phone, Mail, Navigation, MessageCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface ContactSettingsTabProps {
  settings: any
  setSettings: React.Dispatch<React.SetStateAction<any>>
}

export function ContactSettingsTab({ settings, setSettings }: ContactSettingsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
      {/* Dirección */}
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-[#008bcd]" /> Dirección Física de la Clínica
        </Label>
        <Input 
          value={settings.address || ""} 
          onChange={(e) => setSettings({ ...settings, address: e.target.value })} 
          className="h-11 rounded-xl bg-background text-sm" 
          placeholder="Av. calle 123, Edificio Ejemplo, Oficina 456" 
        />
      </div>

      {/* Ciudad / Provincia */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#008bcd]" /> Ciudad / Provincia
        </Label>
        <Input 
          value={settings.city || ""} 
          onChange={(e) => setSettings({ ...settings, city: e.target.value })} 
          className="h-11 rounded-xl bg-background text-sm font-medium" 
          placeholder="Ej: Quito" 
        />
      </div>

      {/* País */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-[#008bcd]" /> País
        </Label>
        <Input 
          value={settings.country || ""} 
          onChange={(e) => setSettings({ ...settings, country: e.target.value })} 
          className="h-11 rounded-xl bg-background text-sm font-medium" 
          placeholder="Ej: Ecuador" 
        />
      </div>

      {/* Teléfono */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-[#008bcd]" /> Teléfono Convencional / Central
        </Label>
        <Input 
          value={settings.phone || ""} 
          onChange={(e) => setSettings({ ...settings, phone: e.target.value })} 
          className="h-11 rounded-xl bg-background font-mono text-sm" 
          placeholder="Ej: (02) 222-0000" 
        />
      </div>

      {/* WhatsApp */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-[#008bcd]" /> WhatsApp para Recordatorios
        </Label>
        <Input 
          value={settings.whatsappNumber || ""} 
          onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })} 
          className="h-11 rounded-xl bg-background font-mono text-sm" 
          placeholder="Ej: +593 99 899 0215" 
        />
      </div>

      {/* Correo Electrónico */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-[#008bcd]" /> Correo de Contacto y Reportes
        </Label>
        <Input 
          type="email" 
          value={settings.email || ""} 
          onChange={(e) => setSettings({ ...settings, email: e.target.value })} 
          className="h-11 rounded-xl bg-background text-sm" 
          placeholder="contacto@carmodental.com" 
        />
      </div>

      {/* Sitio Web */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-[#008bcd]" /> Sitio Web Oficial
        </Label>
        <Input 
          value={settings.website || ""} 
          onChange={(e) => setSettings({ ...settings, website: e.target.value })} 
          className="h-11 rounded-xl bg-background text-sm" 
          placeholder="https://clinicaejemplo.com" 
        />
      </div>
    </div>
  )
}