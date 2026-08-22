"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react" 
import {
  Calendar, ChevronDown, Home, Users, Settings, LucideIcon,
  Stethoscope, CreditCard, FileText, Activity, Box, Briefcase,
  Globe, Tag, FileCode, Image as ImageIcon, Sliders
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent } from "./ui/collapsible"
import { ScrollArea } from "./ui/scroll-area"

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
  { name: "Agenda de Citas", href: "/agendavand", icon: Calendar },
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
  { name: "Ajustes Generales", href: "/configuracion", icon: Sliders, roles: ["ADMIN"] },
  { name: "Agenda Online", href: "/configuracion/agenda-online", icon: Globe, roles: ["ADMIN"] },
  { name: "Arancel de Precios", href: "/configuracion/aranceles", icon: Tag, roles: ["ADMIN"] },
  { name: "Documentos Clínicos", href: "/configuracion/documentos", icon: FileCode, roles: ["ADMIN"] },
  { name: "Logotipo & Marca", href: "/configuracion/logotipo", icon: ImageIcon, roles: ["ADMIN"] },
]

// ============================================================================
// 2. COMPONENTE PRINCIPAL: NAV
// ============================================================================

export const Nav = () => {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = React.useState(false)
  const [openModule, setOpenModule] = React.useState<"clinica" | "admin" | "config" | null>(null)
  
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || "DOCTOR"
  
  const visibleAdminItems = adminNavItems.filter(item => !item.roles || item.roles.includes(userRole))
  const visibleConfigItems = configNavItems.filter(item => !item.roles || item.roles.includes(userRole))
  
  const showAdminModule = visibleAdminItems.length > 0
  const showConfigModule = visibleConfigItems.length > 0

  React.useEffect(() => {
    if (!pathname) return
    if (clinicaNavItems.some(i => pathname.startsWith(i.href))) setOpenModule("clinica")
    else if (visibleAdminItems.some(i => pathname.startsWith(i.href))) setOpenModule("admin")
    else if (visibleConfigItems.some(i => pathname.startsWith(i.href))) setOpenModule("config")
  }, [pathname, visibleAdminItems, visibleConfigItems])

  const handleToggle = (moduleKey: "clinica" | "admin" | "config") => {
    setOpenModule(prev => (prev === moduleKey ? null : moduleKey))
  }

  return (
    <nav
      className={cn(
        "flex flex-col h-screen bg-card transition-all duration-300 ease-in-out z-40 border-r border-border/60 select-none relative shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
        isHovered ? "w-[260px]" : "w-[80px]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        href="/"
        className="h-[88px] flex items-center justify-center shrink-0 transition-all duration-300 border-b border-border/40 hover:bg-muted/20 relative overflow-hidden"
      >
        {isHovered ? (
          <div className="flex items-center justify-center w-full px-4 animate-in fade-in duration-300">
            <Image 
              src="/iconode.png" 
              alt="Logo Carmo Dental"
              width={220} 
              height={75}  
              className="object-contain w-full h-auto max-h-[75px] scale-110 origin-center"
              priority
            />
          </div>
        ) : (
          <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-[#008bcd] to-blue-400 shadow-md text-white animate-in zoom-in duration-300">
            <Stethoscope className="h-6 w-6" />
          </div>
        )}
      </Link>
      <ScrollArea className="flex-1 w-full py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col gap-1 px-3">
          
          {mainNavItems.map((item) => (
            <NavItem key={item.name} item={item} isExpanded={isHovered} />
          ))}

          {/* Margen reducido de mt-8 mb-3 a mt-5 mb-2 */}
          <div className="mt-5 mb-2">
            <div className={cn("flex items-center text-muted-foreground transition-all overflow-hidden", isHovered ? "px-4" : "justify-center")}>
              {isHovered ? (
                <span className="text-xs font-black uppercase tracking-widest opacity-60">Módulos del Sistema</span>
              ) : (
                <div className="h-[2px] w-8 bg-border/80 rounded-full" />
              )}
            </div>
          </div>

          <NavSection title="Área Clínica" icon={Stethoscope} isExpanded={isHovered} isOpen={openModule === "clinica"} onToggle={() => handleToggle("clinica")}>
            {clinicaNavItems.map((item) => <NavItem key={item.name} item={item} isSubItem isExpanded={isHovered} />)}
          </NavSection>

          {showAdminModule && (
            <NavSection title="Administración" icon={Briefcase} isExpanded={isHovered} isOpen={openModule === "admin"} onToggle={() => handleToggle("admin")}>
              {visibleAdminItems.map((item) => <NavItem key={item.name} item={item} isSubItem isExpanded={isHovered} />)}
            </NavSection>
          )}

          {showConfigModule && (
            <NavSection title="Configuración" icon={Settings} isExpanded={isHovered} isOpen={openModule === "config"} onToggle={() => handleToggle("config")}>
              {visibleConfigItems.map((item) => <NavItem key={item.name} item={item} isSubItem isExpanded={isHovered} />)}
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
  const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
  const Icon = item.icon

  return (
    <div className="relative group/navitem">
      <Link
        href={item.href}
        className={cn(
          "relative flex items-center rounded-xl py-2.5 transition-all duration-200 outline-none overflow-hidden", // py-3 cambiado a py-2.5
          !isExpanded ? "justify-center w-14 mx-auto" : "justify-start px-4 w-full gap-3",
          isActive 
            ? "bg-gradient-to-r from-[#008bcd]/15 to-transparent text-[#008bcd] font-bold" 
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#008bcd] rounded-r-full shadow-[1px_0_8px_rgba(0,139,205,0.5)]" />
        )}

        <div className="flex items-center justify-center shrink-0 relative z-10">
          <Icon className={cn(
            "transition-transform duration-300",
            isActive ? "text-[#008bcd] stroke-[2.5]" : "text-muted-foreground group-hover/navitem:text-foreground",
            isSubItem && !isExpanded ? "h-5 w-5" : "h-[20px] w-[20px]",
            !isExpanded && "group-hover/navitem:scale-110"
          )} />
        </div>

        <span className={cn(
          "whitespace-nowrap transition-all duration-300 text-sm tracking-tight relative z-10",
          isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 hidden"
        )}>
          {item.name}
        </span>
      </Link>

      {!isExpanded && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-foreground text-background text-sm font-bold rounded-md opacity-0 pointer-events-none group-hover/navitem:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap shadow-xl">
          {item.name}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-foreground" />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 4. COMPONENTE: SECCIÓN COLAPSABLE
// ============================================================================

const NavSection = ({ title, icon: Icon, isExpanded, isOpen, onToggle, children }: { title: string, icon: LucideIcon, isExpanded: boolean, isOpen: boolean, onToggle: () => void, children: React.ReactNode }) => {
  return (
    <Collapsible open={isOpen} className="mt-1"> {/* mt-2 cambiado a mt-1 */}
      <div 
        onClick={onToggle}
        className={cn(
          "flex items-center w-full rounded-xl py-2.5 transition-all duration-200 group cursor-pointer select-none relative", // py-3 cambiado a py-2.5
          "hover:bg-muted/40",
          !isExpanded ? "justify-center w-14 mx-auto" : "justify-between px-4"
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Icon className={cn(
            "h-5 w-5 shrink-0 transition-colors duration-300",
            isOpen ? "text-foreground stroke-[2.5]" : "text-muted-foreground group-hover:text-foreground",
            isExpanded && "hidden" 
          )} />

          <span className={cn(
            "text-xs font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap",
            isOpen ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
            isExpanded ? "opacity-100" : "opacity-0 w-0 hidden"
          )}>
            {title}
          </span>
        </div>

        {isExpanded && (
          <ChevronDown className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-300 text-muted-foreground",
            isOpen && "rotate-180 text-foreground"
          )} />
        )}
      </div>

      <CollapsibleContent className="transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        <div className="flex flex-col gap-0.5 mt-1 relative before:absolute before:left-7 before:top-0 before:bottom-0 before:w-[1px] before:bg-border/50">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}