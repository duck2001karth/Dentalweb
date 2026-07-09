"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation" 
import { Loader2, User, Calendar as CalendarIcon, CreditCard, ShieldAlert, Pill, Trash2 } from "lucide-react"

import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { useGetPatient, useDeletePatient } from "@/hooks/patients"

import { DatosPersonalesTab } from "@/components/patients/perfil-patient"
import { FichaClinicaLayout } from "@/components/patients/file-clinic"
import { PatientTreatmentPlans } from "@/components/plans-treatment/patient-treatment"

const FICHA_CLINICA_TABS = [
  "ficha",
  "historial",
  "anamnesis", 
  "odontograma", 
  "periodontograma", 
  "rx", 
  "recetas", 
  "documentos", 
  "consentimientos", 
  "evoluciones"
]

export default function FichaClinicaPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams() 
  const { toast } = useToast()
  
  const patientId = params.id as string
  const tabFromUrl = searchParams.get("tab")

  // Si la URL dice "ficha", forzamos a que abra "historial" por defecto para evitar el espacio en blanco
  const initialTab = tabFromUrl === "ficha" ? "historial" : (tabFromUrl || "datos")
  const [activeTab, setActiveTab] = useState(initialTab) 
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false) 

  const { patient, isLoading: isLoadingPatient } = useGetPatient(patientId)
  const { deletePatient, isLoading: isDeleting } = useDeletePatient() 

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl === "ficha" ? "historial" : tabFromUrl)
    }
  }, [tabFromUrl])

  const calculateAge = (birthDate: string | Date | undefined | null) => {
    if (!birthDate) return "--"
    const today = new Date()
    const dob = new Date(birthDate)
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    return age
  }

  const handleDeletePatient = async () => {
    try {
      await deletePatient(patientId)
      toast({ title: "Paciente Eliminado", description: "El paciente ha sido borrado del sistema correctamente.", variant: "success" })
      router.push("/pacientes") 
    } catch (error) {
      toast({ title: "Error al eliminar", description: "Hubo un problema al intentar borrar al paciente.", variant: "destructive" })
    }
  }
  
  const handleMainMenuClick = (newTab: string) => {
    setActiveTab(newTab)
    router.replace(`/paciente/${patientId}?tab=${newTab}`, { scroll: false })
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
      <div className="flex-1 flex flex-col w-full bg-background min-h-screen relative pb-12">
        
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-xl text-red-600 dark:text-red-500 flex items-center gap-2">
                <Trash2 className="w-6 h-6" /> Eliminar Paciente
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                ¿Estás seguro de que deseas eliminar a <strong className="text-foreground">{patient.firstName} {patient.lastName}</strong>? 
                Esta acción es irreversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button variant="outline" className="bg-background text-foreground hover:bg-accent border-border" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeletePatient} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Sí, eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <div className="bg-card w-full shadow-sm z-10 relative overflow-hidden border-b border-border print:hidden">
          
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 blur-[80px] rounded-full"></div>
            <div className="absolute top-12 -left-24 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/20 blur-[80px] rounded-full"></div>
          </div>

          <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                <div className="w-full h-full rounded-2xl sm:rounded-full flex items-center justify-center border-4 border-background shadow-lg overflow-hidden bg-gradient-to-tr from-[#008bcd] to-blue-400">
                  <div className="text-white font-bold text-3xl sm:text-4xl uppercase tracking-wider drop-shadow-sm">
                    {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                  </div>
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {patient.firstName} {patient.lastName}
                </h1>
                
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground border border-border">
                    ID: {patient.id.split("-")[0].toUpperCase()}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-[#008bcd] dark:text-blue-400 border border-blue-500/20">
                    <CreditCard size={13}/> CI: {patient.ci}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <User size={13}/> {calculateAge(patient.birthDate)} años
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-3 text-sm font-medium text-muted-foreground">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  {patient.convenio || "Sin convenio"} <span className="opacity-40 px-1">•</span> {patient.tipoPaciente || "Contributivo"}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className={cn(
                "p-4 rounded-xl border backdrop-blur-sm flex flex-col justify-center min-w-[180px] transition-colors shadow-sm",
                patient.medicalAlerts 
                  ? "bg-red-500/10 border-red-500/20" 
                  : "bg-background/60 border-border"
              )}>
                <div className={cn(
                  "flex items-center gap-2 text-xs font-bold mb-1.5 uppercase tracking-wide",
                  patient.medicalAlerts ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                )}>
                  <ShieldAlert size={14} /> Alertas médicas
                </div>
                <div className={cn(
                  "text-sm font-semibold truncate max-w-[160px]",
                  patient.medicalAlerts ? "text-red-700 dark:text-red-300" : "text-foreground"
                )} title={patient.medicalAlerts || undefined}>
                  {patient.medicalAlerts || "Ninguna registrada"}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-background/60 backdrop-blur-sm flex flex-col justify-center min-w-[180px] shadow-sm">
                <div className="flex items-center gap-2 text-[#008bcd] dark:text-blue-400 text-xs font-bold mb-1.5 uppercase tracking-wide">
                  <Pill size={14} /> EPS / Seguro
                </div>
                <div className="text-sm font-semibold text-foreground truncate max-w-[160px]" title={patient.eps || undefined}>
                  {patient.eps || "No registrado"}
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* --- BARRA DE PESTAÑAS --- */}
        <div className="bg-card border-b border-border w-full shadow-sm z-0 sticky top-0 print:hidden">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex overflow-x-auto custom-scrollbar">
            <button 
              onClick={() => handleMainMenuClick("datos")}
              className={cn("px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-[3px]", activeTab === "datos" ? "border-[#008bcd] text-[#008bcd] dark:text-blue-400 bg-blue-500/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50")}
            >
              Datos personales
            </button>
            <button 
              onClick={() => handleMainMenuClick("historial")} 
              className={cn(
                "px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-[3px]", 
                FICHA_CLINICA_TABS.includes(activeTab) 
                  ? "border-[#008bcd] text-[#008bcd] dark:text-blue-400 bg-blue-500/5" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Ficha clínica
            </button>
            <button 
              onClick={() => handleMainMenuClick("planes")}
              className={cn("px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-[3px]", activeTab === "planes" ? "border-[#008bcd] text-[#008bcd] dark:text-blue-400 bg-blue-500/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50")}
            >
              Planes de tratamiento
            </button>

            <button className="px-6 py-4 text-muted-foreground/50 font-semibold text-sm whitespace-nowrap cursor-not-allowed border-b-[3px] border-transparent">
              Facturación y pagos
            </button>
            
            <div className="ml-auto flex items-center">
              <button 
                onClick={() => router.push(`/agendavand?patientId=${patientId}`)} 
                className="px-6 h-full text-[#008bcd] dark:text-blue-400 hover:bg-blue-500/10 font-bold text-sm whitespace-nowrap flex items-center gap-2 transition-colors border-l border-border"
              >
                <CalendarIcon size={16} /> Agendar Cita
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-8">
          
          {activeTab === "datos" && (
            <DatosPersonalesTab 
              patient={patient} 
              patientId={patientId} 
              onDeleteRequest={() => setIsDeleteDialogOpen(true)} 
            />
          )}
          {FICHA_CLINICA_TABS.includes(activeTab) && (
            <FichaClinicaLayout patientId={patientId} />
          )}

          {activeTab === "planes" && (
            <PatientTreatmentPlans patientId={patientId} />
          )}

        </div>

      </div>
    </AppLayout>
  )
}