"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react" 
import {
  Calendar,
  ChevronDown,
  Home,
  Users,
  Settings,
  LucideIcon,
  Stethoscope,
  CreditCard,
  FileText,
  Activity,
  Box,
  Briefcase,
  Globe,
  Tag,
  FileCode,
  Image as ImageIcon,
  Sliders
} from "lucide-react"

import { cn } from "@/lib/utils"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible"
import { ScrollArea } from "./ui/scroll-area"
import Image from "next/image"

const mainNavItems = [
  { name: "Panel de Inicio", href: "/", icon: Home },
  { name: "Agenda de Citas", href: "/agendavand", icon: Calendar },
  { name: "Pacientes", href: "/pacientes", icon: Users },
]

const clinicaNavItems = [
  { name: "Historia Clínica", href: "/historia-clinica", icon: FileText },
  { name: "Odontograma", href: "/odontograma", icon: Activity },
  { name: "Evoluciones", href: "/evoluciones", icon: Stethoscope },
]

const adminNavItems = [
  { name: "Admin Center", href: "/admin", icon: Briefcase, roles: ["ADMIN"] },
  { name: "Facturación", href: "/facturacion", icon: CreditCard, roles: ["ADMIN", "RECEPTIONIST"] },
  { name: "Inventario", href: "/inventario", icon: Box, roles: ["ADMIN", "RECEPTIONIST"] },
]

const configNavItems = [
  { name: "Ajustes Generales", href: "/configuracion", icon: Sliders, roles: ["ADMIN"] },
  { name: "Agenda Online", href: "/configuracion/agenda-online", icon: Globe, roles: ["ADMIN"] },
  { name: "Arancel de Precios", href: "/configuracion/aranceles", icon: Tag, roles: ["ADMIN"] },
  { name: "Documentos Clínicos", href: "/configuracion/documentos", icon: FileCode, roles: ["ADMIN"] },
  { name: "Logotipo & Marca", href: "/configuracion/logotipo", icon: ImageIcon, roles: ["ADMIN"] },
]

type Item = {
  href: string
  name: string
  icon?: LucideIcon | React.ElementType
  color?: string
}

