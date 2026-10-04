"use client"

import React, { useState, useMemo, useEffect } from "react"
import { startOfISOWeek, addWeeks, subWeeks, isSameWeek } from "date-fns"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import { AppLayout } from "@/components/layouts/app-layout"
import { useGetAppointments } from "@/hooks/appointments"
import { useClinicSettings } from "@/config/clinic-settings"
import { AgendaHeader } from "@/components/agenda-comp/agenda/agenda-header"
import { AgendaSemanalView } from "@/components/agenda-comp/agenda/agenda-semanal-view"
import { AgendaListaView } from "@/components/agenda-comp/agenda/agenda-lista-view"
import { AppointmentDetailsDialog } from "@/components/agenda-comp/agenda/appointment-details-dialog"
import { AgendaFiltersState } from "@/components/agenda-comp/agenda/agenda-filters-modal"

const HORARIOS_SEMANALES = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
]

const DIAS_LABORALES = 6

export default function AgendaGlobalPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { settings } = useClinicSettings()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const currentUser = session?.user as any
  const isGlobalStaff = currentUser?.role === "ADMIN" || currentUser?.role === "RECEPTIONIST"
  const defaultUserColor = currentUser?.calendarColor || "#008bcd"

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => startOfISOWeek(new Date()))
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("ALL")
  
  const [filters, setFilters] = useState<AgendaFiltersState>({
    status: "ALL",
    box: "ALL",
    query: "",
  })

  const [selectedCita, setSelectedCita] = useState<any>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [doctoresDeLaClinica, setDoctoresDeLaClinica] = useState<any[]>([])

  const weekDays = useMemo(() => {
    return Array.from({ length: DIAS_LABORALES }).map(
      (_, i) => new Date(currentWeekStart.getTime() + i * 86400000)
    )
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
      if (app.status === "CANCELLED" || app.status === "CANCELED") return false

      if (!isGlobalStaff && app.doctorId !== (currentUser?.id || "doc-1")) {
        return false
      }
      if (selectedDoctorId !== "ALL" && app.doctorId !== selectedDoctorId) {
        return false
      }

      if (filters.status !== "ALL" && app.status !== filters.status) {
        return false
      }

      if (filters.box !== "ALL" && app.box !== filters.box) {
        return false
      }

      if (filters.query.trim()) {
        const q = filters.query.toLowerCase()
        const patName = `${app.patient?.firstName || ""} ${app.patient?.lastName || ""}`.toLowerCase()
        const reason = (app.reason || "").toLowerCase()
        if (!patName.includes(q) && !reason.includes(q)) return false
      }

      return true
    })
  }, [appointments, isGlobalStaff, currentUser?.id, selectedDoctorId, filters])

  const selectedCitaDoctorColor = useMemo(() => {
    if (!selectedCita) return defaultUserColor
    const docId = selectedCita.doctorId || selectedCita.doctor?.id
    return doctorColorsMap[docId] || selectedCita.doctor?.calendarColor || defaultUserColor
  }, [selectedCita, doctorColorsMap, defaultUserColor])

  const availableBoxes = settings?.availableBoxes && settings.availableBoxes.length > 0
    ? settings.availableBoxes
    : ["Box 1 (Principal)", "Box 2 (Ortodoncia)", "Box 3 (Cirugía)"]

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
          filters={filters}
          onFiltersChange={setFilters}
          availableBoxes={availableBoxes}
        />

        {viewMode === "calendar" ? (
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
        ) : (
          <AgendaListaView 
            appointments={filteredAppointments}
            doctorColorsMap={doctorColorsMap}
            onSelectCita={(cita) => {
              setSelectedCita(cita)
              setIsViewModalOpen(true)
            }}
            defaultDoctorColor={defaultUserColor}
          />
        )}

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