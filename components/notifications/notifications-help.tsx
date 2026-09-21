"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { 
  HelpCircle, BookOpen, MessageCircle, ExternalLink, 
  Search, ChevronRight
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useClinicSettings } from "@/config/clinic-settings"

// Guías predefinidas del sistema
const GUÍAS_SISTEMA = [
  {
    id: "agenda",
    title: "Gestión de Agenda y Citas",
    category: "Agenda",
    duration: "3 min lectura",
    description: "Cómo agendar citas, asignar sillones dentales y configurar recordatorios para pacientes.",
    steps: [
      "Dirígete al módulo 'Agenda de Citas' o presiona 'Dar cita' en el panel superior.",
      "Busca al paciente por nombre o número de cédula.",
      "Selecciona el especialista a cargo y el sillón (Box) de atención disponible.",
      "Configura la hora de inicio (el sistema calcula automáticamente el bloque de tiempo).",
      "Haz clic en 'Confirmar Cita' para registrarla en el calendario diario."
    ]
  },
  {
    id: "historia",
    title: "Creación de Ficha e Historia Clínica",
    category: "Clínica",
    duration: "4 min lectura",
    description: "Registro de antecedentes patológicos, odontograma digital y archivo de evoluciones.",
    steps: [
      "Entra al perfil del paciente desde el buscador global o la sección 'Pacientes'.",
      "Accede a la pestaña 'Historia Clínica' para completar antecedentes y anamnesis.",
      "Usa la pestaña 'Odontograma' para marcar piezas dentales, caries o restauraciones.",
      "En 'Evoluciones', agrega notas de tratamiento diario y firma digital."
    ]
  },
  {
    id: "reprogramar",
    title: "Reprogramación y Cancelación de Citas",
    category: "Agenda",
    duration: "2 min lectura",
    description: "Procedimiento correcto para reagendar turnos sin perder el historial médico.",
    steps: [
      "Ubica la cita en el Dashboard o presiona el botón 'Reprogramar'.",
      "Selecciona la cita previa del paciente (incluye turnos de hasta 15 días atrás).",
      "Elige la nueva fecha, bloque horario y motivo del cambio.",
      "Guarda los cambios para liberar el sillón previo automáticamente."
    ]
  },
  {
    id: "cajas",
    title: "Caja, Pagos y Cobros",
    category: "Administración",
    duration: "3 min lectura",
    description: "Registro de cobros de tratamientos, abonos y emisión de recibos.",
    steps: [
      "Ingresa al módulo 'Caja y Arqueo' en la barra lateral.",
      "Selecciona 'Nuevo Movimiento' para registrar un ingreso por tratamiento.",
      "Asocia el paciente y el método de pago (Efectivo, Tarjeta o Transferencia).",
      "Revisa el arqueo diario al finalizar la jornada laboral."
    ]
  }
]

