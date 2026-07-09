"use client"

import { useEffect, useState } from "react"
import dayjs from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
import "dayjs/locale/es"
import { useSession } from "next-auth/react"
import { Calendar, Sparkles, Users, Clock, FileText, ArrowRight, Activity } from "lucide-react"
import Link from "next/link"
import { Loader2 } from "lucide-react";

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
    return <div className="h-64 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
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

  const firstName = data?.user?.name?.split(" ")[0] || "Doctor"
  const currentDate = dayjs().format("dddd, D [de] MMMM")
  const capitalizedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1)

  // --- LÓGICA DE MÉTRICAS REALES ---
  
  const now = dayjs()
  const upcomingAppointments = appointments
    ?.filter((app: any) => dayjs(app.date || app.startTime).isAfter(now))
    ?.sort((a: any, b: any) => dayjs(a.date || a.startTime).diff(dayjs(b.date || b.startTime)))
  
  const nextAppointment = upcomingAppointments?.[0]
  const oneWeekAgo = dayjs().subtract(7, 'day')
  const newPatientsThisWeek = patients?.filter((p: any) => dayjs(p.createdAt).isAfter(oneWeekAgo)).length || 0
  const totalPatients = patients?.length || 0

  return (
    <div className="w-full rounded-3xl bg-gradient-to-br from-slate-900 via-[#004e75] to-[#008bcd] text-white p-6 md:p-8 lg:p-10 shadow-2xl overflow-hidden relative">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium text-blue-50 shadow-sm border border-white/20">
            <Calendar className="w-4 h-4" />
            <span>{capitalizedDate}</span>
          </div>
          
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              {greetingText}, <br />
              <span className="opacity-100 text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-cyan-200">
                {firstName}
              </span>{" "}
              <span className="inline-block animate-bounce">{emoji}</span>
            </h1>
          </div>

          <div className="flex items-start gap-4 pt-2">
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/10 shrink-0 shadow-inner">
              <Sparkles className="w-6 h-6 text-cyan-300" />
            </div>
            <p className="text-sm md:text-base font-medium text-blue-50 opacity-80 max-w-md leading-relaxed italic">
              "Cuidando sonrisas y transformando vidas, un paciente a la vez. ¡Que tengas un excelente turno!"
            </p>
          </div>
        </div> 
        <div className="grid grid-cols-2 gap-3 lg:gap-4 w-full content-center">

          {/* Tarjeta 1: Citas Hoy */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg hover:bg-white/20 transition-all cursor-default">
            <div className="flex items-center justify-between text-blue-100 mb-2">
              <span className="text-sm font-semibold tracking-wide">Citas Hoy</span>
              <Calendar className="h-4 w-4 opacity-70" />
            </div>
            <div>
              <div className="text-3xl font-black text-white">
                {isLoadingAppointments ? <Loader2 className="w-6 h-6 animate-spin mt-2" /> : appointments?.length || 0}
              </div>
              <p className="text-[10px] md:text-xs text-blue-200 mt-1 font-medium">Programadas en tu agenda</p>
            </div>
          </div>

          {/* Tarjeta 2: Nuevos Pacientes */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg hover:bg-white/20 transition-all cursor-default">
            <div className="flex items-center justify-between text-blue-100 mb-2">
              <span className="text-sm font-semibold tracking-wide">Nuevos Sem.</span>
              <Users className="h-4 w-4 opacity-70" />
            </div>
            <div>
              <div className="text-3xl font-black text-white">
                {isLoadingPatients ? <Loader2 className="w-6 h-6 animate-spin mt-2" /> : `+${newPatientsThisWeek}`}
              </div>
              <p className="text-[10px] md:text-xs text-blue-200 mt-1 font-medium">
                Registrados últimos 7 días
              </p>
            </div>
          </div>

          {/* Tarjeta 3: Próximo Paciente (Destacada) */}
          <div className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg hover:bg-white/20 transition-all cursor-default relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-400"></div>
            <div className="flex items-center justify-between text-blue-100 mb-2 pl-2">
              <span className="text-sm font-semibold tracking-wide">Próximo Paciente</span>
              <Clock className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="pl-2">
              {isLoadingAppointments ? (
                <Loader2 className="w-6 h-6 animate-spin mt-2" />
              ) : nextAppointment ? (
                <>
                  <div className="text-xl lg:text-2xl font-black text-white tracking-tight">
                    {dayjs(nextAppointment.date || nextAppointment.startTime).format("hh:mm A")}
                  </div>
                  <p className="text-[10px] md:text-xs text-cyan-100 font-bold mt-1 truncate">
                    {nextAppointment.patient?.firstName} {nextAppointment.patient?.lastName}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-white tracking-tight mt-1 opacity-80">
                    Agenda Libre
                  </div>
                  <p className="text-[10px] md:text-xs text-blue-200 mt-1 font-medium">
                    No hay más citas hoy
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Tarjeta 4: Total Pacientes (Acceso directo) */}
          <Link href="/pacientes" className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg hover:bg-white/20 transition-all cursor-pointer group">
            <div className="flex items-center justify-between text-blue-100 mb-2">
              <span className="text-sm font-semibold tracking-wide">Expedientes</span>
              <Activity className="h-4 w-4 opacity-70 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-3xl font-black text-white">
                {isLoadingPatients ? <Loader2 className="w-6 h-6 animate-spin mt-2" /> : totalPatients}
              </div>
              <p className="text-[10px] md:text-xs text-cyan-200 font-bold group-hover:text-white transition-colors mt-1 flex items-center gap-1">
                Ver directorio <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </p>
            </div>
          </Link>

        </div>
      </div>
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-cyan-400/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 -mb-20 -ml-20 w-80 h-80 bg-blue-600/40 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  )
}