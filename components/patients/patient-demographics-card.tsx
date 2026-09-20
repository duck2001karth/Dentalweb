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
              <div className="w-20 h-20 rounded-full bg-[#008bcd] text-white flex items-center justify-center font-bold text-2xl shadow-xs">
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
              <p className="text-[10px] text-muted-foreground">Pasadas</p>
            </div>
            <div className="px-2">
              <span className="text-base font-bold text-foreground">{upcomingAppointmentsCount}</span>
              <p className="text-[10px] text-muted-foreground">Próximas</p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleOpenWhatsApp}
            disabled={!patient?.phone}
            variant="outline"
            className="w-full max-w-[210px] rounded-xl h-9 text-xs font-semibold border-border hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 mr-1" /> Enviar Mensaje
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
                  className="text-xs font-bold text-[#008bcd] flex items-center gap-1 mr-2 cursor-pointer hover:underline"
                >
                  <RotateCcw className="w-3 h-3" /> General
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "contact" ? "general" : "contact")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
                  activeSection === "contact"
                    ? "bg-[#008bcd] text-white border-[#008bcd]"
                    : "bg-muted/30 text-muted-foreground border-border/70 hover:text-foreground hover:bg-muted/60"
                )}
              >
                Contacto
              </button>

              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "health" ? "general" : "health")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
                  activeSection === "health"
                    ? "bg-[#008bcd] text-white border-[#008bcd]"
                    : "bg-muted/30 text-muted-foreground border-border/70 hover:text-foreground hover:bg-muted/60"
                )}
              >
                Clínicos
              </button>

              <button
                type="button"
                onClick={() => setActiveSection(activeSection === "emergency" ? "general" : "emergency")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
                  activeSection === "emergency"
                    ? "bg-rose-600 text-white border-rose-600"
                    : patient?.medicalAlerts
                    ? "bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20"
                    : "bg-muted/30 text-muted-foreground border-border/70 hover:text-foreground hover:bg-muted/60"
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
                    className="rounded-xl h-8 w-8 p-0 text-muted-foreground hover:text-foreground border-border hover:bg-muted cursor-pointer"
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
                className="rounded-xl h-8 w-8 p-0 text-[#008bcd] hover:text-[#0070a8] border-border hover:bg-[#008bcd]/10 cursor-pointer"
                title="Editar Paciente"
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>

              {/* Botón de eliminar habilitado para Administrador / Administración */}
              {isAdmin && onDeleteRequest && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeleteRequest}
                  className="rounded-xl h-8 w-8 p-0 text-rose-600 hover:text-rose-700 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
                  title="Eliminar Paciente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* CUERPO DINÁMICO */}
          <div className="animate-in fade-in duration-200">
            {activeSection === "general" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Género</span><p className="font-semibold text-foreground capitalize">{patient?.sexo || "No especificado"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Fecha Nacimiento</span><p className="font-semibold text-foreground">{formattedBirth}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Teléfono</span><p className="font-semibold text-foreground font-mono">{patient?.phone || "No registrado"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Dirección</span><p className="font-semibold text-foreground truncate" title={patient?.address}>{patient?.address || "No registrada"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Ciudad</span><p className="font-semibold text-foreground">{patient?.ciudad || "Ciudad"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Código / CI</span><p className="font-semibold text-foreground font-mono">{patient?.ci || "No registrado"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Estado del Paciente</span><p className="font-semibold text-foreground">{patient?.tipoPaciente || "Activo"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Fecha de Registro</span><p className="font-semibold text-foreground">{formattedRegister}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Seguro / EPS</span><p className="font-semibold text-[#008bcd]">{patient?.eps || "Particular"}</p></div>
              </div>
            )}

            {activeSection === "contact" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Teléfono Móvil</span><p className="font-semibold text-foreground font-mono">{patient?.phone || "No registrado"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Correo Electrónico</span><p className="font-semibold text-foreground truncate">{patient?.email || "No registrado"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Teléfono Fijo</span><p className="font-semibold text-foreground font-mono">{patient?.telefonoFijo || "No registrado"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Ciudad</span><p className="font-semibold text-foreground">{patient?.ciudad || "No registrada"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Provincia / Dpto.</span><p className="font-semibold text-foreground">{patient?.departamento || "No registrada"}</p></div>
                <div className="sm:col-span-2"><span className="text-[11px] text-muted-foreground block mb-0.5">Dirección Exacta</span><p className="font-semibold text-foreground truncate">{patient?.address || "No registrada"}</p></div>
              </div>
            )}

            {activeSection === "health" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">EPS / Seguro</span><p className="font-semibold text-[#008bcd]">{patient?.eps || "Particular"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Tipo Paciente</span><p className="font-semibold text-foreground">{patient?.tipoPaciente || "Particular"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Convenio Activo</span><p className="font-semibold text-foreground">{patient?.convenio || "Sin convenio"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Grupo Sanguíneo</span><p className="font-bold text-rose-600">{patient?.grupoSanguineo || "O+"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Estado Civil</span><p className="font-semibold text-foreground capitalize">{patient?.estadoCivil || "No registrado"}</p></div>
                <div><span className="text-[11px] text-muted-foreground block mb-0.5">Nivel Educativo</span><p className="font-semibold text-foreground">{patient?.nivelEducativo || "No registrado"}</p></div>
                <div className="sm:col-span-2"><span className="text-[11px] text-muted-foreground block mb-0.5">Profesión / Ocupación</span><p className="font-semibold text-foreground">{patient?.profesion || "No registrada"}</p></div>
              </div>
            )}

            {activeSection === "emergency" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                  <div><span className="text-[11px] text-muted-foreground block mb-0.5">Acompañante / Tutor</span><p className="font-semibold text-foreground">{patient?.nombreAcompanante || "No registrado"}</p></div>
                  <div><span className="text-[11px] text-muted-foreground block mb-0.5">Teléfono Acompañante</span><p className="font-semibold text-foreground font-mono">{patient?.telefonoAcompanante || "No registrado"}</p></div>
                  <div><span className="text-[11px] text-muted-foreground block mb-0.5">Cédula Acudiente</span><p className="font-semibold text-foreground font-mono">{patient?.cedulaAcudiente || "No registrado"}</p></div>
                </div>

                <div className={cn("p-3 rounded-xl border", patient?.medicalAlerts ? "bg-rose-500/10 border-rose-500/20 text-rose-700" : "bg-muted/20 border-border/60 text-muted-foreground")}>
                  <div className="flex items-center gap-1.5 mb-1 font-bold text-[10.5px] uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Alertas Médicas (Alergias / Crónicas)
                  </div>
                  <p className="font-bold text-xs">{patient?.medicalAlerts || "Ninguna alerta registrada."}</p>
                </div>

                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1">Observaciones Generales</span>
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