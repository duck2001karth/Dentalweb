"use client"

import React from "react"
import { ShieldAlert, HelpCircle } from "lucide-react"

export function AuthFooter() {
  return (
    <footer className="w-full space-y-3 pt-4 text-center font-sans antialiased select-none">
      {/* Aviso de confidencialidad institucional */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="font-semibold text-foreground/80">
          Uso Exclusivo Interno y Confidencial
        </span>
      </div>

      <p className="px-6 text-[11px] text-muted-foreground/70 leading-relaxed max-w-sm mx-auto">
        El acceso no autorizado está restringido. Las acciones dentro del sistema 
        quedan registradas bajo auditoría para control clínico y tributario.
      </p>

      {/* Soporte y Versión */}
      <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground/60 pt-1 border-t border-border/40 max-w-xs mx-auto">
        <span>Carmo Dental v1.0</span>
        <span>•</span>
        <a 
          href="mailto:soporte@carmodental.com" 
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <HelpCircle className="w-3 h-3" />
          Soporte TI
        </a>
      </div>
    </footer>
  )
}