"use client"

import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

export function DynamicBreadcrumbs() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const currentUser = session?.user as any
  const userRole = (currentUser?.role || "DOCTOR").toUpperCase()
  const accentColor = currentUser?.calendarColor || "#008bcd"

  if (pathname === "/") return null
  const isDoctor = userRole === "DOCTOR"

  const getBreadcrumbData = () => {
    if (pathname.startsWith("/pacientes")) return { parent: "Directorio", label: "Pacientes", href: "/pacientes" }
    if (pathname.startsWith("/paciente/")) return { parent: "Ficha Clínica", label: "Detalles del Paciente", href: "/pacientes" }
    if (pathname.startsWith("/agenda")) return { parent: "Agenda", label: "Calendario Global", href: "/agenda" }
        if (pathname.startsWith("/finanzas")) {
      if (isDoctor) {
        return { parent: "Inicio", label: "Acceso Restringido", href: "/" }
      }
      return { parent: "Finanzas", label: "Facturación y Caja", href: "/finanzas" }
    }

    return { parent: "Sistema", label: "Módulo", href: "/" }
  }

  const { parent, label, href } = getBreadcrumbData()

  return (
    <div className="hidden md:flex items-center text-xs font-medium text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border">
      <Link href="/" className="hover:text-foreground transition-colors flex items-center">
        <Home className="w-3.5 h-3.5" />
      </Link>
      <ChevronRight className="w-3.5 h-3.5 mx-1 opacity-50" />
      <Link href={href} className="hover:text-foreground transition-colors">
        {parent}
      </Link>
      <ChevronRight className="w-3.5 h-3.5 mx-1 opacity-50" />
      <span 
        className="font-bold truncate max-w-[150px]"
        style={{ color: accentColor }}
      >
        {label}
      </span>
    </div>
  )
}