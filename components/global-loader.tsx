
"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Stethoscope } from "lucide-react"
import { useGetPatients } from "@/hooks/patients"

const LOADING_MESSAGES = [
  (name: string) =>
    `${name}, no olvides revisar tus citas programadas para hoy.`,

  (name: string) =>
    `${name}, recuerda consultar los pacientes que necesitan seguimiento.`,

  (_name: string) =>
    "Cada sonrisa cuenta. Hagamos que hoy sea un gran día.",

  (_name: string) =>
    "Revisa tus tratamientos pendientes y continúa donde lo dejaste.",

  (_name: string) =>
    "Una atención cercana comienza con una buena organización.",
]

export const GlobalLoader = () => {
  const { data: session } = useSession()
  const { isLoading } = useGetPatients()

  const [messageIndex, setMessageIndex] = useState(0)
  const [logoError, setLogoError] = useState(false)

  const firstName =
    session?.user?.name?.trim().split(/\s+/)[0] || ""

  const welcomeName = firstName || "equipo"

  useEffect(() => {
    if (!isLoading) return

    setMessageIndex(0)

    const interval = window.setInterval(() => {
      setMessageIndex(
        (previous) => (previous + 1) % LOADING_MESSAGES.length
      )
    }, 2500)

    return () => window.clearInterval(interval)
  }, [isLoading])

  if (!isLoading) return null

  const message = LOADING_MESSAGES[messageIndex](welcomeName)

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando Carmo Dental"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 px-6 py-10 font-sans backdrop-blur-xl animate-in fade-in duration-300"
    >
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-7 flex items-center justify-center">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-[28px] border border-border/60 bg-white p-3 shadow-[0_12px_35px_-15px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_35px_-15px_rgba(0,0,0,0.45)]">
            {!logoError ? (
              <Image
                src="/iconode.png"
                alt="Logo de Carmo Dental"
                width={112}
                height={112}
                priority
                onError={() => setLogoError(true)}
                className="h-full w-full object-contain"
              />
            ) : (
              <Stethoscope
                aria-hidden="true"
                className="h-12 w-12 text-primary"
              />
            )}
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Carmo Dental
        </h2>
        <p className="mt-2 text-base font-semibold text-foreground">
          ¡Bienvenido, {welcomeName}!
        </p>
        <div className="mt-6 flex min-h-[72px] items-center justify-center">
          <p
            key={messageIndex}
            className="max-w-sm text-sm leading-relaxed text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
          >
            {message}
          </p>
        </div>
        <div
          className="mt-5 flex items-center justify-center gap-2"
          aria-hidden="true"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary/80" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary/60 [animation-delay:200ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary/40 [animation-delay:400ms]" />
        </div>

        <p className="mt-4 text-xs font-medium text-muted-foreground">
          Preparando tu espacio de trabajo...
        </p>
        <p className="mt-12 text-[11px] tracking-wide text-muted-foreground/70">
          Gestión clínica segura y organizada
        </p>
      </div>
    </div>
  )
}

export default GlobalLoader
