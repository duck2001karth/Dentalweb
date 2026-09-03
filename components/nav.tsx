"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react" 
import {
  Calendar, ChevronDown, Home, Users, Settings, LucideIcon,
  Stethoscope, CreditCard, FileText, Activity, Box, Briefcase,
  FileCode, Sliders
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useClinicSettings } from "@/config/clinic-settings"

// ============================================================================
// 1. CONFIGURACIÓN DE RUTAS Y ROLES
// ============================================================================

type NavItemConfig = {
  name: string
  href: string
  icon: LucideIcon
  roles?: string[]
}

const mainNavItems: NavItemConfig[] = [
  { name: "Panel de Inicio", href: "/", icon: Home },
  { name: "Agenda de Citas", href: "/agenda-global", icon: Calendar },
  { name: "Pacientes", href: "/pacientes", icon: Users },
]

const clinicaNavItems: NavItemConfig[] = [
  { name: "Historia Clínica", href: "/historia-clinica", icon: FileText },
  { name: "Odontograma", href: "/odontograma", icon: Activity },
  { name: "Evoluciones", href: "/evoluciones", icon: Stethoscope },
]

const adminNavItems: NavItemConfig[] = [
  { name: "Admin Center", href: "/admin", icon: Briefcase, roles: ["ADMIN"] },
  { name: "Caja y Arqueo", href: "/cajas", icon: CreditCard, roles: ["ADMIN", "RECEPTIONIST"] },
  { name: "Inventario", href: "/inventario", icon: Box, roles: ["ADMIN", "RECEPTIONIST"] },
]

const configNavItems: NavItemConfig[] = [
  { name: "Ajustes de Clínica", href: "/ajustes", icon: Sliders, roles: ["ADMIN"] },
  { name: "Plantillas Clínicas", href: "/ajustes/plantillas", icon: FileCode, roles: ["ADMIN"] },
]

type ModuleKey = "clinica" | "admin" | "config"

// ============================================================================
// 2. COMPONENTE PRINCIPAL: NAV
// ============================================================================

