"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Stethoscope } from "lucide-react"
import { useGetPatients } from "@/hooks/patients"

const LOADING_MESSAGES = [
  (name: string) => `${name}, no olvides revisar tus citas programadas para hoy.`,
  (name: string) => `${name}, recuerda consultar los pacientes que necesitan seguimiento.`,
  () => "Cada sonrisa cuenta. Hagamos que hoy sea un gran día.",
  () => "Revisa tus tratamientos pendientes y continúa donde lo dejaste.",
  () => "Una atención cercana comienza con una buena organización.",
]

export const GlobalLoader = () => {
  const { data: session } = useSession()
  const { isLoading } = useGetPatients()
  const [messageIndex, setMessageIndex] = useState(0)
  const [logoError, setLogoError] = useState(false)

  const firstName = session?.user?.name?.trim().split(/\s+/)[0]
  const displayName = firstName || "equipo"

  useEffect(() => {
    if (!isLoading) return

    setMessageIndex(0)
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length)
    }, 2500)

    return () => window.clearInterval(interval)
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando Carmo Dental"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 px-6 py-10 font-sans text-foreground backdrop-blur-xl"
    >
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="relative mb-7 flex items-center justify-center">
          <div aria-hidden="true" className="absolute h-40 w-40 rounded-full border border-primary/10" />
          <div aria-hidden="true" className="absolute h-32 w-32 rounded-full border border-primary/20 motion-safe:animate-pulse" />
          <div className="relative z-10 flex h-28 w-28 items-center justify-center overflow-hidden rounded-[28px] border border-border bg-card p-4 shadow-xl shadow-primary/10">
            {!logoError ? (
              <Image
                src="/iconode.png"
                alt="Logo de Carmo Dental"
                width={96}
                height={96}
                priority
                onError={() => setLogoError(true)}
                className="h-full w-full object-contain"
              />
            ) : (
              <Stethoscope aria-hidden="true" className="h-12 w-12 text-primary" />
            )}
          </div>
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-foreground">Carmo Dental</h2>
        <p className="mt-2 text-base font-semibold text-foreground">¡Bienvenido, {displayName}!</p>

        <div className="mt-5 flex min-h-[72px] items-center justify-center">
          <p
            key={messageIndex}
            className="max-w-sm text-sm leading-relaxed text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
          >
            {LOADING_MESSAGES[messageIndex](displayName)}
          </p>
        </div>

        <div className="mt-7 flex items-center gap-2 text-primary" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-current motion-safe:animate-pulse" />
          <span className="h-2 w-2 rounded-full bg-current motion-safe:animate-pulse [animation-delay:200ms]" />
          <span className="h-2 w-2 rounded-full bg-current motion-safe:animate-pulse [animation-delay:400ms]" />
        </div>
        <p className="mt-3 text-xs font-medium text-muted-foreground">Preparando tu espacio de trabajo…</p>
        <p className="mt-10 text-[11px] tracking-wide text-muted-foreground/70">Gestión clínica segura y organizada</p>
      </div>
    </div>
  )
}
