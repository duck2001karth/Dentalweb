"use client"

import React from "react"
import { MapPin, Globe, Phone, Mail, Navigation, MessageCircle, Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ContactSettingsTabProps {
  settings: any
  setSettings: React.Dispatch<React.SetStateAction<any>>
}

export function ContactSettingsTab({ settings, setSettings }: ContactSettingsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
      
      {/* 1. Direcciones y Zonas */}
      <div className="space-y-5 md:col-span-2 p-5 bg-muted/20 border border-border/60 rounded-2xl">
        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary" /> Ubicación y Zona Horaria
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[11px] font-bold text-foreground">Dirección Física Completa</Label>
            <Input 
              value={settings.address || ""} 
              onChange={(e) => setSettings({ ...settings, address: e.target.value })} 
              className="h-10 rounded-xl bg-background text-sm" 
              placeholder="Av. calle 123, Edificio Ejemplo, Oficina 456" 
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-foreground">Ciudad / Provincia</Label>
            <Input 
              value={settings.city || ""} 
              onChange={(e) => setSettings({ ...settings, city: e.target.value })} 
              className="h-10 rounded-xl bg-background text-sm font-medium" 
              placeholder="Ej: Quito" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-foreground">País de Operación</Label>
            <Input 
              value={settings.country || ""} 
              onChange={(e) => setSettings({ ...settings, country: e.target.value })} 
              className="h-10 rounded-xl bg-background text-sm font-medium" 
              placeholder="Ej: Ecuador" 
            />
          </div>

          {/* INTEGRACIÓN DE LA ZONA HORARIA GLOBAL */}
          <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-border/40">
            <Label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Zona Horaria Oficial (Timezone)
            </Label>
            <p className="text-[10px] text-muted-foreground mb-1.5">Sincroniza la agenda de todos los especialistas bajo la hora legal de la sede médica.</p>
            <Select 
              value={settings.timezone || "America/Guayaquil"} 
              onValueChange={(val) => setSettings({ ...settings, timezone: val })}
            >
              <SelectTrigger className="h-10 rounded-xl text-xs font-semibold bg-background border-border">
                <SelectValue placeholder="Selecciona la zona horaria" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border/80 z-[120]">
                <SelectItem value="America/Guayaquil" className="text-xs font-medium cursor-pointer">Ecuador Continental (UTC-5)</SelectItem>
                <SelectItem value="America/La_Paz" className="text-xs font-medium cursor-pointer">Bolivia (UTC-4)</SelectItem>
                <SelectItem value="America/Bogota" className="text-xs font-medium cursor-pointer">Colombia (UTC-5)</SelectItem>
                <SelectItem value="America/Lima" className="text-xs font-medium cursor-pointer">Perú (UTC-5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 2. Contactos Digitales */}
      <div className="space-y-4 md:col-span-2 p-5 bg-muted/20 border border-border/60 rounded-2xl">
        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
          <Phone className="w-4 h-4 text-emerald-500" /> Vías de Contacto
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
               Teléfono Central
            </Label>
            <Input 
              value={settings.phone || ""} 
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })} 
              className="h-10 rounded-xl bg-background font-mono text-sm" 
              placeholder="Ej: (02) 222-0000" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
               <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Institucional
            </Label>
            <Input 
              value={settings.whatsappNumber || ""} 
              onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })} 
              className="h-10 rounded-xl bg-background font-mono text-sm" 
              placeholder="Ej: +593 99 899 0215" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
               <Mail className="w-3.5 h-3.5" /> Correo Oficial
            </Label>
            <Input 
              type="email" 
              value={settings.email || ""} 
              onChange={(e) => setSettings({ ...settings, email: e.target.value })} 
              className="h-10 rounded-xl bg-background text-sm" 
              placeholder="contacto@carmodental.com" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
               <Globe className="w-3.5 h-3.5" /> Sitio Web
            </Label>
            <Input 
              value={settings.website || ""} 
              onChange={(e) => setSettings({ ...settings, website: e.target.value })} 
              className="h-10 rounded-xl bg-background text-sm" 
              placeholder="https://clinicaejemplo.com" 
            />
          </div>
        </div>
      </div>
    </div>
  )
}