"use client"

import React from "react"
import { Camera, User, Phone, HeartPulse, ShieldAlert, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface PatientInformationFormProps {
  patient: any
  isEditing: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  photoPreview?: string | null
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDeleteRequest?: () => void
  userRole?: string
}

export function PatientInformationForm({
  patient,
  onSubmit,
  photoPreview,
  handlePhotoUpload,
  onDeleteRequest,
  userRole = "DOCTOR",
}: PatientInformationFormProps) {
  const currentPhoto = photoPreview || patient?.photoUrl
  const isAdmin = userRole === "ADMIN"

  const formattedDate = patient?.birthDate
    ? new Date(patient.birthDate).toISOString().split("T")[0]
    : ""

  return (
    <form
      id="patient-update-form"
      onSubmit={onSubmit}
      className="space-y-6 animate-in fade-in duration-300 pb-16 font-sans"
    >
      <div className="bg-card border border-border/80 rounded-[20px] p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-4 mb-5 border-b border-border/60">
          <div className="p-2 rounded-lg bg-[#008bcd]/10 text-[#008bcd]">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">1. Identidad e Información Básica</h3>
            <p className="text-[11px] text-muted-foreground">Datos oficiales de registro del paciente</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-3 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/80 rounded-2xl bg-muted/20">
            <div className="relative group cursor-pointer mb-2">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border/80 bg-[#008bcd] text-white flex items-center justify-center font-bold text-3xl shadow-xs">
                {currentPhoto ? (
                  <img src={currentPhoto} alt="Foto paciente" className="w-full h-full object-cover" />
                ) : (
                  <span>{patient?.firstName?.charAt(0).toUpperCase() || "P"}</span>
                )}
              </div>
              <label
                htmlFor="photo-upload"
                className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
              >
                <Camera className="w-5 h-5 mb-1" /> Cambiar
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <span className="text-[11px] font-semibold text-foreground">Fotografía del Paciente</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG hasta 5MB</span>
          </div>

          {/* Grilla de Identidad */}
          <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nombres *</Label>
              <Input
                name="firstName"
                defaultValue={patient?.firstName || ""}
                required
                className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Apellidos *</Label>
              <Input
                name="lastName"
                defaultValue={patient?.lastName || ""}
                required
                className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Tipo de Documento</Label>
              <select
                name="tipoIdentificacion"
                defaultValue={patient?.tipoIdentificacion || "Cédula De Ciudadanía"}
                className="w-full h-10 px-3 text-xs rounded-xl bg-muted/20 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#008bcd]"
              >
                <option value="Cédula De Ciudadanía">Cédula de Identidad (CI)</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="DNI">DNI / Extranjero</option>
                <option value="Menor sin Identificación">Menor de edad</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Número de CI / Documento *</Label>
              <Input
                name="ci"
                defaultValue={patient?.ci || ""}
                required
                className="h-10 text-xs font-mono rounded-xl bg-muted/20 border-border/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Fecha de Nacimiento</Label>
              <Input
                type="date"
                name="birthDate"
                defaultValue={formattedDate}
                className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Género / Sexo</Label>
              <select
                name="sexo"
                defaultValue={patient?.sexo || "Masculino"}
                className="w-full h-10 px-3 text-xs rounded-xl bg-muted/20 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#008bcd]"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/80 rounded-[20px] p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-4 mb-5 border-b border-border/60">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">2. Contacto y Localización</h3>
            <p className="text-[11px] text-muted-foreground">Medios directos de comunicación y domicilio</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Teléfono Móvil (WhatsApp) *</Label>
            <Input
              name="phone"
              defaultValue={patient?.phone || ""}
              required
              placeholder="Ej. 0969834557"
              className="h-10 text-xs font-mono rounded-xl bg-muted/20 border-border/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Correo Electrónico</Label>
            <Input
              type="email"
              name="email"
              defaultValue={patient?.email || ""}
              placeholder="ejemplo@correo.com"
              className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Teléfono Fijo / Alterno</Label>
            <Input
              name="telefonoFijo"
              defaultValue={patient?.telefonoFijo || ""}
              placeholder="Opcional"
              className="h-10 text-xs font-mono rounded-xl bg-muted/20 border-border/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Ciudad</Label>
            <Input
              name="ciudad"
              defaultValue={patient?.ciudad || ""}
              placeholder="Ej. Cotoca"
              className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Provincia / Departamento</Label>
            <Input
              name="departamento"
              defaultValue={patient?.departamento || ""}
              placeholder="Ej. Orellana"
              className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Dirección Domiciliaria Exacta</Label>
            <Input
              name="address"
              defaultValue={patient?.address || ""}
              placeholder="Barrio, calle y número"
              className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/80 rounded-[20px] p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-4 mb-5 border-b border-border/60">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">3. Afiliación, Salud y Demografía</h3>
            <p className="text-[11px] text-muted-foreground">Convenios comerciales, seguros y grupo sanguíneo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">EPS / Seguro Médico</Label>
            <Input
              name="eps"
              defaultValue={patient?.eps || ""}
              placeholder="Ej. IESS / Particular"
              className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Tipo de Paciente</Label>
            <select
              name="tipoPaciente"
              defaultValue={patient?.tipoPaciente || "Particular"}
              className="w-full h-10 px-3 text-xs rounded-xl bg-muted/20 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#008bcd]"
            >
              <option value="Particular">Particular</option>
              <option value="Convenio">Convenio Empresarial</option>
              <option value="Contributivo">Contributivo</option>
              <option value="Subsidiado">Subsidiado</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Convenio Aplicable</Label>
            <Input
              name="convenio"
              defaultValue={patient?.convenio || ""}
              placeholder="Ej. DESCUENTO FAMILIAR"
              className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Grupo Sanguíneo</Label>
            <select
              name="grupoSanguineo"
              defaultValue={patient?.grupoSanguineo || "O+"}
              className="w-full h-10 px-3 text-xs rounded-xl bg-muted/20 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#008bcd]"
            >
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Estado Civil</Label>
            <Input
              name="estadoCivil"
              defaultValue={patient?.estadoCivil || ""}
              placeholder="Soltero, Casado..."
              className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Nivel Educativo</Label>
            <Input
              name="nivelEducativo"
              defaultValue={patient?.nivelEducativo || ""}
              placeholder="Secundaria, Universidad..."
              className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Profesión u Ocupación</Label>
            <Input
              name="profesion"
              defaultValue={patient?.profesion || ""}
              placeholder="Ocupación principal"
              className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/80 rounded-[20px] p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-4 mb-5 border-b border-border/60">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">4. Acompañante, Contacto de Emergencia y Alertas</h3>
            <p className="text-[11px] text-muted-foreground">Responsables legales, alergias y notas preventivas</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nombre Acompañante / Tutor</Label>
              <Input
                name="nombreAcompanante"
                defaultValue={patient?.nombreAcompanante || ""}
                placeholder="Nombre completo"
                className="h-10 text-xs rounded-xl bg-muted/20 border-border/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Teléfono Acompañante</Label>
              <Input
                name="telefonoAcompanante"
                defaultValue={patient?.telefonoAcompanante || ""}
                placeholder="Teléfono de emergencia"
                className="h-10 text-xs font-mono rounded-xl bg-muted/20 border-border/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Cédula del Tutor / Acudiente</Label>
              <Input
                name="cedulaAcudiente"
                defaultValue={patient?.cedulaAcudiente || ""}
                placeholder="Número de CI"
                className="h-10 text-xs font-mono rounded-xl bg-muted/20 border-border/80"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2">
            <Label className="text-xs font-bold text-rose-700 flex items-center gap-1.5 uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4 text-rose-600" /> Alertas Médicas (Alergias o Condiciones de Riesgo)
            </Label>
            <Input
              name="medicalAlerts"
              defaultValue={patient?.medicalAlerts || ""}
              placeholder="Ej. Alergia a la penicilina, hipertensión, diabetes..."
              className="h-10 text-xs rounded-xl bg-background border-rose-500/30 font-semibold text-rose-800 focus:ring-rose-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Observaciones Generales</Label>
            <textarea
              name="observaciones"
              defaultValue={patient?.observaciones || ""}
              placeholder="Comentarios adicionales o antecedentes no clínicos..."
              className="w-full min-h-[85px] rounded-xl border border-border/80 bg-muted/20 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#008bcd] resize-none"
            />
          </div>
        </div>
      </div>

      {isAdmin && onDeleteRequest && (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-[20px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-600" /> Zona de administración: Eliminar Paciente
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Esta acción borrará permanentemente la ficha clínica, citas e historial de pagos de este paciente.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={onDeleteRequest}
            className="rounded-xl h-10 px-5 text-xs font-bold shrink-0 cursor-pointer"
          >
            Eliminar Paciente Permanentemente
          </Button>
        </div>
      )}
    </form>
  )
}