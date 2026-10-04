"use client"

import React from "react"
import { Building2, Receipt, Percent, FileCheck, Coins, ShieldCheck } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SriSettingsTabProps {
  settings: any
  setSettings: React.Dispatch<React.SetStateAction<any>>
}

export function SriSettingsTab({ settings, setSettings }: SriSettingsTabProps) {
  const brandColor = settings.primaryColor || "#008bcd"

  const handleTaxRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === "") {
      setSettings({ ...settings, taxRate: "" })
      return
    }
    setSettings({ ...settings, taxRate: parseFloat(val) })
  }

  const rucLength = (settings.ruc || "").length

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* 1. Identidad Fiscal */}
      <div className="p-5 bg-card border border-border/70 rounded-2xl space-y-4 shadow-2xs">
        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4" style={{ color: brandColor }} /> Identidad Jurídica y Razón Social
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Nombre Comercial de la Clínica *</Label>
            <Input 
              value={settings.clinicName || ""} 
              onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })} 
              className="h-10 rounded-xl bg-background font-bold text-xs border-border/80" 
              placeholder="Ej: Carmo Dental"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Razón Social (Denominación Legal) *</Label>
            <Input 
              value={settings.razonSocial || ""} 
              onChange={(e) => setSettings({ ...settings, razonSocial: e.target.value })} 
              className="h-10 rounded-xl bg-background font-semibold text-xs border-border/80" 
              placeholder="Ej: CARMODENTAL S.A.S." 
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-muted-foreground" /> RUC Oficial (13 Dígitos) *
              </Label>
              <span className={`text-[10px] font-mono font-bold ${rucLength === 13 ? "text-emerald-500" : "text-amber-500"}`}>
                {rucLength}/13 dígitos
              </span>
            </div>
            <Input 
              value={settings.ruc || ""} 
              onChange={(e) => setSettings({ ...settings, ruc: e.target.value })} 
              className="h-10 rounded-xl bg-background font-mono font-bold text-xs border-border/80 tracking-wider" 
              placeholder="1790000000001" 
              maxLength={13} 
            />
          </div>
        </div>
      </div>

      {/* 2. Parámetros de Facturación y Tributos */}
      <div className="p-5 bg-card border border-border/70 rounded-2xl space-y-4 shadow-2xs">
        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <FileCheck className="w-4 h-4" style={{ color: brandColor }} /> Puntos de Emisión y Régimen de Impuestos
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-foreground">Establecimiento</Label>
            <Input 
              value={settings.estabCode || ""} 
              onChange={(e) => setSettings({ ...settings, estabCode: e.target.value })} 
              className="h-10 rounded-xl bg-background font-mono text-center font-bold text-xs" 
              placeholder="001" 
              maxLength={3} 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-foreground">Punto Emisión</Label>
            <Input 
              value={settings.ptoEmiCode || ""} 
              onChange={(e) => setSettings({ ...settings, ptoEmiCode: e.target.value })} 
              className="h-10 rounded-xl bg-background font-mono text-center font-bold text-xs" 
              placeholder="001" 
              maxLength={3} 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-foreground flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-muted-foreground" /> Tasa IVA (%)
            </Label>
            <Input 
              type="number" 
              value={settings.taxRate ?? ""} 
              onChange={handleTaxRateChange} 
              className="h-10 rounded-xl bg-background font-mono font-bold text-xs" 
              placeholder="15"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-foreground flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-muted-foreground" /> Moneda Base
            </Label>
            <Select 
              value={settings.currency || "USD"} 
              onValueChange={(val) => setSettings({ ...settings, currency: val })}
            >
              <SelectTrigger className="h-10 rounded-xl bg-background font-bold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border/80 text-xs font-semibold">
                <SelectItem value="USD">USD ($) Dólares</SelectItem>
                <SelectItem value="BOB">BOB (Bs) Bolivianos</SelectItem>
                <SelectItem value="COP">COP ($) Pesos Col.</SelectItem>
                <SelectItem value="MXN">MXN ($) Pesos Mex.</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Switch Contabilidad */}
        <div className="pt-2">
          <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/60 rounded-xl">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <p className="text-xs font-bold text-foreground">Obligado a Llevar Contabilidad</p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Exigido por el SRI para personas jurídicas y sociedades médicas.
              </p>
            </div>
            <Switch 
              checked={settings.obligadoContab || false} 
              onCheckedChange={(c) => setSettings({ ...settings, obligadoContab: c })} 
              style={settings.obligadoContab ? { backgroundColor: brandColor } : undefined}
            />
          </div>
        </div>
      </div>

    </div>
  )
}