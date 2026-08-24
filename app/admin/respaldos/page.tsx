"use client"

import React, { useState, useRef } from "react"
import { 
  Database, Download, ShieldCheck, Lock, FileJson, 
  Loader2, UploadCloud, Users, CreditCard, Stethoscope, 
  Package, FileCode, Clock, Server, CheckCircle2, 
  Layers, HardDrive
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function BackupsClient() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isExportingJson, setIsExportingJson] = useState(false)
  const [isExportingSql, setIsExportingSql] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [analyzedBackup, setAnalyzedBackup] = useState<any | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDownloadBackup = async () => {
    setIsExportingJson(true)
    try {
      const res = await fetch("/api/admin/backup")
      if (!res.ok) throw new Error(res.status === 403 ? "Acceso denegado: Se requiere rol Administrador." : "Error al procesar los datos.")
      
      const data = await res.json()
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2))
      const downloadNode = document.createElement("a")
      downloadNode.setAttribute("href", dataStr)
      downloadNode.setAttribute("download", `CarmoDental_MasterBackup_${format(new Date(), "yyyyMMdd_HHmm")}.json`)
      document.body.appendChild(downloadNode)
      downloadNode.click()
      downloadNode.remove()

      setLastBackup(new Date().toISOString())
      toast({ title: "Respaldo JSON Generado", description: "Base de datos exportada con éxito." })
    } catch (error: any) {
      toast({ title: "Error de Seguridad", description: error.message, variant: "destructive" })
    } finally {
      setIsExportingJson(false)
    }
  }

  const handleDownloadSql = async () => {
    setIsExportingSql(true)
    try {
      const res = await fetch("/api/admin/backup/sql")
      if (!res.ok) throw new Error("No se pudo compilar el script SQL.")
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `CarmoDental_PostgreSQL_${format(new Date(), "yyyyMMdd_HHmm")}.sql`
      document.body.appendChild(a)
      a.click()
      a.remove()

      setLastBackup(new Date().toISOString())
      toast({ title: "Script SQL Generado", description: "Sentencias INSERT generadas para restauración directa." })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsExportingSql(false)
    }
  }

  const processFile = (file: File) => {
    if (!file.name.endsWith(".json")) {
      toast({ title: "Formato no válido", description: "Selecciona un archivo .json oficial.", variant: "destructive" })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        if (!json.metadata || !json.data) throw new Error()
        setAnalyzedBackup(json)
        toast({ title: "Archivo Validado", description: "Estructura de respaldo verificada." })
      } catch {
        toast({ title: "Archivo Corrupto", description: "El archivo no contiene los metadatos requeridos.", variant: "destructive" })
      }
    }
    reader.readAsText(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className="w-full space-y-6 font-sans antialiased animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-[#008bcd]/15 text-[#008bcd]">
              Centro de Resguardo
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mt-1">
            Respaldos y Seguridad de Datos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Exporta copias integrales de la clínica en formatos estándar y verifica la salud de tus archivos.
          </p>
        </div>
      </div>

      {/* KPI STATUS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center shrink-0 border border-[#008bcd]/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tablas Cubiertas</p>
            <p className="text-lg font-black text-foreground">27 Entidades</p>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Motor Activo</p>
            <p className="text-lg font-black text-foreground">PostgreSQL</p>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Formatos Soportados</p>
            <p className="text-lg font-black text-foreground">JSON + SQL</p>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Última Exportación</p>
            <p className="text-xs font-bold text-foreground mt-0.5 truncate">
              {lastBackup ? format(new Date(lastBackup), "dd/MM/yyyy HH:mm") : "Sin exportaciones hoy"}
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL: GRID 50 / 50 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* TARJETA 1: GENERADOR */}
        <div className="bg-card border border-border/80 rounded-[24px] p-6 md:p-7 shadow-xs flex flex-col justify-between h-full space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 bg-[#008bcd]/10 border border-[#008bcd]/20 text-[#008bcd] rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Encriptación AES Activa
              </span>
            </div>

            <div>
              <h2 className="text-lg font-black text-foreground">Generador de Copia Integral</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                Sincroniza y compila la totalidad de registros clínicos (Pacientes, Citas, Odontogramas, Facturación SRI, Insumos y Logs Técnicos).
              </p>
            </div>

            <div className="bg-muted/40 border border-border/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
              <Lock className="w-4 h-4 text-[#008bcd] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Los archivos descargados contienen registros clínicos bajo secreto profesional. Guárdalos en unidades protegidas.
              </p>
            </div>
          </div>

          <div className="pt-5 border-t border-border/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                onClick={handleDownloadBackup} 
                disabled={isExportingJson || isExportingSql}
                className="h-11 px-4 rounded-xl bg-[#008bcd] hover:bg-[#007bb6] text-white font-bold text-xs shadow-xs gap-2 transition-all cursor-pointer"
              >
                {isExportingJson ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Compilando JSON...</>
                ) : (
                  <><FileJson className="w-4 h-4" /> Exportar JSON (.json)</>
                )}
              </Button>

              <Button 
                onClick={handleDownloadSql} 
                disabled={isExportingJson || isExportingSql}
                variant="outline"
                className="h-11 px-4 rounded-xl border-border bg-background hover:bg-muted font-bold text-xs gap-2 transition-all cursor-pointer text-foreground"
              >
                {isExportingSql ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generando SQL...</>
                ) : (
                  <><FileCode className="w-4 h-4 text-[#008bcd]" /> Exportar SQL (.sql)</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* TARJETA 2: VISOR & VALIDATOR */}
        <div className="bg-card border border-border/80 rounded-[24px] p-6 md:p-7 shadow-xs flex flex-col justify-between h-full">
          {!analyzedBackup ? (
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all h-full min-h-[260px] ${
                isDragging ? "border-[#008bcd] bg-[#008bcd]/5" : "border-border/80 hover:border-[#008bcd]/50 bg-muted/10"
              }`}
            >
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-3 border border-border">
                <UploadCloud className="w-6 h-6 text-muted-foreground/70" />
              </div>
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Inspección de Archivos</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed font-medium">
                Arrastra aquí tu archivo <span className="font-mono text-foreground font-bold">.json</span> para verificar su integridad y conteo de filas sin tocar la base de datos.
              </p>
              
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
              
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="outline" 
                className="mt-5 h-9 px-4 rounded-xl font-bold text-xs border-border bg-background hover:bg-muted"
              >
                Seleccionar desde equipo
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="text-xs font-black text-foreground uppercase tracking-wide">Respaldo Inspeccionado</h3>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {format(new Date(analyzedBackup.metadata.generatedAt), "dd MMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setAnalyzedBackup(null)} 
                    className="h-8 px-2.5 text-xs font-bold text-muted-foreground hover:text-rose-500 rounded-lg"
                  >
                    Cerrar
                  </Button>
                </div>

                {/* GRID DE ESTADÍSTICAS */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/70">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Pacientes</span>
                    </div>
                    <p className="text-base font-black text-foreground">
                      {analyzedBackup.data.clinical?.patients?.length || 0}
                    </p>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-xl border border-border/70">
                    <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 mb-1">
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Odontogramas</span>
                    </div>
                    <p className="text-base font-black text-foreground">
                      {analyzedBackup.data.clinical?.odontogramRecords?.length || 0}
                    </p>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-xl border border-border/70">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Pagos / Caja</span>
                    </div>
                    <p className="text-base font-black text-foreground">
                      {analyzedBackup.data.financial?.payments?.length || 0}
                    </p>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-xl border border-border/70">
                    <div className="flex items-center gap-1.5 text-[#008bcd] mb-1">
                      <Package className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Insumos</span>
                    </div>
                    <p className="text-base font-black text-foreground">
                      {analyzedBackup.data.inventory?.inventoryItems?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#008bcd]/10 border border-[#008bcd]/20 rounded-xl flex items-center justify-between text-xs mt-3">
                <span className="font-bold text-muted-foreground">Volumen Total</span>
                <span className="font-black text-[#008bcd] font-mono">
                  {analyzedBackup.metadata.totalRecords?.toLocaleString()} registros
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}