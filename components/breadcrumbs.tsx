"use client"

import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"

export function DynamicBreadcrumbs() {
  const pathname = usePathname()

  if (pathname === "/") return null

  const getBreadcrumbData = () => {
    if (pathname.startsWith("/pacientes")) return { parent: "Directorio", label: "Pacientes", href: "/pacientes" }
    if (pathname.startsWith("/paciente/")) return { parent: "Ficha Clínica", label: "Detalles del Paciente", href: "/pacientes" }
    if (pathname.startsWith("/agenda")) return { parent: "Agenda", label: "Calendario Global", href: "/agenda" }
    if (pathname.startsWith("/finanzas")) return { parent: "Finanzas", label: "Facturación y Pagos", href: "/finanzas" }
    return { parent: "Sistema", label: "Módulo", href: "/" }
  }

  const { parent, label, href } = getBreadcrumbData()

  return (
    <div className="hidden md:flex items-center text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
      <Link href="/" className="hover:text-foreground transition-colors flex items-center">
        <Home className="w-3.5 h-3.5" />
      </Link>
      <ChevronRight className="w-3.5 h-3.5 mx-1 opacity-50" />
      <Link href={href} className="hover:text-foreground transition-colors">
        {parent}
      </Link>
      <ChevronRight className="w-3.5 h-3.5 mx-1 opacity-50" />
      <span className="text-foreground font-semibold truncate max-w-[120px]">{label}</span>
    </div>
  )
}