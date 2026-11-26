"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Calendar, ChevronDown, Home, Users, Settings, type LucideIcon,
  Stethoscope, CreditCard, FileText, Activity, Box, Briefcase,
  FileCode, Sliders,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useClinicSettings } from "@/config/clinic-settings"

type NavItemConfig = {
  name: string
  href: string
  icon: LucideIcon
  roles?: string[]
}

// Las rutas y los permisos visibles se conservan.
const mainNavItems: NavItemConfig[] = [
  { name: "Panel de Inicio", href: "/", icon: Home },
  { name: "Agenda de Citas", href: "/agenda-global", icon: Calendar },
  { name: "Centro de Atención", href: "/centro-atencion", icon: Activity },
  { name: "Pacientes", href: "/pacientes", icon: Users },
]

const clinicaNavItems: NavItemConfig[] = [
  { name: "Historia Clínica", href: "/historia-clinica", icon: FileText },
  { name: "Odontograma", href: "/odontograma", icon: Activity },
  { name: "Evoluciones", href: "/evoluciones", icon: Stethoscope },
]

const adminNavItems: NavItemConfig[] = [
  { name: "Admin Center", href: "/admin", icon: Briefcase, roles: ["ADMIN"] },
 ]

const operationalNavItems: NavItemConfig[] = [
  { name: "Caja y Arqueo", href: "/cajas", icon: CreditCard, roles: ["ADMIN", "RECEPTIONIST"] },
  { name: "Inventario", href: "/inventario", icon: Box, roles: ["ADMIN", "RECEPTIONIST"] },
]

const configNavItems: NavItemConfig[] = [
  { name: "Ajustes de Clínica", href: "/ajustes", icon: Sliders, roles: ["ADMIN"] },
  { name: "Plantillas Clínicas", href: "/ajustes/plantillas", icon: FileCode, roles: ["ADMIN"] },
]

type ModuleKey = "clinica" | "operational" | "admin" | "config"

interface NavProps {
  /** En el Sheet móvil, las etiquetas siempre deben estar visibles. */
  mobile?: boolean
  /** Cierra el Sheet al seleccionar una ruta, incluso si es la actual. */
  onNavigate?: () => void
}

