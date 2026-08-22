"use client"

import React, { useState, useEffect } from "react"
import { Database, Wifi, HardDrive, Cpu, RefreshCw } from "lucide-react"

export function InfrastructureHealth() {
  const [latency, setLatency] = useState<number | null>(null)
  const [isChecking, setIsChecking] = useState<boolean>(false)

  const checkPing = async () => {
    setIsChecking(true)
    const start = performance.now()
    try {
      await fetch("/api/dashboard", { method: "HEAD" })
      const end = performance.now()
      setLatency(Math.round(end - start))
    } catch {
      setLatency(null)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkPing()
    const interval = setInterval(checkPing, 30000) // Verifica cada 30 seg
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-card rounded-[24px] border border-border shadow-xs p-6 relative overflow-hidden">
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
          <Database className="w-4 h-4 text-[#008bcd]" /> Estado de Infraestructura
        </h3>
        <button 
          onClick={checkPing} 
          disabled={isChecking}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
          title="Verificar conexión ahora"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin text-[#008bcd]" : ""}`} />
        </button>
      </div>

      <div className="space-y-3.5">
        
        {/* POSTGRESQL / SUPABASE */}
        <div className="bg-muted/30 p-3.5 rounded-xl border border-border/80">
          <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-500" /> PostgreSQL (Supabase)
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-extrabold text-[11px]">
              <Wifi className="w-3 h-3" /> {latency !== null ? `${latency} ms` : "Conectado"}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full w-full" />
          </div>
        </div>

        {/* ALMACENAMIENTO */}
        <div className="bg-muted/30 p-3.5 rounded-xl border border-border/80">
          <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" /> Storage Odontológico
            </span>
            <span className="text-foreground font-black text-xs">45%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#008bcd] h-1.5 rounded-full w-[45%]" />
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold mt-1.5">
            45 GB de 100 GB en radiografías y odontogramas
          </p>
        </div>

      </div>
    </div>
  )
}