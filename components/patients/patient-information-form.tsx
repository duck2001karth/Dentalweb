"use client"

import React from "react"
import { Camera, User, MapPin, HeartPulse, Users, ShieldAlert } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PatientInformationFormProps {
  patient: any
  isEditing: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  photoPreview: string | null
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const PremiumField = ({ label, value, isEditing, children, className, isAlert }: { label: React.ReactNode, value?: any, isEditing: boolean, children?: React.ReactNode, className?: string, isAlert?: boolean }) => (
  <div className={cn("flex flex-col gap-1.5 border-b border-border/40 pb-3 group", className)}>
    <span className={cn("text-[10px] font-bold uppercase tracking-wider", isAlert ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
      {label}
    </span>
    {isEditing ? (
      <div className="animate-in fade-in duration-200">{children}</div>
    ) : (
      <span className={cn("text-sm font-semibold", isAlert ? "text-rose-600 dark:text-rose-400 font-bold" : "text-foreground")}>
        {value ? value : <span className="text-muted-foreground/40 italic font-medium text-xs">No registrado</span>}
      </span>
    )}
  </div>
)

export function PatientInformationForm({ patient, isEditing, onSubmit, photoPreview, handlePhotoUpload }: PatientInformationFormProps) {
  const formattedBirthDate = patient?.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : ""
  const inputClass = "bg-background border-border/60 text-foreground focus-visible:ring-[#008bcd] focus-visible:border-[#008bcd] transition-all shadow-sm rounded-lg px-3 py-1.5 text-sm h-10 w-full font-medium"
  const selectClass = "bg-background border-border/60 text-foreground focus-visible:ring-[#008bcd] focus-visible:border-[#008bcd] transition-all shadow-sm rounded-lg px-3 py-1.5 text-sm h-10 w-full font-medium cursor-pointer"

  return (
    <form id="patient-update-form" onSubmit={onSubmit} className="space-y-6 pb-20">
      
      {/* 1. INFORMACIÓN PRINCIPAL */}
      <div className="bg-card border border-border/60 rounded-[20px] p-6 md:p-8 shadow-xs transition-colors hover:border-border/80">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
          <div className="p-2 bg-[#008bcd]/10 text-[#008bcd] rounded-xl"><User className="w-5 h-5 stroke-[2.5]" /></div>
          <h3 className="text-lg font-bold text-foreground tracking-tight">1. Información Principal</h3>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Avatar Area */}
          <div className="w-full lg:w-40 shrink-0 flex flex-col items-center">
            <div className="relative w-32 h-32 group mb-3">
              {isEditing ? (
                <>
                  <input type="file" className="hidden" id="form-avatar" onChange={handlePhotoUpload} accept="image/*" />
                  <label htmlFor="form-avatar" className="w-full h-full rounded-full flex flex-col items-center justify-center overflow-hidden bg-muted/30 border-2 border-dashed border-[#008bcd] cursor-pointer hover:bg-muted/50 transition-colors shadow-inner">
                    {photoPreview ? <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" /> : <><Camera className="w-8 h-8 text-[#008bcd] mb-2" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Cambiar foto</span></>}
                  </label>
                </>
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#008bcd] to-sky-500 shadow-md text-white text-5xl font-black">
                  {photoPreview ? <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" /> : patient.firstName?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Data Grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-5">
            <PremiumField label="Nombres" value={patient.firstName} isEditing={isEditing} className="xl:col-span-2">
              <Input name="firstName" defaultValue={patient.firstName} required className={inputClass} placeholder="Ej. Juan Carlos" />
            </PremiumField>
            <PremiumField label="Apellidos" value={patient.lastName} isEditing={isEditing} className="xl:col-span-2">
              <Input name="lastName" defaultValue={patient.lastName} required className={inputClass} placeholder="Ej. Pérez Gómez" />
            </PremiumField>
            <PremiumField label="Tipo de Documento" value={patient.tipoIdentificacion} isEditing={isEditing}>
              <select name="tipoIdentificacion" defaultValue={patient.tipoIdentificacion || "Cédula De Ciudadanía"} className={selectClass}>
                <option value="Cédula De Ciudadanía">Cédula de Ciudadanía</option>
                <option value="Tarjeta de Identidad">Tarjeta de Identidad</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </PremiumField>
            <PremiumField label="Número de CI / Documento" value={patient.ci} isEditing={isEditing}>
              <Input name="ci" defaultValue={patient.ci} required className={inputClass} placeholder="Ej. 1700000000" />
            </PremiumField>
            <PremiumField label="Fecha de Nacimiento" value={formattedBirthDate} isEditing={isEditing}>
              <Input type="date" name="birthDate" defaultValue={formattedBirthDate} required className={inputClass} />
            </PremiumField>
            <PremiumField label="Sexo" value={patient.sexo} isEditing={isEditing}>
              <select name="sexo" defaultValue={patient.sexo || "Femenino"} className={selectClass}>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
              </select>
            </PremiumField>
          </div>
        </div>
      </div>

      {/* 2. CONTACTO Y UBICACIÓN */}
      <div className="bg-card border border-border/60 rounded-[20px] p-6 md:p-8 shadow-xs transition-colors hover:border-border/80">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
          <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl"><MapPin className="w-5 h-5 stroke-[2.5]" /></div>
          <h3 className="text-lg font-bold text-foreground tracking-tight">2. Contacto y Ubicación</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-5">
          <PremiumField label="Teléfono Móvil (Celular)" value={patient.phone} isEditing={isEditing}>
            <Input name="phone" defaultValue={patient.phone} className={inputClass} placeholder="Ej. 099 999 9999" />
          </PremiumField>
          <PremiumField label="Correo Electrónico" value={patient.email} isEditing={isEditing} className="xl:col-span-2">
            <Input type="email" name="email" defaultValue={patient.email} className={inputClass} placeholder="correo@ejemplo.com" />
          </PremiumField>
          <PremiumField label="Teléfono Fijo" value={patient.telefonoFijo} isEditing={isEditing}>
            <Input name="telefonoFijo" defaultValue={patient.telefonoFijo} className={inputClass} placeholder="Ej. 02 222 2222" />
          </PremiumField>
          <PremiumField label="Ciudad" value={patient.ciudad} isEditing={isEditing}>
            <Input name="ciudad" defaultValue={patient.ciudad} className={inputClass} placeholder="Ej. Quito" />
          </PremiumField>
          <PremiumField label="Provincia / Departamento" value={patient.departamento} isEditing={isEditing}>
            <Input name="departamento" defaultValue={patient.departamento} className={inputClass} placeholder="Ej. Pichincha" />
          </PremiumField>
          <PremiumField label="Dirección Exacta" value={patient.address} isEditing={isEditing} className="xl:col-span-2">
            <Input name="address" defaultValue={patient.address} className={inputClass} placeholder="Calle Principal y Secundaria" />
          </PremiumField>
        </div>
      </div>

      {/* 3. DEMOGRAFÍA Y SALUD */}
      <div className="bg-card border border-border/60 rounded-[20px] p-6 md:p-8 shadow-xs transition-colors hover:border-border/80">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
          <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl"><HeartPulse className="w-5 h-5 stroke-[2.5]" /></div>
          <h3 className="text-lg font-bold text-foreground tracking-tight">3. Datos de Salud y Demografía</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-5">
          <PremiumField label="EPS / Seguro Médico" value={patient.eps} isEditing={isEditing}>
            <Input name="eps" defaultValue={patient.eps} className={inputClass} placeholder="Nombre del seguro" />
          </PremiumField>
          <PremiumField label="Tipo Paciente" value={patient.tipoPaciente} isEditing={isEditing}>
            <select name="tipoPaciente" defaultValue={patient.tipoPaciente || "Particular"} className={selectClass}>
              <option value="Contributivo">Contributivo</option>
              <option value="Subsidiado">Subsidiado</option>
              <option value="Particular">Particular</option>
            </select>
          </PremiumField>
          <PremiumField label="Convenio" value={patient.convenio} isEditing={isEditing}>
             <Input name="convenio" defaultValue={patient.convenio} className={inputClass} placeholder="Ej. Empresa SA" />
          </PremiumField>
          <PremiumField label="Grupo Sanguíneo" value={patient.grupoSanguineo} isEditing={isEditing}>
            <select name="grupoSanguineo" defaultValue={patient.grupoSanguineo || "O+"} className={selectClass}>
              <option value="O+">O+</option><option value="O-">O-</option>
              <option value="A+">A+</option><option value="A-">A-</option>
              <option value="B+">B+</option><option value="B-">B-</option>
              <option value="AB+">AB+</option><option value="AB-">AB-</option>
            </select>
          </PremiumField>
          <PremiumField label="Estado Civil" value={patient.estadoCivil} isEditing={isEditing}>
            <Input name="estadoCivil" defaultValue={patient.estadoCivil} className={inputClass} placeholder="Ej. Soltero/a" />
          </PremiumField>
          <PremiumField label="Nivel Educativo" value={patient.nivelEducativo} isEditing={isEditing}>
             <Input name="nivelEducativo" defaultValue={patient.nivelEducativo} className={inputClass} placeholder="Ej. Superior" />
          </PremiumField>
          <PremiumField label="Profesión / Ocupación" value={patient.profesion} isEditing={isEditing} className="xl:col-span-2">
            <Input name="profesion" defaultValue={patient.profesion} className={inputClass} placeholder="Ej. Ingeniero" />
          </PremiumField>
        </div>
      </div>

      {/* 4. ALERTAS Y ACOMPAÑANTES */}
      <div className="bg-card border border-border/60 rounded-[20px] p-6 md:p-8 shadow-xs transition-colors hover:border-border/80">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
          <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl"><Users className="w-5 h-5 stroke-[2.5]" /></div>
          <h3 className="text-lg font-bold text-foreground tracking-tight">4. Acompañantes y Alertas Médicas</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-5">
          <PremiumField label="Nombre Acompañante / Acudiente" value={patient.nombreAcompanante} isEditing={isEditing} className="xl:col-span-2">
            <Input name="nombreAcompanante" defaultValue={patient.nombreAcompanante} className={inputClass} placeholder="Ej. María Gómez" />
          </PremiumField>
          <PremiumField label="Teléfono Acompañante" value={patient.telefonoAcompanante} isEditing={isEditing}>
            <Input name="telefonoAcompanante" defaultValue={patient.telefonoAcompanante} className={inputClass} placeholder="Ej. 099 999 9999" />
          </PremiumField>
          <PremiumField label="Cédula Acudiente" value={patient.cedulaAcudiente} isEditing={isEditing}>
            <Input name="cedulaAcudiente" defaultValue={patient.cedulaAcudiente} className={inputClass} placeholder="CI del acudiente" />
          </PremiumField>
          
          {/* ALERTA MÉDICA DESTACADA (Visible si hay datos o si se está editando) */}
          {(isEditing || patient.medicalAlerts) && (
            <div className="xl:col-span-4 bg-rose-500/5 border border-rose-500/20 p-5 rounded-xl">
              <PremiumField 
                isAlert
                label={<span className="flex items-center gap-1.5"><ShieldAlert size={14}/> Alertas Médicas (Alergias, Enfermedades Crónicas)</span>} 
                value={patient.medicalAlerts} 
                isEditing={isEditing}
                className="border-none pb-0"
              >
                <Input name="medicalAlerts" defaultValue={patient.medicalAlerts} className={cn(inputClass, "border-rose-500/30 focus-visible:ring-rose-500 bg-background/50")} placeholder="Ej. Alérgico a la penicilina, Hipertensión..." />
              </PremiumField>
            </div>
          )}

          <PremiumField label="Observaciones Generales" value={patient.observaciones} isEditing={isEditing} className="xl:col-span-4 border-none pb-0">
            <textarea 
              name="observaciones" 
              defaultValue={patient.observaciones} 
              className={cn(inputClass, "min-h-[80px] py-3 resize-none")} 
              placeholder="Cualquier otra observación relevante sobre el paciente..." 
            />
          </PremiumField>
        </div>
      </div>
    </form>
  )
}