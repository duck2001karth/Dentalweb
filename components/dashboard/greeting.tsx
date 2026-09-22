"use client"

import { useEffect, useState } from "react"
import dayjs from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
import "dayjs/locale/es"
import { useSession } from "next-auth/react"
import { Calendar, Sparkles, Users, Clock, ArrowRight, Activity, Loader2 } from "lucide-react"
import Link from "next/link"

import { useGetAppointments } from "@/hooks/appointments"
import { useGetPatients } from "@/hooks/patients"

dayjs.extend(isBetween)
dayjs.locale("es")

export const Greeting = () => {
  const { data, status } = useSession()
  const [mounted, setMounted] = useState(false)
  
  const { appointments, isLoading: isLoadingAppointments } = useGetAppointments({ fecha: new Date() })
  const { patients, isLoading: isLoadingPatients } = useGetPatients({})

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || status === "loading") {
    return <div className="h-64 w-full bg-slate-100 dark:bg-card/60 animate-pulse rounded-3xl" />
  }

  const hour = dayjs().hour()
  let greetingText = ""
  let emoji = ""

  if (hour < 12) {
    greetingText = "Buenos Días"
    emoji = "☀️"
  } else if (hour < 18) {
    greetingText = "Buenas Tardes"
    emoji = "🌞"
  } else {
    greetingText = "Buenas Noches"
    emoji = "🌙"
  }

  const user = data?.user as any
  const rawFirstName = user?.name?.split(" ")[0] || "Patricio"
  const isDoctor = user?.role === "DOCTOR"
  const prefix = isDoctor ? (user?.gender === "female" ? "Dra." : "Dr.") : ""
  const displayName = prefix ? `${prefix} ${rawFirstName}` : rawFirstName
  const doctorColor = user?.calendarColor || "#008bcd"

  const currentDate = dayjs().format("dddd, D [de] MMMM")
  const capitalizedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1)
  const now = dayjs()
  
  const upcomingAppointments = appointments
    ?.filter((app: any) => dayjs(app.date || app.startTime).isAfter(now))
    ?.sort((a: any, b: any) => dayjs(a.date || a.startTime).diff(dayjs(b.date || b.startTime)))
  
  const nextAppointment = upcomingAppointments?.[0]
  const oneWeekAgo = dayjs().subtract(7, 'day')
  const newPatientsThisWeek = patients?.filter((p: any) => dayjs(p.createdAt).isAfter(oneWeekAgo)).length || 0
  const totalPatients = patients?.length || 0

  return (
    <div 
      className="w-full rounded-3xl border border-sky-200/90 dark:border-border/80 bg-[var(--greeting-bg,#e0f2fe)] dark:bg-card p-6 md:p-8 lg:p-10 shadow-sm dark:shadow-none overflow-hidden relative transition-all duration-300"
      style={{
        backgroundImage: "var(--greeting-gradient)",
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/95 dark:bg-muted/80 backdrop-blur-md px-4 py-1.5 rounded-full text-xs md:text-sm font-bold text-sky-900 dark:text-foreground/90 shadow-xs border border-sky-300/60 dark:border-border/80">
            <Calendar className="w-4 h-4 text-[var(--doctor-accent,#008bcd)]" />
            <span>{capitalizedDate}</span>
          </div>
          
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-foreground">
              {greetingText}, <br />
              <span className="text-[var(--doctor-accent,#008bcd)] dark:text-foreground">
                {displayName}
              </span>{" "}
              <span className="inline-block animate-bounce">{emoji}</span>
            </h1>
          </div>

          <div className="flex items-start gap-3.5 pt-1">
            <div className="bg-sky-200/60 dark:bg-muted/80 p-2.5 rounded-xl backdrop-blur-md border border-sky-300/50 dark:border-border/80 shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 text-[var(--doctor-accent,#008bcd)]" />
            </div>
            <p className="text-xs md:text-sm font-medium text-slate-700 dark:text-muted-foreground max-w-md leading-relaxed italic">
              "Cuidando sonrisas y transformando vidas, un paciente a la vez. ¡Que tengas un excelente turno!"
            </p>
          </div>
        </div> 

        {/* LADO DERECHO: TARJETAS MÉTRICAS */}
        <div className="grid grid-cols-2 gap-3 lg:gap-4 w-full content-center">
          
          {/* TARJETA 1: CITAS HOY */}
          <div className="bg-white/95 dark:bg-muted/40 backdrop-blur-xl border border-sky-200/70 dark:border-border/80 hover:border-[var(--doctor-accent,#008bcd)]/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs dark:shadow-none hover:shadow-md transition-all duration-200 cursor-default group">
            <div className="flex items-center justify-between text-slate-600 dark:text-muted-foreground mb-2">
              <span className="text-xs sm:text-sm font-bold tracking-wide group-hover:text-slate-900 dark:group-hover:text-foreground transition-colors">Citas Hoy</span>
              <Calendar className="h-4 w-4 text-[var(--doctor-accent,#008bcd)] opacity-90 group-hover:opacity-100 transition-all" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-foreground">
                {isLoadingAppointments ? <Loader2 className="w-6 h-6 animate-spin mt-2" /> : appointments?.length || 0}
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-muted-foreground mt-1 font-medium">Programadas en tu agenda</p>
            </div>
          </div>

          {/* TARJETA 2: NUEVOS PACIENTES */}
          <div className="bg-white/95 dark:bg-muted/40 backdrop-blur-xl border border-sky-200/70 dark:border-border/80 hover:border-[var(--doctor-accent,#008bcd)]/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs dark:shadow-none hover:shadow-md transition-all duration-200 cursor-default group">
            <div className="flex items-center justify-between text-slate-600 dark:text-muted-foreground mb-2">
              <span className="text-xs sm:text-sm font-bold tracking-wide group-hover:text-slate-900 dark:group-hover:text-foreground transition-colors">Nuevos Sem.</span>
              <Users className="h-4 w-4 text-[var(--doctor-accent,#008bcd)] opacity-90 group-hover:opacity-100 transition-all" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-foreground">
                {isLoadingPatients ? <Loader2 className="w-6 h-6 animate-spin mt-2" /> : `+${newPatientsThisWeek}`}
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-muted-foreground mt-1 font-medium">
                Registrados últimos 7 días
              </p>
            </div>
          </div>

          {/* TARJETA 3: PRÓXIMO PACIENTE */}
          <div className="bg-white/95 dark:bg-muted/40 backdrop-blur-xl border border-sky-200/70 dark:border-border/80 hover:border-[var(--doctor-accent,#008bcd)]/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs dark:shadow-none hover:shadow-md transition-all duration-200 cursor-default relative overflow-hidden group">
            <div 
              className="absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300"
              style={{ backgroundColor: doctorColor }}
            />
            <div className="flex items-center justify-between text-slate-600 dark:text-muted-foreground mb-2 pl-2">
              <span className="text-xs sm:text-sm font-bold tracking-wide group-hover:text-slate-900 dark:group-hover:text-foreground transition-colors">Próximo Paciente</span>
              <Clock className="h-4 w-4 text-[var(--doctor-accent,#008bcd)]" />
            </div>
            <div className="pl-2">
              {isLoadingAppointments ? (
                <Loader2 className="w-6 h-6 animate-spin mt-2" />
              ) : nextAppointment ? (
                <>
                  <div className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-foreground tracking-tight">
                    {dayjs(nextAppointment.date || nextAppointment.startTime).format("hh:mm A")}
                  </div>
                  <p className="text-[10px] md:text-xs text-[var(--doctor-accent,#008bcd)] font-bold mt-1 truncate">
                    {nextAppointment.patient?.firstName} {nextAppointment.patient?.lastName}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-foreground/90 tracking-tight mt-1">
                    Agenda Libre
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-muted-foreground mt-1 font-medium">
                    No hay más citas hoy
                  </p>
                </>
              )}
            </div>
          </div>

          {/* TARJETA 4: EXPEDIENTES / DIRECTORIO */}
          <Link 
            href="/pacientes" 
            className="bg-white/95 dark:bg-muted/40 backdrop-blur-xl border border-sky-200/70 dark:border-border/80 hover:border-[var(--doctor-accent,#008bcd)]/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs dark:shadow-none hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-600 dark:text-muted-foreground mb-2">
              <span className="text-xs sm:text-sm font-bold tracking-wide group-hover:text-slate-900 dark:group-hover:text-foreground transition-colors">Expedientes</span>
              <Activity className="h-4 w-4 text-[var(--doctor-accent,#008bcd)] opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-foreground">
                {isLoadingPatients ? <Loader2 className="w-6 h-6 animate-spin mt-2" /> : totalPatients}
              </div>
              <p className="text-[10px] md:text-xs text-[var(--doctor-accent,#008bcd)] font-bold group-hover:underline transition-colors mt-1 flex items-center gap-1">
                Ver directorio <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </p>
            </div>
          </Link>

        </div>
      </div>
    </div>
  )
}