export const Nav = () => {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = React.useState(false)
  
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || "DOCTOR" 
  
  const visibleAdminItems = adminNavItems.filter(item => item.roles.includes(userRole))
  const visibleConfigItems = configNavItems.filter(item => item.roles.includes(userRole))
  
  const showAdminModule = visibleAdminItems.length > 0
  const showConfigModule = visibleConfigItems.length > 0

  const [openModule, setOpenModule] = React.useState<"clinica" | "admin" | "config" | null>(null)

  React.useEffect(() => {
    if (!pathname) return

    const isClinica = clinicaNavItems.some(i => pathname === i.href || pathname.startsWith(i.href + "/"))
    const isAdmin = visibleAdminItems.some(i => pathname === i.href || pathname.startsWith(i.href + "/"))
    const isConfig = visibleConfigItems.some(i => pathname === i.href || pathname.startsWith(i.href + "/"))

    if (isClinica) setOpenModule("clinica")
    else if (isAdmin) setOpenModule("admin")
    else if (isConfig) setOpenModule("config")
  }, [pathname])

  const handleToggle = (moduleKey: "clinica" | "admin" | "config") => {
    setOpenModule(prev => (prev === moduleKey ? null : moduleKey))
  }

  return (
    <nav
      className={cn(
        "flex flex-col h-screen bg-background transition-all duration-300 ease-in-out z-40 shadow-sm border-r border-border select-none",
        isHovered ? "w-[260px]" : "w-[70px]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        href="/"
        className="h-[110px] flex items-center justify-center shrink-0 transition-all duration-300 border-b border-border bg-background hover:bg-muted/30 cursor-pointer"
      >
        {isHovered ? (
          <div className="flex items-center justify-center w-full px-0 py-2 transition-opacity duration-300 delay-75">
            <Image 
              src="/iconode.png" 
              alt="Logo Carmo Dental"
              width={220} 
              height={65}  
              className="object-contain drop-shadow-sm w-full h-auto max-h-[75px] scale-125 origin-center"
              priority
            />
          </div>
        ) : (
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#008bcd]/10 border border-[#008bcd]/20 shadow-sm transition-all">
            <Stethoscope className="h-5 w-5 text-[#008bcd]" />
          </div>
        )}
      </Link>

      <ScrollArea className="flex-1 w-full py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col gap-1.5 px-2 pb-10">
          
          {mainNavItems.map((item) => (
             <NavItem key={item.name} href={item.href} icon={item.icon} name={item.name} isExpanded={isHovered} />
          ))}

          <div className="mt-4">
            
            <div className={cn("flex items-center gap-2 mb-2 px-3 text-muted-foreground transition-all h-6 overflow-hidden", !isHovered && "justify-center px-0")}>
               {isHovered ? (
                 <strong className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap opacity-60">Módulos</strong>
               ) : (
                 <div className="h-[1px] w-8 bg-border" />
               )}
            </div>

            {/* MÓDULO 1: ÁREA CLÍNICA */}
            <Collapsible open={openModule === "clinica"}>
              <div onClick={() => handleToggle("clinica")}>
                <SectionTrigger isExpanded={isHovered} icon={Stethoscope} isOpen={openModule === "clinica"}>
                  Área Clínica
                </SectionTrigger>
              </div>
              <CollapsibleContent className="transition-all space-y-1 mt-1">
                {clinicaNavItems.map((item) => (
                  <NavItem key={item.name} item={item} isSubItem isExpanded={isHovered} />
                ))}
              </CollapsibleContent>
            </Collapsible>
            
            {/* MÓDULO 2: ADMINISTRACIÓN */}
            {showAdminModule && (
              <Collapsible open={openModule === "admin"}>
                <div onClick={() => handleToggle("admin")}>
                  <SectionTrigger isExpanded={isHovered} icon={Briefcase} isOpen={openModule === "admin"}>
                    Administración
                  </SectionTrigger>
                </div>
                <CollapsibleContent className="transition-all space-y-1 mt-1">
                  {visibleAdminItems.map((item) => (
                    <NavItem key={item.name} item={item} isSubItem isExpanded={isHovered} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* MÓDULO 3: CONFIGURACIÓN */}
            {showConfigModule && (
              <Collapsible open={openModule === "config"}>
                <div onClick={() => handleToggle("config")}>
                  <SectionTrigger isExpanded={isHovered} icon={Settings} isOpen={openModule === "config"}>
                    Configuración
                  </SectionTrigger>
                </div>
                <CollapsibleContent className="transition-all space-y-1 mt-1">
                  {visibleConfigItems.map((item) => (
                    <NavItem key={item.name} item={item} isSubItem isExpanded={isHovered} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

          </div>
        </div>
      </ScrollArea>
    </nav>
  )
}

interface NavItemProps {
  item?: Item
  href?: string
  icon?: LucideIcon | React.ElementType
  name?: string
  isSubItem?: boolean
  isExpanded: boolean 
}

export const NavItem = ({
  item,
  href,
  icon,
  name,
  isSubItem,
  isExpanded,
}: NavItemProps) => {
  const pathname = usePathname()
  
  const finalHref = item?.href || href || "#"
  const finalName = item?.name || name || ""
  const FinalIcon = item?.icon || icon

  const isActive = pathname === finalHref || (finalHref !== "/" && pathname?.startsWith(finalHref))

  return (
    <Link
      href={finalHref}
      className={cn(
        "group flex items-center rounded-xl py-2.5 transition-all duration-200 outline-none",
        !isExpanded ? "justify-center px-0 w-10 mx-auto" : "justify-start px-3 w-full gap-3",
        isActive
          ? "bg-[#008bcd]/10 text-[#008bcd] font-bold border border-[#008bcd]/20 shadow-xs"
          : "text-muted-foreground hover:bg-[#008bcd]/10 hover:text-[#008bcd] font-medium"
      )}
      title={!isExpanded ? finalName : undefined} 
    >
      <div className="flex items-center justify-center shrink-0">
        {FinalIcon && (
          <FinalIcon
            className={cn(
              "h-5 w-5 transition-transform duration-200 group-hover:scale-105",
              isActive ? "text-[#008bcd]" : "text-muted-foreground group-hover:text-[#008bcd]",
              isSubItem && !isExpanded ? "h-4 w-4" : ""
            )} 
          />
        )}
      </div>

      <span
        className={cn(
          "whitespace-nowrap overflow-hidden transition-all duration-300 text-sm font-semibold tracking-tight",
          isExpanded ? "w-auto opacity-100 ml-0" : "w-0 opacity-0 hidden ml-0"
        )}
      >
        {finalName}
      </span>
    </Link>
  )
}

const SectionTrigger = ({
  children,
  isExpanded,
  icon: Icon,
  isOpen
}: {
  children: React.ReactNode
  isExpanded: boolean
  icon?: LucideIcon
  isOpen?: boolean
}) => {
  return (
    <div
      className={cn(
        "flex items-center w-full rounded-xl py-2 transition-all duration-200 mt-3 group cursor-pointer select-none",
        "hover:bg-[#008bcd]/10 hover:text-[#008bcd]",
        !isExpanded
          ? "justify-center px-0"
          : "justify-between px-3"
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        {Icon && (
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors group-hover:text-[#008bcd]",
              isOpen ? "text-[#008bcd]" : "text-muted-foreground",
              isExpanded && "hidden"
            )}
          />
        )}

        <span
          className={cn(
            "text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap",
            isOpen ? "text-[#008bcd]" : "text-muted-foreground group-hover:text-[#008bcd]",
            isExpanded ? "opacity-100" : "opacity-0 w-0 hidden"
          )}
        >
          {children}
        </span>
      </div>

      {isExpanded && (
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen ? "rotate-180 text-[#008bcd]" : "text-muted-foreground group-hover:text-[#008bcd]"
          )}
        />
      )}
    </div>
  )
}