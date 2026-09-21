"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Send, Printer, Edit, AlertCircle, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PrintPatientInfoModal } from "./prints/print-info"

interface PatientDemographicsCardProps {
  patient: any
  pastAppointmentsCount: number
  upcomingAppointmentsCount: number
  onEditPatient: () => void
  onDeleteRequest?: () => void
  userRole?: string
}

export function PatientDemographicsCard({
  patient,
  pastAppointmentsCount,
  upcomingAppointmentsCount,
  onEditPatient,
  onDeleteRequest,
  userRole = "DOCTOR",
}: PatientDemographicsCardProps) {
  const [activeSection, setActiveSection] = useState<"general" | "contact" | "health" | "emergency">("general")
  
  // Validación robusta para ambos formatos del rol de Administrador
  const normalizedRole = String(userRole || "").toUpperCase().trim()
  const isAdmin = normalizedRole === "ADMIN" || normalizedRole === "ADMINISTRACION"

  const fullName = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Paciente"
  const formattedBirth = patient?.birthDate
    ? format(new Date(patient.birthDate), "MMM dd, yyyy", { locale: es })
    : "No registrado"
  const formattedRegister = patient?.createdAt
    ? format(new Date(patient.createdAt), "MMM dd, yyyy", { locale: es })
    : "Reciente"

  const handleOpenWhatsApp = () => {
    const clean = patient?.phone?.replace(/\D/g, "")
    if (clean) window.open(`https://wa.me/${clean}`, "_blank")
  }

  return (
    <div className="bg-card border border-border/80 rounded-[24px] p-6 shadow-xs relative">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* PANEL IZQUIERDO */}
        <div className="md:col-span-4 flex flex-col items-center text-center md:border-r md:border-border/60 md:pr-6">
          <div className="relative mb-3">
            {patient?.photoUrl ? (
              <img
                src={patient.photoUrl}
                alt={fullName}
                className="w-20 h-20 rounded-full object-cover border-2 border-border shadow-xs"
              />
            ) : (
              <div 
                style={{ backgroundColor: "var(--doctor-accent, #008bcd)" }}
                className="w-20 h-20 rounded-full text-white flex items-center justify-center font-bold text-2xl shadow-xs"
              >
                {patient?.firstName?.charAt(0).toUpperCase() || "P"}
              </div>
            )}
          </div>

          <h2 className="text-base font-bold text-foreground tracking-tight leading-tight">
            {fullName}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
            {patient?.email || "Sin correo electrónico"}
          </p>

          <div className="grid grid-cols-2 w-full max-w-[210px] py-2.5 my-3 border-y border-border/60">
            <div className="border-r border-border/60 px-2">
              <span className="text-base font-bold text-foreground">{pastAppointmentsCount}</span>
              <p className="text-[10px] text-muted-foreground font-medium">Pasadas</p>
            </div>
            <div className="px-2">
              <span className="text-base font-bold text-foreground">{upcomingAppointmentsCount}</span>
              <p className="text-[10px] text-muted-foreground font-medium">Próximas</p>
            </div>
          </div>
          
          <Button
            type="button"
            onClick={handleOpenWhatsApp}
            disabled={!patient?.phone}
            variant="outline"
            className="w-full max-w-[210px] h-9 px-4 rounded-xl text-xs font-bold border border-border/80 bg-card text-emerald-700 dark:text-emerald-400 shadow-2xs transition-all cursor-pointer hover:bg-[#25D366]/10 hover:border-[#25D366]/50 hover:text-emerald-800 dark:hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/40 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5 mr-1.5 text-[#25D366] shrink-0" />
            <span>Enviar Mensaje</span>
          </Button>
        </div>

        {/* PANEL DERECHO */}
        <div className="md:col-span-8 flex flex-col">
          
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-5 gap-3">
            <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {activeSection !== "general" && (
                <button
                  type="button"
                  onClick={() => setActiveSection("general")}
                  style={{ color: "var(--doctor-accent, #008bcd)" }}
                  className="text-xs font-bold flex items-center gap-1 mr-2 cursor-pointer hover:underline focus:outline-none"
                >
                  <RotateCcw className="w-3 h-3" /> General
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "contact" ? "general" : "contact")}
                style={
                  activeSection === "contact"
                    ? { backgroundColor: "var(--doctor-accent, #008bcd)", borderColor: "var(--doctor-accent, #008bcd)", color: "#ffffff" }
                    : undefined
                }
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent,#008bcd)]",
                  activeSection === "contact"
                    ? "shadow-2xs"
                    : "bg-muted/40 text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted"
                )}
              >
                Contacto
              </button>

              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "health" ? "general" : "health")}
                style={
                  activeSection === "health"
                    ? { backgroundColor: "var(--doctor-accent, #008bcd)", borderColor: "var(--doctor-accent, #008bcd)", color: "#ffffff" }
                    : undefined
                }
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent,#008bcd)]",
                  activeSection === "health"
                    ? "shadow-2xs"
                    : "bg-muted/40 text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted"
                )}
              >
                Clínicos
              </button>

              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "emergency" ? "general" : "emergency")}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40",
                  activeSection === "emergency"
                    ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                    : patient?.medicalAlerts
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                    : "bg-muted/40 text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted"
                )}
              >
                Alertas / Tutor
              </button>
            </div>

            {/* BOTONES DE ACCIÓN (IMPRIMIR, EDITAR Y ELIMINAR) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <PrintPatientInfoModal 
                patient={patient}
                trigger={
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl h-8 w-8 p-0 bg-card border border-border/80 text-muted-foreground shadow-2xs transition-all cursor-pointer hover:bg-muted hover:border-[var(--doctor-accent,#008bcd)] hover:text-[var(--doctor-accent,#008bcd)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent,#008bcd)]"
                    title="Imprimir Ficha"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </Button>
                }
              />

              <Button
                variant="outline"
                size="sm"
                onClick={onEditPatient}
                className="rounded-xl h-8 w-8 p-0 bg-card border border-border/80 text-[var(--doctor-accent,#008bcd)] shadow-2xs transition-all cursor-pointer hover:bg-[var(--doctor-accent,#008bcd)]/15 hover:border-[var(--doctor-accent,#008bcd)] hover:text-[var(--doctor-accent,#008bcd)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent,#008bcd)]"
                title="Editar Paciente"
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>

              {/* Botón de eliminar habilitado para Administrador */}
              {isAdmin && onDeleteRequest && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeleteRequest}
                  className="w-8 h-8 p-0 bg-background text-destructive/80 hover:text-destructive hover:bg-destructive/10 border-border/80 hover:border-destructive/30 rounded-lg cursor-pointer"
                  title="Eliminar Paciente"
                >
                  <Trash2 className="w-3.5 h-3.5 transition-colors" />
                </Button>
                
              )}
            </div>
          </div>

          {/* CUERPO DINÁMICO */}
          <div className="animate-in fade-in duration-200">
            {activeSection === "general" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Género</span><p className="font-bold text-foreground capitalize">{patient?.sexo || "No especificado"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Fecha Nacimiento</span><p className="font-bold text-foreground">{formattedBirth}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Teléfono</span><p className="font-bold text-foreground font-mono">{patient?.phone || "No registrado"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Dirección</span><p className="font-bold text-foreground truncate" title={patient?.address}>{patient?.address || "No registrada"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Ciudad</span><p className="font-bold text-foreground">{patient?.ciudad || "Ciudad"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Código / CI</span><p className="font-bold text-foreground font-mono">{patient?.ci || "No registrado"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Estado del Paciente</span><p className="font-bold text-foreground">{patient?.tipoPaciente || "Activo"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Fecha de Registro</span><p className="font-bold text-foreground">{formattedRegister}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Seguro / EPS</span><p className="font-bold" style={{ color: "var(--doctor-accent, #008bcd)" }}>{patient?.eps || "Particular"}</p></div>
              </div>
            )}

            {activeSection === "contact" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Teléfono Móvil</span><p className="font-bold text-foreground font-mono">{patient?.phone || "No registrado"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Correo Electrónico</span><p className="font-bold text-foreground truncate">{patient?.email || "No registrado"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Teléfono Fijo</span><p className="font-bold text-foreground font-mono">{patient?.telefonoFijo || "No registrado"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Ciudad</span><p className="font-bold text-foreground">{patient?.ciudad || "No registrada"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Provincia / Dpto.</span><p className="font-bold text-foreground">{patient?.departamento || "No registrada"}</p></div>
                <div className="sm:col-span-2"><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Dirección Exacta</span><p className="font-bold text-foreground truncate">{patient?.address || "No registrada"}</p></div>
              </div>
            )}

            {activeSection === "health" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">EPS / Seguro</span><p className="font-bold" style={{ color: "var(--doctor-accent, #008bcd)" }}>{patient?.eps || "Particular"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Tipo Paciente</span><p className="font-bold text-foreground">{patient?.tipoPaciente || "Particular"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Convenio Activo</span><p className="font-bold text-foreground">{patient?.convenio || "Sin convenio"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Grupo Sanguíneo</span><p className="font-bold text-rose-600">{patient?.grupoSanguineo || "O+"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Estado Civil</span><p className="font-bold text-foreground capitalize">{patient?.estadoCivil || "No registrado"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Nivel Educativo</span><p className="font-bold text-foreground">{patient?.nivelEducativo || "No registrado"}</p></div>
                <div className="sm:col-span-2"><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Profesión / Ocupación</span><p className="font-bold text-foreground">{patient?.profesion || "No registrada"}</p></div>
              </div>
            )}

            {activeSection === "emergency" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                  <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Acompañante / Tutor</span><p className="font-bold text-foreground">{patient?.nombreAcompanante || "No registrado"}</p></div>
                  <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Teléfono Acompañante</span><p className="font-bold text-foreground font-mono">{patient?.telefonoAcompanante || "No registrado"}</p></div>
                  <div><span className="text-[11px] text-muted-foreground block mb-0.5 font-medium">Cédula Acudiente</span><p className="font-bold text-foreground font-mono">{patient?.cedulaAcudiente || "No registrado"}</p></div>
                </div>

                <div className={cn("p-3 rounded-xl border", patient?.medicalAlerts ? "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400" : "bg-muted/20 border-border/60 text-muted-foreground")}>
                  <div className="flex items-center gap-1.5 mb-1 font-bold text-[10.5px] uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" /> Alertas Médicas (Alergias / Crónicas)
                  </div>
                  <p className="font-bold text-xs">{patient?.medicalAlerts || "Ninguna alerta registrada."}</p>
                </div>

                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1 font-medium">Observaciones Generales</span>
                  <p className="font-medium text-foreground bg-muted/20 p-2.5 rounded-xl border border-border/60">{patient?.observaciones || "Sin observaciones."}</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}