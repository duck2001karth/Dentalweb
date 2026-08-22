"use client"

import { useState } from "react"
import { Edit, Save, Loader2, Trash2, MoreVertical } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { useUpdatePatient } from "@/hooks/patients"
import { useGetAppointments } from "@/hooks/appointments"

import { AppointmentsHistory } from "./appointments-history"
import { ComentariosTab } from "./comments-tab" 
import { TareasTab } from "./tasks-tab"
import { PatientInformationForm } from "./patient-information-form"

export function DatosPersonalesTab({ patient, patientId, onDeleteRequest }: { patient: any, patientId: string, onDeleteRequest: () => void }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const currentUser = session?.user as any
  const canEditPatient = ["ADMIN", "DOCTOR", "RECEPTIONIST"].includes(currentUser?.role)
  const canDeletePatient = currentUser?.role === "ADMIN" || currentUser?.role === "DOCTOR"

  const { updatePatient } = useUpdatePatient()
  const { appointments: patientAppointments, isLoading: isLoadingAppointments } = useGetAppointments({ patientId })

  const [activeSubTab, setActiveSubTab] = useState("personales")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoPreview(URL.createObjectURL(file))
      toast({ title: "Foto previsualizada", description: "Guarda los cambios para confirmar.", variant: "default" })
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canEditPatient) return toast({ title: "Acceso Denegado", variant: "destructive" })

    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    const birthDateValue = formData.get("birthDate") as string
    const updatedData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      tipoIdentificacion: formData.get("tipoIdentificacion") as string,
      ci: formData.get("ci") as string,
      sexo: formData.get("sexo") as string,
      birthDate: birthDateValue ? new Date(birthDateValue).toISOString() : undefined,
      eps: formData.get("eps") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      ciudad: formData.get("ciudad") as string,
      departamento: formData.get("departamento") as string,
      phone: formData.get("phone") as string,
      telefonoFijo: formData.get("telefonoFijo") as string,
      nombreAcompanante: formData.get("nombreAcompanante") as string,
      telefonoAcompanante: formData.get("telefonoAcompanante") as string,
      cedulaAcudiente: formData.get("cedulaAcudiente") as string,
      convenio: formData.get("convenio") as string,
      tipoPaciente: formData.get("tipoPaciente") as string,
      grupoSanguineo: formData.get("grupoSanguineo") as string,
      estadoCivil: formData.get("estadoCivil") as string,
      nivelEducativo: formData.get("nivelEducativo") as string,
      profesion: formData.get("profesion") as string,
      observaciones: formData.get("observaciones") as string,
      medicalAlerts: formData.get("medicalAlerts") as string,
    }

    try {
      await updatePatient({ id: patientId, input: updatedData })
      toast({ title: "Datos Actualizados", description: `El perfil ha sido modificado con éxito.`, variant: "default" })
      setIsEditing(false) 
    } catch (error) {
      toast({ title: "Error al actualizar", description: "Revisa tu conexión o los datos ingresados.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Navegación de Sub-pestañas */}
      <div className="flex gap-2 mb-8 overflow-x-auto custom-scrollbar pb-2">
        <button onClick={() => setActiveSubTab("personales")} className={cn("px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap border", activeSubTab === "personales" ? "bg-[#008bcd]/10 border-[#008bcd]/30 text-[#008bcd] shadow-sm" : "bg-card text-muted-foreground hover:bg-accent border-border")}>
          Datos Clínicos
        </button>
        <button onClick={() => setActiveSubTab("citas")} className={cn("px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 border", activeSubTab === "citas" ? "bg-[#008bcd]/10 border-[#008bcd]/30 text-[#008bcd] shadow-sm" : "bg-card text-muted-foreground hover:bg-accent border-border")}>
          Historial Citas 
          <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black", activeSubTab === "citas" ? "bg-[#008bcd]/20 text-[#008bcd]" : "bg-muted text-muted-foreground")}>{patientAppointments.length}</span>
        </button>
        <button onClick={() => setActiveSubTab("comentarios")} className={cn("px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap border", activeSubTab === "comentarios" ? "bg-[#008bcd]/10 border-[#008bcd]/30 text-[#008bcd] shadow-sm" : "bg-card text-muted-foreground hover:bg-accent border-border")}>
          Comentarios
        </button>
        <button onClick={() => setActiveSubTab("tareas")} className={cn("px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap border", activeSubTab === "tareas" ? "bg-[#008bcd]/10 border-[#008bcd]/30 text-[#008bcd] shadow-sm" : "bg-card text-muted-foreground hover:bg-accent border-border")}>
          Tareas 
        </button>
      </div>

      {/* VISTA 1: DATOS PERSONALES */}
      {activeSubTab === "personales" && (
        <div className="animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-card/60 p-4 rounded-[20px] border border-border shadow-sm sticky top-0 z-10 backdrop-blur-md">
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight">Ficha Clínica del Paciente</h2>
              <p className="text-sm text-muted-foreground font-medium mt-0.5">Información demográfica y antecedentes médicos.</p>
            </div>
            
            <div className="flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
              {isEditing ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="border-border text-foreground hover:bg-muted font-bold rounded-xl h-10 px-5 w-full sm:w-auto">
                    Cancelar
                  </Button>
                  <Button type="submit" form="patient-update-form" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 px-6 border-none rounded-xl h-10 w-full sm:w-auto">
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="mr-2 h-4 w-4 stroke-[2.5]" /> Guardar Cambios</>}
                  </Button>
                </>
              ) : (
                canEditPatient && (
                  <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="border-border bg-background text-foreground hover:bg-muted font-bold shadow-sm rounded-xl h-10 px-5 w-full sm:w-auto">
                        <Edit className="w-4 h-4 mr-2 text-[#008bcd]" /> Gestionar <MoreVertical className="w-4 h-4 ml-1 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-56 p-1 border-border shadow-xl rounded-xl bg-card">
                      <button 
                        onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} 
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-[#008bcd]/10 hover:text-[#008bcd] rounded-lg transition-colors"
                      >
                        <Edit size={16} /> Activar Edición
                      </button>
                      
                      {canDeletePatient && (
                        <>
                          <div className="h-px bg-border my-1 mx-2"></div>
                          <button 
                            onClick={() => { onDeleteRequest(); setIsMenuOpen(false); }} 
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors"
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

          {isEditing && (
            <div className="mb-6 p-4 bg-[#008bcd]/10 border border-[#008bcd]/20 rounded-xl flex items-start gap-3 animate-in fade-in">
              <Edit className="w-5 h-5 text-[#008bcd] shrink-0 mt-0.5 stroke-[2.5]" />
              <div>
                <p className="font-black text-[#008bcd] text-sm">Modo Edición Activado</p>
                <p className="text-xs text-[#008bcd]/80 mt-0.5 font-medium">Modifica los campos necesarios. No olvides presionar "Guardar Cambios" en la barra superior al finalizar.</p>
              </div>
            </div>
          )}

          {/* COMPONENTE HIJO DESGLOSADO */}
          <PatientInformationForm 
            patient={patient}
            isEditing={isEditing}
            onSubmit={handleUpdate}
            photoPreview={photoPreview}
            handlePhotoUpload={handlePhotoUpload}
          />

        </div>
      )}

      {/* VISTAS RESTANTES */}
      {activeSubTab === "citas" && <AppointmentsHistory appointments={patientAppointments} isLoading={isLoadingAppointments} />}
      {activeSubTab === "comentarios" && <ComentariosTab patientId={patientId} />}
      {activeSubTab === "tareas" && <TareasTab patientId={patientId} />}
    </div>
  )
}