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

  const normalizedRole = String(userRole || "").trim().toUpperCase()
  const canReceivePayments = [
    "ADMIN",
    "ADMINISTRADOR",
    "ADMINISTRACION",
    "RECEPTIONIST",
    "RECEPCION",
  ].includes(normalizedRole)
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
    <div className="relative flex min-h-dvh w-full min-w-0 flex-1 flex-col bg-background pb-6 font-sans antialiased sm:pb-10">
     <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[440px] max-h-[calc(100dvh-1.5rem)] overflow-y-auto bg-card border-border p-5 sm:p-6 rounded-2xl shadow-xl">
            <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-500 shadow-inner">
                <Trash2 className="w-7 h-7" />
            </div>

            <DialogHeader className="space-y-2">
                <DialogTitle className="text-lg sm:text-xl font-bold text-foreground tracking-tight text-center">
                ¿Eliminar expediente de paciente?
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed text-center px-2">
                Vas a solicitar la eliminación del expediente de <strong className="font-semibold text-foreground">{patient.firstName} {patient.lastName}</strong>. La operación se ejecutará según las reglas y restricciones del servidor. Verifica que sea el paciente correcto.
                </DialogDescription>
            </DialogHeader>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6 pt-4 border-t border-border/60">
            <Button 
                variant="outline" 
                className="w-full sm:flex-1 rounded-xl min-h-11 px-3 text-xs font-semibold border-border bg-background text-foreground hover:bg-muted cursor-pointer" 
                onClick={() => setIsDeleteDialogOpen(false)}
            >
                Cancelar
            </Button>
            <Button 
                variant="destructive" 
                onClick={onDeletePatient} 
                disabled={isDeleting}
                className="w-full sm:flex-1 rounded-xl min-h-11 px-3 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95 cursor-pointer"
            >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} 
                Confirmar eliminación
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
        <div className="relative z-10 w-full min-w-0 overflow-hidden border-b border-border bg-card print:hidden motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 blur-[80px] rounded-full"></div>
            <div className="absolute top-12 -left-24 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/20 blur-[80px] rounded-full"></div>
          </div>

          <div className="relative z-10 flex w-full min-w-0 flex-col items-start justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:gap-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
                <div className="w-full h-full rounded-2xl flex items-center justify-center border-2 border-background shadow-md overflow-hidden bg-gradient-to-tr from-[#008bcd] to-blue-400">
                  <div className="text-lg font-bold uppercase text-white sm:text-xl">
                    {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <h1 className="break-words text-lg font-bold tracking-tight text-foreground sm:text-2xl">
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

                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
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

            <div className="flex w-full min-w-0 flex-wrap items-start gap-2 lg:w-auto lg:max-w-[44%]">
              {patient.medicalAlerts && (
                <div className="flex min-w-0 max-w-full items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
                  <ShieldAlert size={14} />
                  <span className="min-w-0 break-words">{typeof patient.medicalAlerts === "string" ? patient.medicalAlerts : "Alerta médica registrada"}</span>
                </div>
              )}
              <div className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs font-medium text-foreground">
                <Pill size={14} className="text-[#008bcd]" />
                <span>{patient.eps || "Particular"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Menú Principal */}
      <div className="sticky top-0 z-20 w-full min-w-0 border-b border-border bg-card/95 backdrop-blur-md print:hidden">
        <div className="flex w-full min-w-0 flex-col gap-1 px-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-2 lg:px-8">
          <div className="flex min-w-0 items-center overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {isPersonalOverview && (
              <div className="hidden shrink-0 items-center gap-1.5 border-r border-border/80 pr-3 text-xs font-semibold text-muted-foreground xl:mr-3 xl:flex">
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
                "min-h-11 shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold transition-colors sm:px-4 sm:text-sm",
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
                "min-h-11 shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold transition-colors sm:px-4 sm:text-sm", 
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
                "min-h-11 shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold transition-colors sm:px-4 sm:text-sm", 
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
                "min-h-11 shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold transition-colors sm:px-4 sm:text-sm", 
                FACTURACION_PAGOS_TABS.includes(activeTab) 
                  ? "border-[#008bcd] text-[#008bcd] dark:text-blue-400 bg-blue-500/5" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Facturación y pagos
            </button>
          </div>

          <div className="flex w-full shrink-0 flex-wrap items-center gap-2 py-2 sm:w-auto lg:justify-end">
            <button 
              onClick={() => router.push(`/agenda-global?patientId=${patientId}`)}
              className="inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-border bg-background px-3 text-xs font-semibold text-[#008bcd] transition-colors hover:bg-blue-500/10 dark:text-blue-400 sm:flex-none"
            >
              <CalendarIcon size={14} /> Agendar Cita
            </button>
            {canReceivePayments && (
              <Button
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 sm:flex-none"
              >
                <Banknote size={15} className="stroke-[2.5]" /> Recibir pago
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido del Módulo Activo */}
      <div className="w-full min-w-0 px-3 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
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