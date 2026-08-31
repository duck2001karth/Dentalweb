"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface ContactSettingsTabProps {
  settings: any
  setSettings: React.Dispatch<React.SetStateAction<any>>
}

export function ContactSettingsTab({ settings, setSettings }: ContactSettingsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-[11px] font-bold uppercase text-muted-foreground">Dirección Física de la Clínica</Label>
        <Input 
          value={settings.address} 
          onChange={(e) => setSettings({ ...settings, address: e.target.value })} 
          className="h-11 rounded-xl bg-background text-sm" 
          placeholder="Ej: Av. Amazonas y República, Quito" 
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold uppercase text-muted-foreground">Teléfono Convencional</Label>
        <Input 
          value={settings.phone} 
          onChange={(e) => setSettings({ ...settings, phone: e.target.value })} 
          className="h-11 rounded-xl bg-background font-mono text-sm" 
          placeholder="(02) 222-0000" 
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold uppercase text-muted-foreground">WhatsApp para Recordatorios</Label>
        <Input 
          value={settings.whatsappNumber} 
          onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })} 
          className="h-11 rounded-xl bg-background font-mono text-sm" 
          placeholder="+593 999999999" 
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold uppercase text-muted-foreground">Correo de Facturación</Label>
        <Input 
          type="email" 
          value={settings.email} 
          onChange={(e) => setSettings({ ...settings, email: e.target.value })} 
          className="h-11 rounded-xl bg-background text-sm" 
          placeholder="facturacion@carmodental.com" 
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold uppercase text-muted-foreground">Sitio Web Oficial</Label>
        <Input 
          value={settings.website} 
          onChange={(e) => setSettings({ ...settings, website: e.target.value })} 
          className="h-11 rounded-xl bg-background text-sm" 
          placeholder="https://carmodental.com" 
        />
      </div>
    </div>
  )
}