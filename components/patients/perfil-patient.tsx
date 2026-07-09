"use client"

import { useState, useMemo } from "react"
import { Edit, Save, Loader2, Camera, MapPin, HeartPulse, Users, ShieldAlert, Trash2, MoreVertical, User } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { DataCard } from "./card-clinic"
import { useUpdatePatient } from "@/hooks/patients"
import { useGetAppointments } from "@/hooks/appointments"

import { AppointmentsHistory } from "./appointments-history"
import { ComentariosTab } from "./comments-tab" 
import { TareasTab } from "./tasks-tab"

export function DatosPersonalesTab({ patient, patientId, onDeleteRequest }: { patient: any, patientId: string, onDeleteRequest: () => void }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  // --- REGLAS DE SEGURIDAD POR ROL ---
  const currentUser = session?.user as any
  const canEditPatient = ["ADMIN", "DOCTOR", "RECEPTIONIST"].includes(currentUser?.role) // Todos pueden actualizar datos de contacto
  const canDeletePatient = currentUser?.role === "ADMIN" || currentUser?.role === "DOCTOR" // Recepcionista NO puede eliminar

  const { updatePatient } = useUpdatePatient()
  const { appointments: patientAppointments, isLoading: isLoadingAppointments } = useGetAppointments({ patientId })

  const [activeSubTab, setActiveSubTab] = useState("personales")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const formattedBirthDate = patient?.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : ""
  
  const inputClass = "bg-background border-border text-foreground focus-visible:ring-[#008bcd] focus-visible:border-[#008bcd] transition-all shadow-sm rounded-lg px-3 py-2 text-sm h-10 w-full"

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoPreview(URL.createObjectURL(file))
      toast({ title: "Foto previsualizada", description: "Guarda los cambios para confirmar.", variant: "success" })
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canEditPatient) return toast({ title: "Acceso Denegado", variant: "destructive" })

    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    const birthDateValue = formData.get("birthDate") as string

    const updatedData = {
      tipoRegistro: formData.get("tipoRegistro") as string,
      firstName: formData.get("firstName") as string,
      cedulaAcudiente: formData.get("cedulaAcudiente") as string,
      lastName: formData.get("lastName") as string,
      tipoIdentificacion: formData.get("tipoIdentificacion") as string,
      ci: formData.get("ci") as string,
      nombreSocial: formData.get("nombreSocial") as string,
      sexo: formData.get("sexo") as string,
      birthDate: birthDateValue ? new Date(birthDateValue).toISOString() : undefined,
      grupoSanguineo: formData.get("grupoSanguineo") as string,
      pertenenciaEtnica: formData.get("pertenenciaEtnica") as string,
      estadoCivil: formData.get("estadoCivil") as string,
      nivelEducativo: formData.get("nivelEducativo") as string,
      profesion: formData.get("profesion") as string,
      tipoPaciente: formData.get("tipoPaciente") as string,
      eps: formData.get("eps") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      ciudad: formData.get("ciudad") as string,
      departamento: formData.get("departamento") as string,
      zonaResidencia: formData.get("zonaResidencia") as string,
      telefonoFijo: formData.get("telefonoFijo") as string,
      phone: formData.get("phone") as string,
      nombreAcompanante: formData.get("nombreAcompanante") as string,
      telefonoAcompanante: formData.get("telefonoAcompanante") as string,
      nombreResponsable: formData.get("nombreResponsable") as string,
      convenio: formData.get("convenio") as string,
      gestante: formData.get("gestante") === "Sí",
      observaciones: formData.get("observaciones") as string,
      medicalAlerts: formData.get("medicalAlerts") as string,
    }

    try {
      await updatePatient({ id: patientId, input: updatedData })
      toast({ title: "Datos Actualizados", description: `El perfil ha sido modificado.`, variant: "success" })
      setIsEditing(false) 
    } catch (error) {
      toast({ title: "Error al actualizar", description: "Revisa tu conexión o los datos ingresados.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Navegación de Sub-pestañas */}
      <div className="flex gap-2 mb-8 overflow-x-auto custom-scrollbar pb-2">
        <button onClick={() => setActiveSubTab("personales")} className={cn("px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap border", activeSubTab === "personales" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm" : "bg-card text-muted-foreground hover:bg-accent border-border")}>
          Datos básicos
        </button>
        <button onClick={() => setActiveSubTab("citas")} className={cn("px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 border", activeSubTab === "citas" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm" : "bg-card text-muted-foreground hover:bg-accent border-border")}>
          Historial Citas 
          <span className={cn("px-1.5 py-0.5 rounded-md text-[10px]", activeSubTab === "citas" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>{patientAppointments.length}</span>
        </button>
        <button onClick={() => setActiveSubTab("comentarios")} className={cn("px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap border", activeSubTab === "comentarios" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm" : "bg-card text-muted-foreground hover:bg-accent border-border")}>
          Comentarios
        </button>
        <button onClick={() => setActiveSubTab("tareas")} className={cn("px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap border", activeSubTab === "tareas" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm" : "bg-card text-muted-foreground hover:bg-accent border-border")}>
          Tareas 
        </button>
      </div>

      {/* VISTA 1: DATOS PERSONALES */}
      {activeSubTab === "personales" && (
        <div className="animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-card p-4 rounded-xl border border-border shadow-sm sticky top-0 z-10">
            <div>
              <h2 className="text-xl font-bold text-foreground">Información del Paciente</h2>
              <p className="text-sm text-muted-foreground">Datos demográficos y de contacto registrados.</p>
            </div>
            
            <div className="flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
              {isEditing ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="text-muted-foreground hover:bg-accent hover:text-foreground font-semibold rounded-xl w-full sm:w-auto">
                    Cancelar
                  </Button>
                  <Button type="submit" form="patient-update-form" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md px-6 border-none rounded-xl w-full sm:w-auto">
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>}
                  </Button>
                </>
              ) : (
                canEditPatient && (
                  <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="border-border bg-background text-foreground hover:bg-accent font-bold shadow-sm rounded-xl w-full sm:w-auto">
                        <Edit className="w-4 h-4 mr-2 text-[#008bcd] dark:text-blue-400" /> Gestionar <MoreVertical className="w-4 h-4 ml-1 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-56 p-1 border-border shadow-xl rounded-xl bg-card">
                      <button 
                        onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} 
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-foreground hover:bg-blue-500/10 hover:text-[#008bcd] rounded-lg transition-colors"
                      >
                        <Edit size={16} /> Activar Edición
                      </button>
                      
                      {/* SOLO DOCTOR O ADMIN PUEDEN ELIMINAR */}
                      {canDeletePatient && (
                        <>
                          <div className="h-px bg-border my-1 mx-2"></div>
                          <button 
                            onClick={() => { onDeleteRequest(); setIsMenuOpen(false); }} 
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} /> Eliminar Paciente
                          </button>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                )
              )}
            </div>
          </div>

          <form id="patient-update-form" onSubmit={handleUpdate} className="space-y-6">
            {isEditing && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                <Edit className="w-5 h-5 text-[#008bcd] dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#008bcd] dark:text-blue-400 text-sm">Modo Edición Activado</p>
                  <p className="text-xs text-[#008bcd]/80 dark:text-blue-300 mt-1">Ahora puedes modificar la información. No olvides presionar "Guardar Cambios" al finalizar.</p>
                </div>
              </div>
            )}
            
            {/* BLOQUE 1: INFORMACIÓN PRINCIPAL (DISEÑO PREMIUM HORIZONTAL) */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-5 md:p-8">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
                <div className="p-2 bg-blue-500/10 text-[#008bcd] rounded-lg"><User className="w-5 h-5"/></div>
                <h3 className="text-lg md:text-xl font-bold text-foreground">1. Información Principal</h3>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Lado Izquierdo: Avatar */}
                <div className="w-full lg:w-48 shrink-0 flex flex-col items-center">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 group mb-3">
                    {isEditing ? (
                      <>
                        <input type="file" className="hidden" id="form-avatar" onChange={handlePhotoUpload} accept="image/*" />
                        <label htmlFor="form-avatar" className="w-full h-full rounded-full flex flex-col items-center justify-center overflow-hidden bg-muted/30 border-2 border-dashed border-[#008bcd] cursor-pointer hover:bg-muted/50 transition-colors shadow-inner">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <Camera className="w-8 h-8 text-[#008bcd] mb-2" />
                              <span className="text-[10px] font-bold uppercase text-muted-foreground">Cambiar foto</span>
                            </>
                          )}
                        </label>
                      </>
                    ) : (
                      <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#008bcd] to-blue-600 shadow-md text-white text-4xl font-bold">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          patient.firstName?.charAt(0).toUpperCase()
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lado Derecho: Grid Compacto de Datos */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-5">
                  <DataCard label="Nombres" value={patient.firstName} isEditing={isEditing} required>
                    <Input name="firstName" defaultValue={patient.firstName} required className={inputClass} />
                  </DataCard>
                  <DataCard label="Apellidos" value={patient.lastName} isEditing={isEditing} required>
                    <Input name="lastName" defaultValue={patient.lastName} required className={inputClass} />
                  </DataCard>
                  <DataCard label="Tipo de ID" value={patient.tipoIdentificacion} isEditing={isEditing}>
                    <select name="tipoIdentificacion" defaultValue={patient.tipoIdentificacion || "Cédula De Ciudadanía"} className={inputClass}>
                      <option value="Cédula De Ciudadanía">Cédula De Ciudadanía</option>
                      <option value="Tarjeta de Identidad">Tarjeta de Identidad</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                  </DataCard>
                  <DataCard label="Número de CI" value={patient.ci} isEditing={isEditing} required>
                    <Input name="ci" defaultValue={patient.ci} required className={inputClass} />
                  </DataCard>
                  <DataCard label="Fecha Nacimiento" value={formattedBirthDate} isEditing={isEditing} required>
                    <Input type="date" name="birthDate" defaultValue={formattedBirthDate} required className={inputClass} />
                  </DataCard>
                  <DataCard label="Sexo" value={patient.sexo} isEditing={isEditing}>
                    <select name="sexo" defaultValue={patient.sexo || "Femenino"} className={inputClass}>
                      <option value="Femenino">Femenino</option>
                      <option value="Masculino">Masculino</option>
                    </select>
                  </DataCard>
                  <DataCard label="Nombre Social" value={patient.nombreSocial} isEditing={isEditing}>
                    <Input name="nombreSocial" defaultValue={patient.nombreSocial || ""} className={inputClass} placeholder="Opcional..." />
                  </DataCard>
                  <DataCard label="Tipo Registro" value={patient.tipoRegistro} isEditing={isEditing} required>
                    <select name="tipoRegistro" defaultValue={patient.tipoRegistro || "Paso por la clínica"} className={inputClass}>
                      <option value="Recomendación">Recomendación</option>
                      <option value="Redes Sociales">Redes Sociales</option>
                      <option value="Paso por la clínica">Paso por la clínica</option>
                    </select>
                  </DataCard>
                </div>
              </div>
            </div>

            {/* BLOQUE 2: CONTACTO Y UBICACIÓN (GRID DE 4 COLUMNAS) */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-5 md:p-8">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg"><MapPin className="w-5 h-5"/></div>
                <h3 className="text-lg md:text-xl font-bold text-foreground">2. Contacto y Ubicación</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-5">
                <DataCard label="Teléfono Móvil" value={patient.phone} isEditing={isEditing}>
                  <Input name="phone" defaultValue={patient.phone || ""} className={inputClass} />
                </DataCard>
                <DataCard label="Email" value={patient.email} isEditing={isEditing}>
                  <Input name="email" type="email" defaultValue={patient.email || ""} className={inputClass} />
                </DataCard>
                <DataCard label="Ciudad" value={patient.ciudad} isEditing={isEditing} required>
                  <Input name="ciudad" defaultValue={patient.ciudad || ""} required className={inputClass} />
                </DataCard>
                <DataCard label="Provincia" value={patient.departamento} isEditing={isEditing} required>
                  <Input name="departamento" defaultValue={patient.departamento || ""} required className={inputClass} />
                </DataCard>
                <DataCard label="Dirección" value={patient.address} isEditing={isEditing} className="xl:col-span-2">
                  <Input name="address" defaultValue={patient.address || ""} className={inputClass} />
                </DataCard>
                <DataCard label="Zona Residencia" value={patient.zonaResidencia} isEditing={isEditing}>
                  <select name="zonaResidencia" defaultValue={patient.zonaResidencia || "Urbano"} className={inputClass}>
                    <option value="Urbano">Urbano</option><option value="Rural">Rural</option>
                  </select>
                </DataCard>
                <DataCard label="Teléfono Fijo" value={patient.telefonoFijo} isEditing={isEditing}>
                  <Input name="telefonoFijo" defaultValue={patient.telefonoFijo || ""} className={inputClass} />
                </DataCard>
              </div>
            </div>

            {/* BLOQUE 3: DEMOGRAFÍA Y SALUD */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-5 md:p-8">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg"><HeartPulse className="w-5 h-5"/></div>
                <h3 className="text-lg md:text-xl font-bold text-foreground">3. Demografía y Salud</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-5">
                <DataCard label="EPS / Seguro" value={patient.eps} isEditing={isEditing} required>
                  <Input name="eps" defaultValue={patient.eps || ""} required className={inputClass} />
                </DataCard>
                <DataCard label="Tipo Paciente" value={patient.tipoPaciente} isEditing={isEditing}>
                  <select name="tipoPaciente" defaultValue={patient.tipoPaciente || "Contributivo"} className={inputClass}>
                    <option value="Contributivo">Contributivo</option><option value="Subsidiado">Subsidiado</option><option value="Particular">Particular</option>
                  </select>
                </DataCard>
                <DataCard label="Convenio" value={patient.convenio} isEditing={isEditing}>
                  <select name="convenio" defaultValue={patient.convenio || "Sin convenio"} className={inputClass}>
                    <option value="Sin convenio">Sin convenio</option><option value="Seguro Odontológico">Seguro Odontológico</option>
                  </select>
                </DataCard>
                <DataCard label="Grupo Sanguíneo" value={patient.grupoSanguineo} isEditing={isEditing}>
                  <select name="grupoSanguineo" defaultValue={patient.grupoSanguineo || "O+"} className={inputClass}>
                    <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option>
                    <option value="O+">O+</option><option value="O-">O-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
                  </select>
                </DataCard>
                <DataCard label="Estado Civil" value={patient.estadoCivil} isEditing={isEditing}>
                  <select name="estadoCivil" defaultValue={patient.estadoCivil || "Soltero/a"} className={inputClass}>
                    <option value="Soltero/a">Soltero/a</option><option value="Casado/a">Casado/a</option><option value="Unión Libre">Unión Libre</option>
                  </select>
                </DataCard>
                <DataCard label="Gestante" value={patient.gestante ? "Sí" : "No"} isEditing={isEditing}>
                  <select name="gestante" defaultValue={patient.gestante ? "Sí" : "No"} className={inputClass}>
                    <option value="No">No</option><option value="Sí">Sí</option>
                  </select>
                </DataCard>
                <DataCard label="Nivel Educativo" value={patient.nivelEducativo} isEditing={isEditing}>
                  <select name="nivelEducativo" defaultValue={patient.nivelEducativo || "Profesional"} className={inputClass}>
                    <option value="Profesional">Profesional</option><option value="Secundaria">Secundaria</option><option value="Universitario">Universitario</option>
                  </select>
                </DataCard>
                <DataCard label="Profesión" value={patient.profesion} isEditing={isEditing}>
                  <Input name="profesion" defaultValue={patient.profesion || ""} className={inputClass} />
                </DataCard>
              </div>
            </div>

            {/* BLOQUE 4: ACOMPAÑANTES Y ALERTAS (DESTACANDO LAS ALERTAS) */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-5 md:p-8">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg"><Users className="w-5 h-5"/></div>
                <h3 className="text-lg md:text-xl font-bold text-foreground">4. Acompañantes y Alertas</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5 mb-6">
                <DataCard label="Nombre Acompañante" value={patient.nombreAcompanante} isEditing={isEditing}>
                  <Input name="nombreAcompanante" defaultValue={patient.nombreAcompanante || ""} className={inputClass} />
                </DataCard>
                <DataCard label="Teléfono Acompañante" value={patient.telefonoAcompanante} isEditing={isEditing}>
                  <Input name="telefonoAcompanante" defaultValue={patient.telefonoAcompanante || ""} className={inputClass} />
                </DataCard>
                <DataCard label="Cédula Acudiente" value={patient.cedulaAcudiente} isEditing={isEditing}>
                  <Input name="cedulaAcudiente" defaultValue={patient.cedulaAcudiente || ""} className={inputClass} />
                </DataCard>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 p-5 rounded-xl">
                  <DataCard label="Alertas Médicas (Alergias, Condiciones)" value={patient.medicalAlerts} isEditing={isEditing} icon={ShieldAlert}>
                    <Input name="medicalAlerts" defaultValue={patient.medicalAlerts || ""} className={cn(inputClass, "border-red-300 focus-visible:ring-red-500 w-full mt-2")} placeholder="Ej: Alergia a Penicilina..." />
                  </DataCard>
                </div>
                
                <DataCard label="Observaciones Administrativas" value={patient.observaciones} isEditing={isEditing}>
                  <Input name="observaciones" defaultValue={patient.observaciones || ""} className={inputClass} />
                </DataCard>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* VISTAS RESTANTES */}
      {activeSubTab === "citas" && <AppointmentsHistory appointments={patientAppointments} isLoading={isLoadingAppointments} />}
      {activeSubTab === "comentarios" && <ComentariosTab patientId={patientId} />}
      {activeSubTab === "tareas" && <TareasTab patientId={patientId} />}
    </div>
  )
}