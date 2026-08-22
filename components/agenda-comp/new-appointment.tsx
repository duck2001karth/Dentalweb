"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Plus, Loader2, CheckCircle2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useGetPatients } from "@/hooks/patients"
import { useCreateAppointment } from "@/hooks/appointments"
import { appointmentStatuses } from "@/constants/status"
import { AppointmentForm } from "./appointment-form"

interface NewAppointmentModalProps {
  customTrigger?: React.ReactNode
  defaultDate?: Date
  defaultStartTime?: string
  defaultDoctorId?: string
}

export function NewAppointmentModal({ customTrigger, defaultDate, defaultStartTime, defaultDoctorId }: NewAppointmentModalProps) {
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const currentUser = session?.user as any
  const isAdminOrStaff = currentUser?.role === "ADMIN" || currentUser?.role === "RECEPTIONIST"
  
  const { patients, isLoading: isLoadingPatients } = useGetPatients()
  const { createAppointment, isLoading: isSaving } = useCreateAppointment()

  const [doctorsList, setDoctorsList] = useState<any[]>([])
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)

  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: defaultDoctorId || "",
    box: "Box 1",
    reason: "",
    status: appointmentStatuses.SCHEDULED.value,
    situation: "Primera Consulta",
    date: defaultDate || new Date(),
    startTime: defaultStartTime || "09:00",
    endTime: "09:30"
  })

  const validInitialStatuses = [
    { ...appointmentStatuses.SCHEDULED, badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
    { ...appointmentStatuses.IN_WAITING_ROOM, badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
    { ...appointmentStatuses.IN_PROGRESS, badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" }
  ]

  useEffect(() => {
    if (open) {
      const nowTime = format(new Date(), "HH:mm")
      setFormData(prev => ({
        ...prev,
        date: defaultDate || new Date(),
        doctorId: defaultDoctorId || (isAdminOrStaff ? "" : currentUser?.id),
        startTime: defaultStartTime || nowTime,
        endTime: defaultStartTime ? prev.endTime : `${new Date(new Date().setMinutes(new Date().getMinutes() + 30)).getHours().toString().padStart(2,'0')}:${new Date(new Date().setMinutes(new Date().getMinutes() + 30)).getMinutes().toString().padStart(2,'0')}`
      }))

      if (isAdminOrStaff && doctorsList.length === 0) {
        setIsLoadingDoctors(true)
        fetch("/api/admin/users")
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) setDoctorsList(data.filter(u => u.role === "DOCTOR"))
          })
          .catch(() => toast({ title: "Error", description: "No se pudieron cargar los especialistas", variant: "destructive" }))
          .finally(() => setIsLoadingDoctors(false))
      }
    }
  }, [open, defaultDate, defaultDoctorId, currentUser, isAdminOrStaff])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formData.patientId) return toast({ title: "Atención", description: "Selecciona un paciente.", variant: "destructive" })
    if (!formData.doctorId) return toast({ title: "Atención", description: "Asigna un especialista.", variant: "destructive" })

    try {
      await createAppointment({
        ...formData,
        date: formData.date.toISOString(),
      })
      toast({
        title: "¡Cita Agendada!",
        description: `Reservada exitosamente para las ${formData.startTime}.`,
        variant: "default", 
      })
      setOpen(false) 
      setFormData(prev => ({ ...prev, patientId: "", reason: "" })) 
    } catch (error: any) {
      toast({ title: "Error al agendar", description: error.message || "Problema de conexión.", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customTrigger ? customTrigger : (
          <Button variant="ghost" className="flex-1 md:flex-none bg-transparent border border-border/80 text-foreground hover:text-[#008bcd] hover:bg-[#008bcd]/10 hover:border-[#008bcd]/30 font-bold text-sm h-11 px-4 rounded-xl transition-all duration-200 shadow-none group">
            <Plus className="h-5 w-5 mr-1.5 text-muted-foreground group-hover:text-[#008bcd] transition-colors stroke-[2.5]" />
            <span>Dar cita</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[850px] p-0 bg-card border-border/80 overflow-hidden rounded-[24px] shadow-2xl">
        
        <div className="bg-gradient-to-r from-[#008bcd]/10 via-transparent to-transparent px-6 py-5 border-b border-border/80">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-black text-foreground flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-[#008bcd]/15 border border-[#008bcd]/30 text-[#008bcd] shadow-xs rounded-xl shrink-0">
                <CalendarIcon className="w-5 h-5 stroke-[2.5]" />
              </div>
              Agendar Nueva Cita
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs font-semibold mt-1 ml-14">
              Configure la información clínica, el especialista y el bloque de tiempo.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit}>
          
          <AppointmentForm 
            formData={formData}
            setFormData={setFormData}
            patients={patients}
            doctorsList={doctorsList}
            isLoadingPatients={isLoadingPatients}
            isLoadingDoctors={isLoadingDoctors}
            isAdminOrStaff={isAdminOrStaff}
            currentUser={currentUser}
            validInitialStatuses={validInitialStatuses}
          />

          <div className="px-6 py-4 border-t border-border/80 bg-muted/10 flex justify-end items-center gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="hover:bg-muted text-muted-foreground font-bold rounded-xl h-10 px-5 text-xs transition-colors">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold h-10 px-6 shadow-md shadow-[#008bcd]/20 rounded-xl text-xs transition-all duration-200">
              {isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando reserva...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2 stroke-[2.5]"/> Confirmar Cita</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}