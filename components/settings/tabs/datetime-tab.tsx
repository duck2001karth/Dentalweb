"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Clock, Globe2, Loader2 } from "lucide-react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface DatetimeTabProps {
  accentColor?: string
}

export function DatetimeTab({ accentColor = "#008bcd" }: DatetimeTabProps) {
  const { theme, resolvedTheme } = useTheme()
  const isDark = (resolvedTheme || theme) === "dark"
  const { toast } = useToast()

  const [use24Hour, setUse24Hour] = useState(true)
  const [timezone, setTimezone] = useState("America/Guayaquil")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const savedFormat = localStorage.getItem("app_time_format")
    const savedTz = localStorage.getItem("app_timezone")
    if (savedFormat) setUse24Hour(savedFormat === "24h")
    if (savedTz) setTimezone(savedTz)
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem("app_time_format", use24Hour ? "24h" : "12h")
      localStorage.setItem("app_timezone", timezone)
      
      // Aquí puedes agregar la llamada a tu API para guardar en base de datos
      await new Promise(resolve => setTimeout(resolve, 600)) 

      toast({
        title: "Ajustes de tiempo actualizados",
        description: "Se guardó el formato y la zona horaria correctamente.",
      })
    } catch {
      toast({
        title: "Error al guardar",
        description: "No se pudieron aplicar los ajustes de fecha y hora.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={`space-y-6 max-w-2xl font-sans animate-in fade-in duration-200 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
      
      {/* Cabecera */}
      <div className={`border-b pb-4 ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
        <h3 className="text-xl font-bold flex items-center gap-2.5">
          <Clock className="w-5 h-5" style={{ color: accentColor }} />
          Fecha y Hora
        </h3>
        <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Configura el formato de visualización de la agenda quirúrgica y la zona horaria principal de la clínica.
        </p>
      </div>

      <div className="space-y-6">
        {/* Zona Horaria */}
        <div className="space-y-2">
          <Label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            <Globe2 className="w-4 h-4 opacity-70" /> Zona Horaria de Atención
          </Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className={`h-11 rounded-xl text-xs font-semibold ${isDark ? "bg-[#070d18] border-[#1e293b]" : "bg-white border-slate-200"}`}>
              <SelectValue placeholder="Selecciona la zona horaria" />
            </SelectTrigger>
            <SelectContent className={`rounded-xl border ${isDark ? "bg-[#070d18] border-[#1e293b]" : "bg-white border-slate-200"}`}>
              <SelectItem value="America/Guayaquil" className="text-xs font-medium cursor-pointer">Ecuador Continental (UTC-5)</SelectItem>
              <SelectItem value="America/La_Paz" className="text-xs font-medium cursor-pointer">Bolivia (UTC-4)</SelectItem>
              <SelectItem value="America/Bogota" className="text-xs font-medium cursor-pointer">Colombia (UTC-5)</SelectItem>
              <SelectItem value="America/Lima" className="text-xs font-medium cursor-pointer">Perú (UTC-5)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Formato 24h */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${isDark ? "bg-[#070d18] border-[#1e293b]" : "bg-slate-50 border-slate-200"}`}>
          <div className="space-y-1">
            <Label className="text-sm font-bold">Formato de 24 Horas</Label>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Visualizar horas como 14:00 en lugar de 02:00 PM
            </p>
          </div>
          <Switch 
            checked={use24Hour} 
            onCheckedChange={setUse24Hour} 
            style={use24Hour ? { backgroundColor: accentColor } : undefined}
          />
        </div>
      </div>

      <div className={`pt-4 border-t flex justify-end ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          style={{ backgroundColor: accentColor }}
          className="text-white rounded-xl text-xs font-bold h-10 px-6 shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 hover:opacity-90 border-0"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar Ajustes
        </Button>
      </div>
    </div>
  )
}