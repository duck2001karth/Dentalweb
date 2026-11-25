"use client"

import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, User } from "lucide-react"

import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useGetPatient, useDeletePatient } from "@/hooks/patients"
import { useGetTreatmentPlans } from "@/hooks/treatments"
import { PatientDetailView } from "@/components/patients/patient-detail-view"

export default function FichaClinicaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  const userRole = (session?.user as any)?.role || "DOCTOR"
  const patientId = params.id as string

  const patientHook = useGetPatient(patientId) as any
  const patient = patientHook?.patient
  const isLoadingPatient = patientHook?.isLoading
  const refetchPatient = patientHook?.refetch || patientHook?.mutate || (() => {})

  const { plans: treatmentPlans = [], refetch: refetchPlans } = useGetTreatmentPlans({ patientId })
  const { deletePatient, isLoading: isDeleting } = useDeletePatient()

  const handleDeletePatient = async () => {
    try {
      await deletePatient(patientId)
      toast({ 
        title: "Paciente Eliminado", 
        description: "El paciente ha sido borrado del sistema correctamente.", 
        variant: "success" 
      })
      router.push("/pacientes")
    } catch {
      toast({ 
        title: "Error al eliminar", 
        description: "Hubo un problema al intentar borrar al paciente.", 
        variant: "destructive" 
      })
    }
  }

  const handleRefreshData = () => {
    if (refetchPatient) refetchPatient()
    if (refetchPlans) refetchPlans()
  }

  if (isLoadingPatient) {
    return (
      <AppLayout>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 text-[#008bcd] dark:text-blue-400">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="font-semibold text-muted-foreground">Cargando ficha del paciente...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!patient) {
    return (
      <AppLayout>
        <div className="flex h-screen items-center justify-center bg-background text-muted-foreground flex-col gap-4">
          <User className="w-16 h-16 opacity-20" />
          <p className="text-xl font-medium">Paciente no encontrado.</p>
          <Button variant="outline" className="bg-background border-border text-foreground hover:bg-accent" onClick={() => router.back()}>
            Volver al directorio
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PatientDetailView
        patient={patient}
        patientId={patientId}
        treatmentPlans={treatmentPlans}
        userRole={userRole}
        onDeletePatient={handleDeletePatient}
        isDeleting={isDeleting}
        onRefreshData={handleRefreshData}
      />
    </AppLayout>
  )
}