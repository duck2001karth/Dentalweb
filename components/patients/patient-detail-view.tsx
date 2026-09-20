"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  CreditCard, 
  ShieldAlert, 
  Pill, 
  Trash2, 
  Calendar as CalendarIcon, 
  Banknote,
  ChevronRight,
  ArrowLeft,
  User,
  Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import DatosPersonalesTab from "@/components/patients/patient-profile-view"
import { FichaClinicaLayout } from "@/components/patients/clinic-history-tab"
import { PatientTreatmentPlans } from "@/components/plans-treatment/patient-treatment"
import { PayBillingLayout } from "@/components/patients/file-paymentsbilling"
import { PaymentReceiptModal } from "@/components/patients-receivepay/payment-tab"

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

const FACTURACION_PAGOS_TABS = [
  "facturacion",
  "pagos",
  "documentos_emitidos",
  "devoluciones",
  "eliminados",
  "balance"
]

interface PatientDetailViewProps {
  patient: any
  patientId: string
  treatmentPlans?: any[]
  userRole?: string
  onDeletePatient: () => Promise<void>
  isDeleting?: boolean
  onRefreshData?: () => void
}

export function PatientDetailView({
  patient,
  patientId,
  treatmentPlans = [],
  userRole = "DOCTOR",
  onDeletePatient,
  isDeleting = false,
  onRefreshData,
}: PatientDetailViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get("tab")

  const canReceivePayments = userRole === "ADMIN" || userRole === "RECEPCION" || userRole === "ADMINISTRACION"
  const initialTab = tabFromUrl === "ficha" ? "historial" : (tabFromUrl || "datos")
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

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

  const handleMainMenuClick = (newTab: string) => {
    setActiveTab(newTab)
    router.replace(`/paciente/${patientId}?tab=${newTab}`, { scroll: false })
  }

  const patientPlans = treatmentPlans.length > 0
    ? treatmentPlans
    : (patient?.treatmentPlans || patient?.plans || [])

  const totalPatientDebt = patientPlans.reduce((acc: number, p: any) => {
    const cost = p.totalCost || 0
    const paid = p.totalPaid || 0
    return acc + Math.max(0, cost - paid)
  }, 0)

  const isPersonalOverview = activeTab === "datos"

  return (
    <div className="flex-1 flex flex-col w-full bg-background min-h-screen relative pb-12 font-sans antialiased">
     <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[440px] bg-background border-border p-6 rounded-[24px] shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-500 shadow-inner">
                <Trash2 className="w-7 h-7" />
            </div>

            <DialogHeader className="space-y-2">
                <DialogTitle className="text-xl font-black text-foreground tracking-tight text-center">
                ¿Eliminar expediente de paciente?
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed text-center px-2">
                Estás a punto de borrar permanentemente los registros, citas y datos clínicos de <strong className="text-foreground font-bold">{patient.firstName} {patient.lastName}</strong>. Esta acción no se puede deshacer.
                </DialogDescription>
            </DialogHeader>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6 pt-4 border-t border-border/60">
            <Button 
                variant="outline" 
                className="w-full sm:w-1/2 rounded-xl h-11 text-xs font-bold border-border bg-background text-foreground hover:bg-muted cursor-pointer" 
                onClick={() => setIsDeleteDialogOpen(false)}
            >
                Cancelar
            </Button>
            <Button 
                variant="destructive" 
                onClick={onDeletePatient} 
                disabled={isDeleting}
                className="w-full sm:w-1/2 rounded-xl h-11 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95 cursor-pointer"
            >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} 
                Sí, eliminar definitivamente
            </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>

      {/* Modal de recepción de pago */}
      {canReceivePayments && (
        <PaymentReceiptModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            if (onRefreshData) onRefreshData()
          }}
          patient={patient}
          plans={patientPlans} 
          debt={totalPatientDebt}
          onPaymentSuccess={() => {
            if (onRefreshData) onRefreshData()
          }}
        />
      )}

      {!isPersonalOverview && (
        <div className="bg-card w-full shadow-xs z-10 relative overflow-hidden border-b border-border print:hidden animate-in fade-in duration-300">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 blur-[80px] rounded-full"></div>
            <div className="absolute top-12 -left-24 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/20 blur-[80px] rounded-full"></div>
          </div>

          <div className="w-full px-6 md:px-10 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="relative w-16 h-16 shrink-0">
                <div className="w-full h-full rounded-2xl flex items-center justify-center border-2 border-background shadow-md overflow-hidden bg-gradient-to-tr from-[#008bcd] to-blue-400">
                  <div className="text-white font-bold text-2xl uppercase">
                    {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                  </div>
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">
                  {patient.firstName} {patient.lastName}
                </h1>

                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-muted text-muted-foreground border border-border">
                    ID: {patient.id?.split("-")[0]?.toUpperCase()}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-[#008bcd] dark:text-blue-400 border border-blue-500/20">
                    <CreditCard size={12}/> CI: {patient.ci}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <User size={12}/> {calculateAge(patient.birthDate)} años
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                    {patient.convenio || "Sin convenio"}
                  </span>
                  <span className="opacity-40">•</span>
                  <span className="capitalize">{patient.tipoPaciente || "Particular"}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-row gap-3 w-full md:w-auto">
              {patient.medicalAlerts && (
                <div className="px-3.5 py-2 rounded-xl border bg-rose-500/10 border-rose-500/20 text-xs font-bold text-rose-600 flex items-center gap-2">
                  <ShieldAlert size={14} />
                  <span>{patient.medicalAlerts}</span>
                </div>
              )}
              <div className="px-3.5 py-2 rounded-xl border border-border bg-card/60 text-xs font-semibold text-foreground flex items-center gap-2">
                <Pill size={14} className="text-[#008bcd]" />
                <span>{patient.eps || "Particular"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Menú Principal */}
      <div className="bg-card border-b border-border w-full shadow-2xs z-20 sticky top-0 print:hidden">
        <div className="w-full px-6 md:px-10 flex overflow-x-auto custom-scrollbar items-center justify-between">
          <div className="flex items-center">
            {isPersonalOverview && (
              <div className="flex items-center gap-1.5 mr-6 text-xs font-bold text-muted-foreground pr-4 border-r border-border/80">
                <button 
                  onClick={() => router.push("/pacientes")} 
                  className="hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Pacientes
                </button>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                <span className="text-foreground">{patient.firstName} {patient.lastName}</span>
              </div>
            )}

            <button 
              onClick={() => handleMainMenuClick("datos")}
              className={cn(
                "px-5 py-3.5 font-bold text-xs whitespace-nowrap transition-all border-b-[2px] cursor-pointer",
                activeTab === "datos" 
                  ? "border-[#008bcd] text-[#008bcd] dark:text-blue-400 bg-blue-500/5" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Datos personales
            </button>

            <button 
              onClick={() => handleMainMenuClick("historial")} 
              className={cn(
                "px-5 py-3.5 font-bold text-xs whitespace-nowrap transition-all border-b-[2px] cursor-pointer", 
                FICHA_CLINICA_TABS.includes(activeTab) 
                  ? "border-[#008bcd] text-[#008bcd] dark:text-blue-400 bg-blue-500/5" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Ficha clínica
            </button>

            <button 
              onClick={() => handleMainMenuClick("planes")}
              className={cn(
                "px-5 py-3.5 font-bold text-xs whitespace-nowrap transition-all border-b-[2px] cursor-pointer", 
                activeTab === "planes" 
                  ? "border-[#008bcd] text-[#008bcd] dark:text-blue-400 bg-blue-500/5" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Planes de tratamiento
            </button>

            <button 
              onClick={() => handleMainMenuClick("facturacion")}
              className={cn(
                "px-5 py-3.5 font-bold text-xs whitespace-nowrap transition-all border-b-[2px] cursor-pointer", 
                FACTURACION_PAGOS_TABS.includes(activeTab) 
                  ? "border-[#008bcd] text-[#008bcd] dark:text-blue-400 bg-blue-500/5" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Facturación y pagos
            </button>
          </div>

          <div className="flex items-center gap-2 py-2 shrink-0">
            <button 
              onClick={() => router.push(`/agenda-global?patientId=${patientId}`)}
              className="px-3.5 h-9 text-[#008bcd] dark:text-blue-400 hover:bg-blue-500/10 font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition-colors rounded-xl border border-transparent cursor-pointer"
            >
              <CalendarIcon size={14} /> Agendar Cita
            </button>
            {canReceivePayments && (
              <Button
                onClick={() => setIsPaymentModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Banknote size={15} className="stroke-[2.5]" /> Recibir pago
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido del Módulo Activo */}
      <div className="w-full px-6 md:px-10 py-6">
        {activeTab === "datos" && (
          <DatosPersonalesTab 
            patient={patient} 
            patientId={patientId} 
            onDeleteRequest={() => setIsDeleteDialogOpen(true)}
            userRole={userRole}
          />
        )}

        {FICHA_CLINICA_TABS.includes(activeTab) && (
          <FichaClinicaLayout patientId={patientId} />
        )}

        {activeTab === "planes" && (
          <PatientTreatmentPlans patientId={patientId} />
        )}

        {FACTURACION_PAGOS_TABS.includes(activeTab) && (
          <PayBillingLayout 
            patientId={patientId}
            patient={patient}
            plans={patientPlans}
            onRefreshData={onRefreshData}
          />
        )}
      </div>
    </div>
  )
}