export function NotificationsHelp() {
  const { data: session } = useSession()
  const { settings } = useClinicSettings()

  const currentUser = session?.user as any
  const accentColor = currentUser?.calendarColor || "#008bcd"

  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGuia, setSelectedGuia] = useState<typeof GUÍAS_SISTEMA[0] | null>(null)

  const whatsappSupportNumber = "59170000000"

  const handleOpenSupport = () => {
    const clinicName = settings?.clinicName || "Carmo Dental"
    const userName = currentUser?.name || "Doctor/a"
    const text = encodeURIComponent(
      `Hola Soporte Técnico, me comunico desde la clínica *${clinicName}*.\nUsuario: *${userName}*.\nNecesito asistencia con el sistema.`
    )
    window.open(`https://wa.me/${whatsappSupportNumber}?text=${text}`, "_blank")
  }

  const guiasFiltradas = GUÍAS_SISTEMA.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* BOTÓN DROPDOWN DEL HEADER */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-center outline-none cursor-pointer"
            title="Centro de Ayuda"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          align="end" 
          className="w-60 bg-card border-border/80 shadow-2xl rounded-2xl p-1.5 z-[120]"
        >
          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-2.5 py-1.5">
            Centro de Ayuda
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/60" />

          {/* TUTORIALES Y GUÍAS */}
          <DropdownMenuItem
            onClick={() => {
              setSelectedGuia(null)
              setIsTutorialModalOpen(true)
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-xs font-bold text-foreground hover:bg-accent/60 transition-colors group"
          >
            <BookOpen 
              className="w-4 h-4 transition-colors" 
              style={{ color: accentColor }} 
            />
            <span>Tutoriales y Guías</span>
          </DropdownMenuItem>

          {/* SOPORTE TÉCNICO */}
          <DropdownMenuItem
            onClick={handleOpenSupport}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-bold text-foreground hover:bg-accent/60 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Soporte Técnico</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* MODAL TUTORIALES Y GUÍAS */}
      <Dialog open={isTutorialModalOpen} onOpenChange={setIsTutorialModalOpen}>
        <DialogContent className="sm:max-w-[760px] p-0 bg-card border-border/80 rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
          
          {/* CABECERA */}
          <div 
            className="px-6 py-5 border-b border-border/80"
            style={{
              background: `linear-gradient(to right, ${accentColor}18, transparent)`
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2.5">
                <div 
                  className="p-2 rounded-xl border"
                  style={{
                    backgroundColor: `${accentColor}18`,
                    borderColor: `${accentColor}35`,
                    color: accentColor,
                  }}
                >
                  <BookOpen className="w-5 h-5 stroke-[2.5]" />
                </div>
                Guías Rápidas y Tutoriales
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium mt-0.5">
                Aprende paso a paso cómo utilizar las funciones clínicas y administrativas del sistema.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar guías por tema (ej. agenda, odontograma, pagos)..."
                className="pl-10 h-10 bg-background/80 border-border/80 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {/* CONTENIDO CON SCROLL COMPLETAMENTE OCULTO */}
          <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {selectedGuia ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => setSelectedGuia(null)}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                >
                  ← Volver a todas las guías
                </button>

                <div className="border-b border-border/80 pb-4">
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border"
                      style={{
                        backgroundColor: `${accentColor}15`,
                        borderColor: `${accentColor}30`,
                        color: accentColor,
                      }}
                    >
                      {selectedGuia.category}
                    </span>
                    <span className="text-[11px] text-muted-foreground">• {selectedGuia.duration}</span>
                  </div>
                  <h3 className="text-lg font-black text-foreground mt-2">{selectedGuia.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{selectedGuia.description}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Pasos a seguir:
                  </h4>
                  <div className="space-y-2.5">
                    {selectedGuia.steps.map((paso, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/60"
                      >
                        <div 
                          className="w-6 h-6 rounded-lg text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: accentColor }}
                        >
                          {index + 1}
                        </div>
                        <p className="text-xs font-medium text-foreground leading-relaxed pt-0.5">
                          {paso}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {guiasFiltradas.length === 0 ? (
                  <div className="col-span-2 py-10 text-center text-xs text-muted-foreground">
                    No se encontraron tutoriales con el término "{searchQuery}".
                  </div>
                ) : (
                  guiasFiltradas.map((guia) => (
                    <div
                      key={guia.id}
                      onClick={() => setSelectedGuia(guia)}
                      className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-accent/40 transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md active:scale-[0.99]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span 
                            className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border"
                            style={{
                              backgroundColor: `${accentColor}15`,
                              borderColor: `${accentColor}30`,
                              color: accentColor,
                            }}
                          >
                            {guia.category}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">{guia.duration}</span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground mt-2.5 transition-colors line-clamp-1">
                          {guia.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-normal">
                          {guia.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50 text-[11px] font-bold" style={{ color: accentColor }}>
                        <span>Ver guía completa</span>
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* PIE */}
          <div className="px-6 py-3.5 border-t border-border/80 bg-muted/20 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">
              ¿Tienes una duda técnica adicional?
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsTutorialModalOpen(false)
                handleOpenSupport()
              }}
              className="text-xs font-bold rounded-xl h-8 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
              Contactar Soporte
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}