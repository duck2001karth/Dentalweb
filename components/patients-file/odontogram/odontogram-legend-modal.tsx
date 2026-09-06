"use client"

import React from "react"
import { 
  HelpCircle, CheckCircle2, AlertCircle, 
  Layers, ShieldAlert, Sparkles, MousePointerClick 
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function OdontogramLegendModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-10 rounded-xl bg-background border-border/80 text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer shadow-xs transition-all"
        >
          <HelpCircle className="w-4 h-4 text-[#008bcd]" />
          <span className="hidden sm:inline">Guía de Simbología</span>
        </Button>
      </DialogTrigger>

      {/* Modal Horizontal Ancho */}
      <DialogContent className="sm:max-w-4xl bg-card border-border/80 rounded-2xl p-6 shadow-2xl overflow-hidden">
        <DialogHeader className="border-b border-border/70 pb-3">
          <DialogTitle className="text-base font-black uppercase text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#008bcd]" /> Convenciones y Simbología del Odontograma
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Estándar institucional de colores y códigos anatómicos por superficies dentales.
          </DialogDescription>
        </DialogHeader>

        {/* Layout Horizontal en 2 Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
        
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-2.5">
              <p className="font-black uppercase text-muted-foreground text-[10px] tracking-wider">
                Código Cromático Clínico
              </p>
              <div className="p-3 rounded-xl border border-rose-500/25 bg-rose-500/10 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide text-[11px]">
                    Color Rojo: Lesión / Afección Activa
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Indica patología presente o procedimiento pendiente por realizar (ej: caries, fracturas o exodoncias indicadas).
                  </p>
                </div>
              </div>

              {/* Azul */}
              <div className="p-3 rounded-xl border border-blue-500/25 bg-blue-500/10 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#008bcd] shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-[#008bcd] uppercase tracking-wide text-[11px]">
                    Color Azul: Tratamiento Existente
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Procedimientos realizados previamente en buen estado (ej: resinas curadas, sellantes o coronas definitivas).
                  </p>
                </div>
              </div>
            </div>

            {/* Caja de Ayuda / Interacción */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1.5">
              <p className="font-black uppercase text-foreground text-[11px] flex items-center gap-1.5">
                <MousePointerClick className="w-3.5 h-3.5 text-[#008bcd]" /> ¿Cómo marcar caras y superficies?
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[10.5px] leading-relaxed">
                <li>Haz clic en cualquiera de los triángulos o el centro para marcar <b>Oclusal/Incisal, Vestibular, Lingual/Palatina, Mesial o Distal</b>.</li>
                <li>Puedes seleccionar múltiples caras a la vez (ej: <b>Oclusal + Mesial</b>).</li>
                <li>Para afecciones globales (Extracciones o Coronas), elige <b>&quot;Toda la pieza&quot;</b>.</li>
              </ul>
            </div>
          </div>

          {/* COLUMNA DERECHA: Simbología Global de la Pieza */}
          <div className="space-y-2.5">
            <p className="font-black uppercase text-muted-foreground text-[10px] tracking-wider">
              Simbología Global de la Pieza Dental
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Extracción */}
              <div className="p-3 rounded-xl border border-border/70 bg-muted/20 flex flex-col justify-between">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center font-black text-rose-500 font-mono text-sm border border-rose-500/25">
                    ✕
                  </div>
                  <p className="font-bold text-foreground text-xs">Cruz Roja (✕)</p>
                </div>
                <p className="text-[10.5px] text-muted-foreground">
                  Extracción Indicada (pieza programada para exodoncia).
                </p>
              </div>

              {/* Ausente */}
              <div className="p-3 rounded-xl border border-border/70 bg-muted/20 flex flex-col justify-between">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-500/10 flex items-center justify-center font-black text-slate-500 font-mono text-sm border border-slate-500/25">
                    ✕
                  </div>
                  <p className="font-bold text-foreground text-xs">Cruz Azul / Gris (✕)</p>
                </div>
                <p className="text-[10.5px] text-muted-foreground">
                  Pieza Ausente (perdida o extraída anteriormente).
                </p>
              </div>

              {/* Diente Sano */}
              <div className="p-3 rounded-xl border border-border/70 bg-muted/20 flex flex-col justify-between">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/25">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-foreground text-xs">Pieza Sana</p>
                </div>
                <p className="text-[10.5px] text-muted-foreground">
                  Esmalte íntegro sin patologías ni tratamientos requeridos.
                </p>
              </div>

              {/* Corona / Prótesis */}
              <div className="p-3 rounded-xl border border-border/70 bg-muted/20 flex flex-col justify-between">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/25">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-foreground text-xs">Corona / Prótesis</p>
                </div>
                <p className="text-[10.5px] text-muted-foreground">
                  Rehabilitación protésica, incrustación o muñón periférico.
                </p>
              </div>
            </div>

            {/* Tip Odontológico */}
            <div className="p-3 rounded-xl border border-border/60 bg-background/50 text-[10.5px] text-muted-foreground">
              <span className="font-bold text-foreground">Nota clínica:</span> El modo <b className="text-[#008bcd]">Diagnóstico</b> registra el estado inicial del paciente al ingresar, mientras que el modo <b className="text-[#008bcd]">Evolución</b> refleja los tratamientos concluidos durante las citas.
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}