export const Nav = () => {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = React.useState(false)
  const [activeOpenModule, setActiveOpenModule] = React.useState<ModuleKey | null>(null)
  
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || "ADMIN"
  const { settings } = useClinicSettings()
  const visibleAdminItems = React.useMemo(() => {
    return adminNavItems.filter(item => !item.roles || item.roles.includes(userRole))
  }, [userRole])

  const visibleConfigItems = React.useMemo(() => {
    return configNavItems.filter(item => !item.roles || item.roles.includes(userRole))
  }, [userRole])
  
  const showAdminModule = visibleAdminItems.length > 0
  const showConfigModule = visibleConfigItems.length > 0
  

  const [logoScale, setLogoScale] = React.useState(100)

  React.useEffect(() => {
    const updateScale = () => {
      const saved = localStorage.getItem("clinic_logo_scale")
      if (saved) setLogoScale(Number(saved))
      else if (settings?.logoScale) setLogoScale(settings.logoScale)
    }
    updateScale()
    window.addEventListener("logoScaleUpdated", updateScale)
    return () => window.removeEventListener("logoScaleUpdated", updateScale)
  }, [settings?.logoScale])
  React.useEffect(() => {
    if (!pathname) return

    if (clinicaNavItems.some(i => pathname === i.href || pathname.startsWith(`${i.href}/`))) {
      setActiveOpenModule("clinica")
    } else if (visibleAdminItems.some(i => pathname === i.href || pathname.startsWith(`${i.href}/`))) {
      setActiveOpenModule("admin")
    } else if (visibleConfigItems.some(i => pathname === i.href || pathname.startsWith(`${i.href}/`))) {
      setActiveOpenModule("config")
    }
  }, [pathname])

  const toggleModule = (moduleKey: ModuleKey) => {
    setActiveOpenModule(prev => (prev === moduleKey ? null : moduleKey))
  }

  const scaleRatio = logoScale / 100

  return (
    <nav
      className={cn(
        "flex flex-col h-screen bg-card transition-all duration-300 ease-in-out z-40 border-r border-border/60 select-none relative shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0",
        isHovered ? "w-[260px]" : "w-[80px]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* CABECERA DE LOGOTIPO DINÁMICO */}
      <Link 
        href="/"
        className={cn(
          "flex items-center justify-center shrink-0 border-b border-border/40 hover:bg-muted/10 transition-all duration-300 relative overflow-hidden",
          isHovered ? "h-28 w-full px-3 py-2" : "h-20 w-full p-2"
        )}
      >
        {isHovered ? (
          <div className="flex items-center justify-center w-full h-full animate-in fade-in duration-200 overflow-hidden">
            {settings?.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt={settings?.clinicName || "Logo Clínica"} 
                style={{ transform: `scale(${scaleRatio})` }}
                className="w-full h-full max-h-24 max-w-[210px] object-contain drop-shadow-md transition-transform duration-200"
              />
            ) : (
              <span className="font-black text-lg text-foreground text-center tracking-tight leading-tight">
                {settings?.clinicName || "Carmo Dental"}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full animate-in zoom-in duration-200">
            {settings?.logoUrl ? (
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-background/50 border border-border/60 p-1 shadow-xs overflow-hidden">
                <img 
                  src={settings.logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
            ) : (
              <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-[#008bcd] to-sky-400 shadow-md text-white font-black text-xl">
                {settings?.clinicName?.charAt(0) || "C"}
              </div>
            )}
          </div>
        )}
      </Link>
      
      {/* LISTADO DE NAVEGACIÓN */}
      <ScrollArea className="flex-1 w-full py-4">
        <div className="flex flex-col gap-1 px-3">
          
          {mainNavItems.map((item) => (
            <NavItem key={item.name} item={item} isExpanded={isHovered} />
          ))}

          <div className="mt-5 mb-2">
            <div className={cn("flex items-center text-muted-foreground transition-all overflow-hidden", isHovered ? "px-4" : "justify-center")}>
              {isHovered ? (
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Módulos del Sistema</span>
              ) : (
                <div className="h-[2px] w-8 bg-border/80 rounded-full" />
              )}
            </div>
          </div>

          {/* MÓDULO CLÍNICO */}
          <NavSection 
            title="Área Clínica" 
            icon={Stethoscope} 
            isExpanded={isHovered} 
            isOpen={activeOpenModule === "clinica"} 
            onToggle={() => toggleModule("clinica")}
          >
            {clinicaNavItems.map((item) => (
              <NavItem key={item.name} item={item} isSubItem isExpanded={isHovered} />
            ))}
          </NavSection>

          {/* MÓDULO ADMINISTRACIÓN */}
          {showAdminModule && (
            <NavSection 
              title="Administración" 
              icon={Briefcase} 
              isExpanded={isHovered} 
              isOpen={activeOpenModule === "admin"} 
              onToggle={() => toggleModule("admin")}
            >
              {visibleAdminItems.map((item) => (
                <NavItem key={item.name} item={item} isSubItem isExpanded={isHovered} />
              ))}
            </NavSection>
          )}

          {/* MÓDULO CONFIGURACIÓN */}
          {showConfigModule && (
            <NavSection 
              title="Configuración" 
              icon={Settings} 
              isExpanded={isHovered} 
              isOpen={activeOpenModule === "config"} 
              onToggle={() => toggleModule("config")}
            >
              {visibleConfigItems.map((item) => (
                <NavItem key={item.name} item={item} isSubItem isExpanded={isHovered} />
              ))}
            </NavSection>
          )}

        </div>
      </ScrollArea>
    </nav>
  )
}

// ============================================================================
// 3. COMPONENTE: ITEM DE NAVEGACIÓN
// ============================================================================

export const NavItem = ({ item, isSubItem, isExpanded }: { item: NavItemConfig, isSubItem?: boolean, isExpanded: boolean }) => {
  const pathname = usePathname()
  const isActive =
    item.href === "/" || item.href === "/ajustes"
      ? pathname === item.href
      : pathname === item.href || pathname?.startsWith(`${item.href}/`)

  const Icon = item.icon

  return (
    <div className="relative group/navitem w-full">
      <Link
        href={item.href}
        className={cn(
          "relative flex items-center rounded-xl py-2.5 transition-all duration-200 outline-none cursor-pointer z-10",
          !isExpanded ? "justify-center w-14 mx-auto" : "justify-start px-4 w-full gap-3",
          isActive 
            ? "bg-gradient-to-r from-[#008bcd]/15 to-transparent text-[#008bcd] font-bold" 
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#008bcd] rounded-r-full shadow-[1px_0_8px_rgba(0,139,205,0.5)]" />
        )}

        <div className="flex items-center justify-center shrink-0">
          <Icon className={cn(
            "transition-transform duration-300",
            isActive ? "text-[#008bcd] stroke-[2.5]" : "text-muted-foreground group-hover/navitem:text-foreground",
            isSubItem && !isExpanded ? "h-5 w-5" : "h-[20px] w-[20px]",
            !isExpanded && "group-hover/navitem:scale-110"
          )} />
        </div>

        {isExpanded && (
          <span className="whitespace-nowrap transition-all duration-300 text-sm tracking-tight">
            {item.name}
          </span>
        )}
      </Link>

      {!isExpanded && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-foreground text-background text-xs font-bold rounded-md opacity-0 pointer-events-none group-hover/navitem:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap shadow-xl">
          {item.name}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-foreground" />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 4. COMPONENTE: SECCIÓN COLAPSABLE TIPO ACORDEÓN
// ============================================================================

const NavSection = ({ 
  title, 
  icon: Icon, 
  isExpanded, 
  isOpen, 
  onToggle, 
  children 
}: { 
  title: string
  icon: LucideIcon
  isExpanded: boolean
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode 
}) => {
  return (
    <div className="mt-1 w-full"> 
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex items-center w-full rounded-xl py-2.5 transition-all duration-200 group cursor-pointer select-none relative outline-none",
          "hover:bg-muted/40 active:scale-[0.98]",
          !isExpanded ? "justify-center w-14 mx-auto" : "justify-between px-4"
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Icon className={cn(
            "h-5 w-5 shrink-0 transition-colors duration-300",
            isOpen ? "text-[#008bcd] stroke-[2.5]" : "text-muted-foreground group-hover:text-foreground",
            isExpanded && "hidden" 
          )} />

          {isExpanded && (
            <span className={cn(
              "text-xs font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap",
              isOpen ? "text-foreground font-extrabold" : "text-muted-foreground group-hover:text-foreground"
            )}>
              {title}
            </span>
          )}
        </div>

        {isExpanded && (
          <ChevronDown className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-300 text-muted-foreground",
            isOpen && "rotate-180 text-foreground"
          )} />
        )}
      </button>

      {isOpen && (
        <div className="flex flex-col gap-0.5 mt-1 relative before:pointer-events-none before:absolute before:left-7 before:top-0 before:bottom-0 before:w-[1px] before:bg-border/50 animate-in fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  )
}