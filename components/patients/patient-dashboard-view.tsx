"use client"

import React, { useState, useEffect } from "react"
import {
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { PatientDemographicsCard } from "./patient-demographics-card"
import { UpcomingAppointmentsTab } from "./upcoming-appointments"
import { AppointmentsHistory } from "./appointments-history"
import { TareasTab } from "./tasks-tab"
import { PatientNotesCard } from "./notes-card"
import { DocumentsCard } from "./documents-card"

interface PatientDashboardViewProps {
  patient: any
  appointments: any[]
  clinicalNotes?: any[]
  onEditPatient: () => void
  onOpenNewAppointment?: () => void
  userRole?: string
  onDeleteRequest?: () => void
  isLoadingAppointments?: boolean
}

export function PatientDashboardView({
  patient,
  appointments = [],
  clinicalNotes = [],
  onEditPatient,
  onOpenNewAppointment,
  userRole,
  onDeleteRequest,
  isLoadingAppointments = false,
}: PatientDashboardViewProps) {
  const router = useRouter()
  const [activeSubTab, setActiveSubTab] = useState<"upcoming" | "past" | "notes" | "tasks">("upcoming")

  const today = new Date()
  const upcomingCount = appointments.filter((a: any) => new Date(a.date) >= today && a.status !== "CANCELLED").length
  const pastCount = appointments.filter((a: any) => new Date(a.date) < today || a.status === "COMPLETED").length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300 pb-12 font-sans">
      
      <div className="lg:col-span-8 flex flex-col gap-6">

        {/* Tarjeta de Demografía y Datos Principales */}
        <PatientDemographicsCard 
          patient={patient}
          pastAppointmentsCount={pastCount}
          upcomingAppointmentsCount={upcomingCount}
          onEditPatient={onEditPatient}
          userRole={userRole}
          onDeleteRequest={onDeleteRequest}
        />

        {/* NAVEGACIÓN SECUNDARIA DE LOS 4 MÓDULOS */}
        <div>
          <div className="flex items-center gap-2 mb-3 bg-muted/30 p-1 rounded-xl w-max border border-border/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab("upcoming")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                activeSubTab === "upcoming"
                  ? "bg-card text-[#008bcd] shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Próximas Citas 
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("past")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                activeSubTab === "past"
                  ? "bg-card text-[#008bcd] shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Citas Pasadas 
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("notes")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                activeSubTab === "notes"
                  ? "bg-card text-[#008bcd] shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Registros Clínicos
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("tasks")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                activeSubTab === "tasks"
                  ? "bg-card text-[#008bcd] shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tareas 
            </button>
          </div>

          {/* RENDERIZADO DE LOS MÓDULOS */}
          {activeSubTab === "upcoming" && (
            <UpcomingAppointmentsTab
              appointments={appointments}
              isLoading={isLoadingAppointments}
              patient={patient}
            />
          )}

          {activeSubTab === "past" && (
            <AppointmentsHistory
              appointments={appointments}
              isLoading={isLoadingAppointments}
              patient={patient}
            />
          )}

          {activeSubTab === "notes" && (
            <div className="bg-card border border-border/85 rounded-[24px] shadow-xs overflow-hidden">
              <div className="px-6 py-4.5 border-b border-border/60">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Actos Clínicos y Evoluciones</h3>
              </div>
              <div className="p-6">
                {clinicalNotes.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-12">No hay notas clínicas registradas en este apartado.</p>
                ) : (
                  <div className="space-y-3">
                    {clinicalNotes.map((note: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-2xl border border-border/70 bg-muted/20 text-xs">
                        <p className="font-semibold text-foreground">{note.title || "Evolución médica"}</p>
                        <p className="text-muted-foreground mt-1">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === "tasks" && (
            <TareasTab patientId={patient?.id} patient={patient} />
          )}
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-6">        
        <PatientNotesCard patient={patient} />
        <DocumentsCard patient={patient} />

      </div>
    </div>
  )
}