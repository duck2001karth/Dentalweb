"use client"

import React, { useState, useMemo, useEffect } from "react"
import { startOfISOWeek, addWeeks, subWeeks, isSameWeek } from "date-fns"
import { useSession } from "next-auth/react"

import { AppLayout } from "@/components/layouts/app-layout"
import { useGetAppointments } from "@/hooks/appointments"
import { AgendaHeader } from "@/components/agenda-comp/agenda/agenda-header"
import { AgendaSemanalView } from "@/components/agenda-comp/agenda/agenda-semanal-view"
import { AppointmentDetailsDialog } from "@/components/agenda-comp/agenda/appointment-details-dialog"

const HORARIOS_SEMANALES = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
]

export default function AgendaGlobalPage() {
  const { data: session } = useSession()
  const currentUser = session?.user as any
  const isGlobalStaff = currentUser?.role === "ADMIN" || currentUser?.role === "RECEPTIONIST"
  const defaultUserColor = currentUser?.calendarColor || "#008bcd"

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => startOfISOWeek(new Date()))
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("ALL")
  
  const [selectedCita, setSelectedCita] = useState<any>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [doctoresDeLaClinica, setDoctoresDeLaClinica] = useState<any[]>([])

  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => new Date(currentWeekStart.getTime() + i * 86400000))
  }, [currentWeekStart])

  const { appointments = [] } = useGetAppointments({ fecha: currentWeekStart })

  useEffect(() => {
    if (isGlobalStaff) {
      fetch("/api/admin/users")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const doctores = data
              .filter(u => u.role === "DOCTOR")
              .map(d => ({
                id: d.id,
                name: d.name,
                especialidad: d.specialty || "Odontología General",
                calendarColor: d.calendarColor || "#008bcd",
              }))
            setDoctoresDeLaClinica(doctores)
          }
        })
        .catch(err => console.error("Error cargando especialistas:", err))
    }
  }, [isGlobalStaff])

  const DOCTORES = useMemo(() => {
    if (isGlobalStaff && doctoresDeLaClinica.length > 0) return doctoresDeLaClinica
    return [
      {
        id: currentUser?.id || "doc-1",
        name: currentUser?.name ? `${currentUser.name} (Tú)` : "Dr. Asignado",
        especialidad: currentUser?.specialty || "Odontología General",
        calendarColor: defaultUserColor,
      }
    ]
  }, [isGlobalStaff, doctoresDeLaClinica, currentUser, defaultUserColor])

  const doctorColorsMap = useMemo(() => {
    const map: Record<string, string> = {}
    DOCTORES.forEach(d => { map[d.id] = d.calendarColor })
    return map
  }, [DOCTORES])

  const filteredAppointments = useMemo(() => {
    return appointments.filter((app: any) => {
      if (app.status === "CANCELLED") return false
      if (!isGlobalStaff) {
        return app.doctorId === (currentUser?.id || "doc-1")
      }
      if (selectedDoctorId === "ALL") return true
      return app.doctorId === selectedDoctorId
    })
  }, [appointments, isGlobalStaff, currentUser?.id, selectedDoctorId])

  const selectedCitaDoctorColor = useMemo(() => {
    if (!selectedCita) return defaultUserColor
    const docId = selectedCita.doctorId || selectedCita.doctor?.id
    return doctorColorsMap[docId] || selectedCita.doctor?.calendarColor || defaultUserColor
  }, [selectedCita, doctorColorsMap, defaultUserColor])

  return (
    <AppLayout>
      <div className="w-full h-[calc(100vh-5.5rem)] flex flex-col p-4 md:p-6 animate-in fade-in duration-300">
        
        <AgendaHeader 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          currentWeekStart={currentWeekStart}
          onPrevWeek={() => setCurrentWeekStart(prev => subWeeks(prev, 1))}
          onNextWeek={() => setCurrentWeekStart(prev => addWeeks(prev, 1))}
          onToday={() => setCurrentWeekStart(startOfISOWeek(new Date()))}
          isTodayWeek={isSameWeek(currentWeekStart, new Date(), { weekStartsOn: 1 })}
          canSwitchDoctor={isGlobalStaff}
          selectedDoctorId={selectedDoctorId}
          onDoctorChange={setSelectedDoctorId}
          doctors={DOCTORES}
          activeAppointmentsCount={filteredAppointments.length}
          defaultUserColor={defaultUserColor}
        />

        <AgendaSemanalView 
          weekDays={weekDays}
          hours={HORARIOS_SEMANALES}
          appointments={filteredAppointments}
          doctorColorsMap={doctorColorsMap}
          onSelectCita={(cita) => {
            setSelectedCita(cita)
            setIsViewModalOpen(true)
          }}
          selectedDoctorId={selectedDoctorId}
          defaultDoctorColor={defaultUserColor}
        />

        <AppointmentDetailsDialog 
          isOpen={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          selectedCita={selectedCita}
          doctorColor={selectedCitaDoctorColor}
        />

      </div>
    </AppLayout>
  )
}