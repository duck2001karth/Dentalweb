"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

interface SriSettingsTabProps {
  settings: any
  setSettings: React.Dispatch<React.SetStateAction<any>>
}

export function SriSettingsTab({ settings, setSettings }: SriSettingsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold uppercase text-muted-foreground">Nombre Comercial de la Clínica *</Label>
        <Input 
          value={settings.clinicName} 
          onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })} 
          className="h-11 rounded-xl bg-background font-bold text-sm" 
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold uppercase text-muted-foreground">Razón Social (Legal) *</Label>
        <Input 
          value={settings.razonSocial} 
          onChange={(e) => setSettings({ ...settings, razonSocial: e.target.value })} 
          className="h-11 rounded-xl bg-background font-semibold text-sm" 
          placeholder="Ej: CARMODENTAL S.A.S." 
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold uppercase text-muted-foreground">RUC de la Clínica (13 Dígitos)</Label>
        <Input 
          value={settings.ruc} 
          onChange={(e) => setSettings({ ...settings, ruc: e.target.value })} 
          className="h-11 rounded-xl bg-background font-mono font-bold text-sm" 
          placeholder="1790000000001" 
          maxLength={13} 
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Establecimiento</Label>
          <Input 
            value={settings.estabCode} 
            onChange={(e) => setSettings({ ...settings, estabCode: e.target.value })} 
            className="h-11 rounded-xl bg-background font-mono text-center font-bold text-sm" 
            placeholder="001" 
            maxLength={3} 
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Punto Emisión</Label>
          <Input 
            value={settings.ptoEmiCode} 
            onChange={(e) => setSettings({ ...settings, ptoEmiCode: e.target.value })} 
            className="h-11 rounded-xl bg-background font-mono text-center font-bold text-sm" 
            placeholder="001" 
            maxLength={3} 
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold uppercase text-muted-foreground">Tasa IVA General (%)</Label>
        <Input 
          type="number" 
          value={settings.taxRate} 
          onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })} 
          className="h-11 rounded-xl bg-background font-mono font-bold text-sm" 
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold uppercase text-muted-foreground">Moneda Oficial</Label>
        <select 
          value={settings.currency} 
          onChange={(e) => setSettings({ ...settings, currency: e.target.value })} 
          className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-sm font-bold outline-none cursor-pointer"
        >
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
  )
}