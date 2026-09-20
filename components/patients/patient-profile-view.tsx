"use client"

import { useState } from "react"
import { Edit, Save, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useUpdatePatient } from "@/hooks/patients"
import { useGetAppointments } from "@/hooks/appointments"

import { PatientInformationForm } from "@/components/patients/patient-info-form"
import { PatientDashboardView } from "@/components/patients/patient-dashboard-view"

interface DatosPersonalesTabProps {
  patient: any
  patientId: string
  onDeleteRequest: () => void
  userRole?: string
}

export default function DatosPersonalesTab({ 
  patient, 
  patientId, 
  onDeleteRequest,
  userRole = "DOCTOR"
}: DatosPersonalesTabProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const currentUser = session?.user as any
  const canEditPatient = ["ADMIN", "DOCTOR", "RECEPTIONIST", "ADMINISTRACION"].includes(currentUser?.role || userRole)

  const { updatePatient } = useUpdatePatient()
  const { appointments: patientAppointments = [] } = useGetAppointments({ patientId })

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoPreview(URL.createObjectURL(file))
      toast({ title: "Foto previsualizada", description: "Guarda los cambios para confirmar." })
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
      toast({ title: "Datos Actualizados", description: "El perfil ha sido modificado con éxito." })
      setIsEditing(false) 
    } catch {
      toast({ title: "Error al actualizar", description: "Revisa tu conexión o los datos ingresados.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="animate-in fade-in duration-300">
      {isEditing && (
        <div className="mb-6 p-4 bg-[#008bcd]/10 border border-[#008bcd]/20 rounded-2xl flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-[#008bcd] text-xs uppercase tracking-wider">Modo Edición Activado</p>
            <p className="text-xs text-foreground/80 mt-0.5">Modifica los datos en los formularios inferiores y guarda los cambios.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(false)} 
              className="rounded-xl h-9 px-4 text-xs font-bold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              size="sm"
              form="patient-update-form" 
              disabled={isSaving} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 rounded-xl h-9 text-xs cursor-pointer"
            >
              {isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />}
              Guardar Cambios
            </Button>
          </div>
        </div>
      )}

      {isEditing ? (
        <PatientInformationForm 
          patient={patient}
          isEditing={isEditing}
          onSubmit={handleUpdate}
          photoPreview={photoPreview}
          handlePhotoUpload={handlePhotoUpload}
          onDeleteRequest={onDeleteRequest}
          userRole={userRole}
        />
      ) : (
        <PatientDashboardView
          patient={patient}
          appointments={patientAppointments}
          clinicalNotes={[]}
          onEditPatient={() => setIsEditing(true)}
          userRole={userRole}
          onDeleteRequest={onDeleteRequest}
        />
      )}
    </div>
  )
}