"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import dayjs from "dayjs"
import "dayjs/locale/es"
import { useSession } from "next-auth/react"
import {
  Activity, ArrowRight, Calendar, Clock, Loader2, Sparkles, Users,
} from "lucide-react"
import Link from "next/link"
import { useGetAppointments } from "@/hooks/appointments"

const PHRASES = [
  "Cada sonrisa merece una atención cercana, cuidadosa y profesional.",
  "La confianza se construye escuchando a cada paciente.",
  "Los pequeños detalles hacen grande la experiencia de atención.",
  "Un buen día comienza con empatía, precisión y trabajo en equipo.",
  "Cuidamos personas, acompañamos historias y creamos sonrisas.",
] as const

type GreetingUser = {
  name?: string | null
  gender?: string
  role?: string
}

type PatientStats = {
  totalPatients: number
  newPatientsThisWeek: number
}

function appointmentDate(appointment: any): dayjs.Dayjs {
  return dayjs(appointment.date || appointment.startTime)
}

export const Greeting = () => {
  const { data: session, status } = useSession()
  const { appointments, isLoading: loadingAppointments } = useGetAppointments({
    fecha: new Date(),
  })

  const [mounted, setMounted] = useState(false)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [stats, setStats] = useState<PatientStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState(false)
  const lastRefresh = useRef(0)
  const requestController = useRef<AbortController | null>(null)

  const loadStats = useCallback(async () => {
    requestController.current?.abort()
    const controller = new AbortController()
    requestController.current = controller
    setLoadingStats(true)
    try {
      const response = await fetch("/api/patients/stats", {
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const value: unknown = await response.json()
      if (
        typeof value !== "object" || value === null ||
        !("totalPatients" in value) || !("newPatientsThisWeek" in value) ||
        typeof value.totalPatients !== "number" ||
        typeof value.newPatientsThisWeek !== "number"
      ) {
        throw new Error("Respuesta de estadísticas inválida")
      }
      if (!controller.signal.aborted) {
        setStats({
          totalPatients: value.totalPatients,
          newPatientsThisWeek: value.newPatientsThisWeek,
        })
        setStatsError(false)
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("No se pudieron actualizar los contadores:", error)
        setStatsError(true)
      }
    } finally {
      if (!controller.signal.aborted) setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    setPhraseIndex(Math.floor(Math.random() * PHRASES.length))
    void loadStats()

    const refreshOnReturn = () => {
      if (document.visibilityState !== "visible") return
      const now = Date.now()
      if (now - lastRefresh.current < 800) return
      lastRefresh.current = now
      setPhraseIndex((previous) => (previous + 1) % PHRASES.length)
      void loadStats()
    }

    document.addEventListener("visibilitychange", refreshOnReturn)
    window.addEventListener("focus", refreshOnReturn)
    return () => {
      document.removeEventListener("visibilitychange", refreshOnReturn)
      window.removeEventListener("focus", refreshOnReturn)
      requestController.current?.abort()
    }
  }, [loadStats])

  if (!mounted || status === "loading") {
    return <div className="h-64 w-full animate-pulse rounded-3xl bg-muted" />
  }

  dayjs.locale("es")
  const currentHour = dayjs().hour()
  const greetingText = currentHour < 12 ? "Buenos días" : currentHour < 18 ? "Buenas tardes" : "Buenas noches"
  const emoji = currentHour < 12 ? "☀️" : currentHour < 18 ? "🌤️" : "🌙"
  const user = session?.user as GreetingUser | undefined
  const firstName = user?.name?.trim().split(/\s+/)[0] || "equipo"
  const prefix = user?.role === "DOCTOR" ? (user.gender === "female" ? "Dra." : "Dr.") : ""
  const displayName = prefix ? `${prefix} ${firstName}` : firstName
  const dateLabel = dayjs().format("dddd, D [de] MMMM")
  const capitalizedDate = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)
  const now = dayjs()

  const todayAppointments = (appointments ?? []).filter((appointment: any) =>
    appointmentDate(appointment).isSame(now, "day"),
  )
  const nextAppointment = todayAppointments
    .filter((appointment: any) => appointmentDate(appointment).isAfter(now))
    .sort((a: any, b: any) => appointmentDate(a).valueOf() - appointmentDate(b).valueOf())[0]

  const numberOrPlaceholder = (value: number | undefined) =>
    loadingStats && !stats ? "…" : statsError && !stats ? "—" : value ?? "—"

  const cardClass = "flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm transition-colors hover:border-sky-300 dark:border-slate-700 dark:bg-slate-800/65 dark:hover:border-sky-700 sm:p-5"
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 sm:text-sm"
  const valueClass = "mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl"
  const subtitleClass = "mt-1 text-xs text-slate-600 dark:text-slate-300"

  return (
    <section
      aria-label="Resumen de inicio"
      className="relative w-full overflow-hidden rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:p-7 lg:p-8"
    >
      <div className="relative grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:text-sm">
            <Calendar className="h-4 w-4 text-sky-700 dark:text-sky-300" />
            <span>{capitalizedDate}</span>
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {greetingText}, <span className="whitespace-nowrap">{emoji}</span>
            <span className="mt-1 block break-words text-sky-800 dark:text-sky-300">{displayName}</span>
          </h1>

          <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-white/75 p-3 dark:border-slate-700 dark:bg-slate-800/65">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true" />
            <p className="max-w-lg text-sm leading-relaxed text-slate-700 dark:text-slate-200" aria-live="polite">
              {PHRASES[phraseIndex]}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-2">
              <span className={labelClass}>Citas hoy</span>
              <Calendar className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" />
            </div>
            <div className={valueClass}>
              {loadingAppointments ? <Loader2 className="h-6 w-6 animate-spin" /> : todayAppointments.length}
            </div>
            <p className={subtitleClass}>Programadas para hoy</p>
          </div>

          <div className={cardClass}>
            <div className="flex items-center justify-between gap-2">
              <span className={labelClass}>Nuevos esta semana</span>
              <Users className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" />
            </div>
            <div className={valueClass}>
              {loadingStats && !stats ? <Loader2 className="h-6 w-6 animate-spin" /> : statsError && !stats ? "—" : `+${numberOrPlaceholder(stats?.newPatientsThisWeek)}`}
            </div>
            <p className={subtitleClass}>Últimos 7 días</p>
          </div>

          <div className={cardClass}>
            <div className="flex items-center justify-between gap-2">
              <span className={labelClass}>Próximo paciente</span>
              <Clock className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" />
            </div>
            {loadingAppointments ? (
              <Loader2 className="mt-3 h-6 w-6 animate-spin text-sky-700" />
            ) : nextAppointment ? (
              <>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-50">
                  {appointmentDate(nextAppointment).format("hh:mm A")}
                </p>
                <p className="mt-1 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                  {nextAppointment.patient?.firstName} {nextAppointment.patient?.lastName}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-50">Agenda libre</p>
                <p className={subtitleClass}>Sin próximas citas hoy</p>
              </>
            )}
          </div>

          <Link href="/pacientes" className={`${cardClass} group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600`}>
            <div className="flex items-center justify-between gap-2">
              <span className={labelClass}>Expedientes</span>
              <Activity className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" />
            </div>
            <p className={valueClass}>{numberOrPlaceholder(stats?.totalPatients)}</p>
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-sky-800 dark:text-sky-300">
              Ver directorio <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </div>
      {statsError && (
        <p role="status" className="mt-3 text-xs text-amber-800 dark:text-amber-300">
          No se pudieron actualizar los contadores de pacientes. Se muestran los últimos valores disponibles.
        </p>
      )}
    </section>
  )
}

export default Greeting