const matchesRoute = (pathname: string | null, href: string) =>
  pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`) === true)

export const Nav = ({ mobile = false, onNavigate }: NavProps) => {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = React.useState(false)
  const [activeOpenModule, setActiveOpenModule] = React.useState<ModuleKey | null>(null)
  const { data: session } = useSession()
  const currentUser = session?.user as
    | { role?: string; calendarColor?: string }
    | undefined
  // No presumir ADMIN cuando la sesión aún no ha cargado.
  const userRole = currentUser?.role ?? ""
  const accentColor = currentUser?.calendarColor || "#008bcd"
  const { settings } = useClinicSettings()

  const isExpanded = mobile || isHovered
  const visibleClinicalItems = React.useMemo(
    () => ["ADMIN", "DOCTOR"].includes(userRole) ? clinicaNavItems : [],
    [userRole]
  )
  const visibleOperationalItems = React.useMemo(
    () => operationalNavItems.filter(item => !item.roles || item.roles.includes(userRole)),
    [userRole]
  )
  const visibleAdminItems = React.useMemo(
    () => adminNavItems.filter(item => !item.roles || item.roles.includes(userRole)),
    [userRole]
  )
  const visibleConfigItems = React.useMemo(
    () => configNavItems.filter(item => !item.roles || item.roles.includes(userRole)),
    [userRole]
  )

  const [logoScale, setLogoScale] = React.useState(100)
  React.useEffect(() => {
    const updateScale = () => {
      const saved = window.localStorage.getItem("clinic_logo_scale")
      const next = saved ? Number(saved) : settings?.logoScale ?? 100
      setLogoScale(Number.isFinite(next) ? Math.min(Math.max(next, 40), 200) : 100)
    }
    updateScale()
    window.addEventListener("logoScaleUpdated", updateScale)
    return () => window.removeEventListener("logoScaleUpdated", updateScale)
  }, [settings?.logoScale])

  React.useEffect(() => {
    if (visibleClinicalItems.some(i => matchesRoute(pathname, i.href))) {
      setActiveOpenModule("clinica")
    } else if (visibleOperationalItems.some(i => matchesRoute(pathname, i.href))) {
      setActiveOpenModule("operational")
    } else if (visibleAdminItems.some(i => matchesRoute(pathname, i.href))) {
      setActiveOpenModule("admin")
    } else if (visibleConfigItems.some(i => matchesRoute(pathname, i.href))) {
      setActiveOpenModule("config")
    } else {
      // En el móvil, ofrecer inicialmente el área clínica sin ocupar demasiado.
      setActiveOpenModule(mobile ? (visibleClinicalItems.length ? "clinica" : visibleOperationalItems.length ? "operational" : null) : null)
    }
  }, [pathname, visibleClinicalItems, visibleOperationalItems, visibleAdminItems, visibleConfigItems, mobile])

  const toggleModule = (key: ModuleKey) => {
    setActiveOpenModule(prev => (prev === key ? null : key))
  }

  return (
    <nav
      aria-label={mobile ? "Navegación móvil" : "Navegación lateral"}
      className={cn(
        "relative z-0 flex shrink-0 flex-col bg-card font-sans text-foreground transition-[width] duration-200",
        mobile
          ? "h-full min-h-0 w-full min-w-0 border-0 shadow-none"
          : "h-dvh border-r border-border/60",
        !mobile && (isHovered ? "w-[260px]" : "w-[80px]")
      )}
      onMouseEnter={mobile ? undefined : () => setIsHovered(true)}
      onMouseLeave={mobile ? undefined : () => setIsHovered(false)}
    >
      {/* El panel móvil ya muestra el título Carmo Dental; evitar un segundo logo. */}
      {!mobile && (
        <Link
          href="/"
          onClick={onNavigate}
          aria-label="Ir al panel de inicio"
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden border-b border-border/50 hover:bg-muted/20",
            isExpanded ? "h-24 px-3 py-2" : "h-20 p-2"
          )}
        >
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.clinicName || "Carmo Dental"}
              style={{ transform: isExpanded ? `scale(${logoScale / 100})` : undefined }}
              className={cn(
                "object-contain",
                isExpanded ? "max-h-20 w-full max-w-[205px]" : "h-12 w-12 rounded-xl border border-border/60 bg-background p-1"
              )}
            />
          ) : (
            <span className={cn("font-semibold text-foreground", isExpanded ? "text-base" : "text-xl")}>
              {isExpanded ? (settings?.clinicName || "Carmo Dental") : (settings?.clinicName?.charAt(0) || "C")}
            </span>
          )}
        </Link>
      )}

      <ScrollArea className="min-h-0 w-full flex-1">
        <div className={cn("flex flex-col gap-1 py-3", isExpanded ? "px-3" : "px-2")}>
          {mainNavItems.map(item => (
            <NavItem key={item.href} item={item} isExpanded={isExpanded} accentColor={accentColor} onNavigate={onNavigate} />
          ))}

          <div className={cn("mb-1 mt-5", isExpanded ? "px-3" : "flex justify-center")}>
            {isExpanded ? (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Módulos del sistema
              </span>
            ) : (
              <div className="h-px w-8 bg-border" />
            )}
          </div>

          {visibleClinicalItems.length > 0 && (
          <NavSection
            title="Área Clínica"
            icon={Stethoscope}
            isExpanded={isExpanded}
            isOpen={activeOpenModule === "clinica"}
            onToggle={() => toggleModule("clinica")}
            accentColor={accentColor}
          >
            {visibleClinicalItems.map(item => (
              <NavItem key={item.href} item={item} isSubItem isExpanded={isExpanded} accentColor={accentColor} onNavigate={onNavigate} />
            ))}
          </NavSection>
          )}

          {visibleOperationalItems.length > 0 && (
            <NavSection
              title="Gestión Operativa"
              icon={CreditCard}
              isExpanded={isExpanded}
              isOpen={activeOpenModule === "operational"}
              onToggle={() => toggleModule("operational")}
              accentColor={accentColor}
            >
              {visibleOperationalItems.map(item => (
                <NavItem key={item.href} item={item} isSubItem isExpanded={isExpanded} accentColor={accentColor} onNavigate={onNavigate} />
              ))}
            </NavSection>
          )}

          {visibleAdminItems.length > 0 && (
            <NavSection
              title="Administración"
              icon={Briefcase}
              isExpanded={isExpanded}
              isOpen={activeOpenModule === "admin"}
              onToggle={() => toggleModule("admin")}
              accentColor={accentColor}
            >
              {visibleAdminItems.map(item => (
                <NavItem key={item.href} item={item} isSubItem isExpanded={isExpanded} accentColor={accentColor} onNavigate={onNavigate} />
              ))}
            </NavSection>
          )}

          {visibleConfigItems.length > 0 && (
            <NavSection
              title="Configuración"
              icon={Settings}
              isExpanded={isExpanded}
              isOpen={activeOpenModule === "config"}
              onToggle={() => toggleModule("config")}
              accentColor={accentColor}
            >
              {visibleConfigItems.map(item => (
                <NavItem key={item.href} item={item} isSubItem isExpanded={isExpanded} accentColor={accentColor} onNavigate={onNavigate} />
              ))}
            </NavSection>
          )}
        </div>
      </ScrollArea>
    </nav>
  )
}

interface NavItemProps {
  item: NavItemConfig
  isSubItem?: boolean
  isExpanded: boolean
  accentColor: string
  onNavigate?: () => void
}

export const NavItem = ({ item, isSubItem = false, isExpanded, accentColor, onNavigate }: NavItemProps) => {
  const pathname = usePathname()
  const isActive = matchesRoute(pathname, item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={!isExpanded ? item.name : undefined}
      aria-label={!isExpanded ? item.name : undefined}
      aria-current={isActive ? "page" : undefined}
      style={isActive ? { backgroundColor: `${accentColor}15`, color: accentColor } : undefined}
      className={cn(
        "group relative flex min-h-11 w-full items-center rounded-xl transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isExpanded ? "gap-3 px-3" : "justify-center",
        isSubItem && isExpanded && "pl-5",
        isActive
          ? "font-semibold"
          : "font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {isActive && <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full" style={{ backgroundColor: accentColor }} />}
      <Icon className="h-[19px] w-[19px] shrink-0" aria-hidden="true" />
      {isExpanded && <span className="min-w-0 truncate text-[13px]">{item.name}</span>}
    </Link>
  )
}

interface NavSectionProps {
  title: string
  icon: LucideIcon
  isExpanded: boolean
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  accentColor: string
}

const NavSection = ({ title, icon: Icon, isExpanded, isOpen, onToggle, children, accentColor }: NavSectionProps) => (
  <div className="mt-1 w-full">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={!isExpanded ? title : undefined}
      title={!isExpanded ? title : undefined}
      className={cn(
        "group flex min-h-11 w-full items-center rounded-xl text-left transition-colors",
        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isExpanded ? "justify-between gap-2 px-3" : "justify-center"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {!isExpanded && <Icon className="h-5 w-5" style={isOpen ? { color: accentColor } : undefined} aria-hidden="true" />}
        {isExpanded && (
          <span className={cn("truncate text-[11px] font-semibold uppercase tracking-wide", isOpen ? "text-foreground" : "text-muted-foreground")}>
            {title}
          </span>
        )}
      </div>
      {isExpanded && <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden="true" />}
    </button>
    {isOpen && <div className="mt-1 flex flex-col gap-0.5">{children}</div>}
  </div>
)
