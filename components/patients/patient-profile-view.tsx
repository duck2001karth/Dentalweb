"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"
import { Loader2, Save } from "lucide-react"
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
  userRole = "DOCTOR",
}: DatosPersonalesTabProps) {
  const { data: session } = useSession()
  const { toast } = useToast()

  const currentUser = session?.user as { role?: string } | undefined
  const canEditPatient = ["ADMIN", "DOCTOR", "RECEPTIONIST", "ADMINISTRACION"].includes(
    currentUser?.role || userRole
  )

  const { updatePatient } = useUpdatePatient()
  const { appointments: patientAppointments = [] } = useGetAppointments({ patientId })

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPhotoPreview(URL.createObjectURL(file))
      toast({ title: "Foto previsualizada", description: "Guarda los cambios para confirmar." })
    }
  }

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canEditPatient) {
      toast({ title: "Acceso Denegado", variant: "destructive" })
      return
    }

    setIsSaving(true)
    const formData = new FormData(event.currentTarget)
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
      toast({
        title: "Error al actualizar",
        description: "Revisa tu conexión o los datos ingresados.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full min-w-0 max-w-full font-sans motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      {isEditing && (
        <div className="mb-4 flex w-full min-w-0 flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Modo edición activado
            </p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/80">
              Modifica los datos en los formularios inferiores y guarda los cambios.
            </p>
          </div>
          <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="h-10 w-full rounded-xl px-3 text-xs font-semibold sm:h-9 sm:w-auto sm:px-4"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              form="patient-update-form"
              disabled={isSaving}
              className="h-10 w-full rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 sm:h-9 sm:w-auto sm:px-5"
            >
              {isSaving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
              )}
              Guardar cambios
            </Button>
          </div>
        </div>
      )}

      <div className="w-full min-w-0 max-w-full">
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
    </div>
  )
}
