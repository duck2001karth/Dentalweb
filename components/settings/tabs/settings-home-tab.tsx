"use client"

import React from "react"
import { 
  Sparkles, 
  User, 
  Palette, 
  Clock, 
  FileSignature, 
  ArrowRight, 
  ShieldCheck 
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SettingsHomeTabProps {
  doctorName?: string
  accentColor?: string
  isDoctor: boolean
  onNavigateTab: (tabId: string) => void
  hasSignature: boolean
  hasLicense: boolean
}

export function SettingsHomeTab({
  doctorName = "Doctor",
  accentColor = "#008bcd",
  isDoctor,
  onNavigateTab,
  hasSignature,
  hasLicense,
}: SettingsHomeTabProps) {
  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-200 font-sans">
      
      {/* Banner de Bienvenida */}
      <div 
        className="p-6 rounded-3xl border relative overflow-hidden transition-all"
        style={{
          background: `linear-gradient(135deg, ${accentColor}15 0%, transparent 100%)`,
          borderColor: `${accentColor}30`,
        }}
      >
        <div className="flex items-start gap-4">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs"
            style={{
              backgroundColor: `${accentColor}20`,
              borderColor: `${accentColor}40`,
              color: accentColor,
            }}
          >
            <Sparkles className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-foreground tracking-tight">
              Panel de Configuración, {doctorName}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Administra tu perfil facultativo, personaliza el tema de tu estación de trabajo y calibra las preferencias operativas del sistema dental.
            </p>
          </div>
        </div>
      </div>

      {/* Tarjetas de Acceso Rápido */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
          Accesos Rápidos Recomendados
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          
          {/* Tarjeta Apariencia */}
          <div 
            onClick={() => onNavigateTab("appearance")}
            className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center border"
                style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30`, color: accentColor }}
              >
                <Palette className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <p className="text-xs font-black text-foreground">Tema y Color de Calendario</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Elige modo claro/oscuro y el color de tus citas.</p>
            </div>
          </div>

          {/* Tarjeta Información Personal */}
          <div 
            onClick={() => onNavigateTab("profile")}
            className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center border"
                style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30`, color: accentColor }}
              >
                <User className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <p className="text-xs font-black text-foreground">Información Personal</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Actualiza foto de perfil y número de teléfono móvil.</p>
            </div>
          </div>

          {/* Tarjeta Firma Médica (Si es Doctor) */}
          {isDoctor && (
            <div 
              onClick={() => onNavigateTab("signature")}
              className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center border"
                  style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30`, color: accentColor }}
                >
                  <FileSignature className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-muted/60 text-muted-foreground">
                  {hasSignature ? "Registrada" : "Pendiente"}
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-foreground">Firma y Sello Clínico</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Rúbrica estampada en recetas y presupuestos odontológicos.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}