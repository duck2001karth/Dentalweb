"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Briefcase
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
  { name: "Facturación", href: "/facturacion", icon: CreditCard },
  { name: "Inventario", href: "/inventario", icon: Box },
  { name: "Liquidaciones", href: "/liquidaciones", icon: Briefcase },
  { name: "Configuración", href: "/configuracion", icon: Settings },
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

  return (
    <nav
      className={cn(
        "flex flex-col h-screen bg-background transition-all duration-300 ease-in-out z-40 shadow-sm border-r border-border",
        isHovered ? "w-[260px]" : "w-[70px]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* LOGO DE LA CLÍNICA */}
        <div className="h-[110px] flex items-center justify-center shrink-0 transition-all duration-300 border-b border-border bg-background">
          {isHovered ? (
            <div className="flex items-center justify-center w-full px-0 py-2 transition-opacity duration-300 delay-75">
              <Image 
                src="/iconode.png" 
                alt="Logo Carmo Dental"
                width={220} 
                height={65}  
                /* Agregamos scale-125 para forzar un zoom del 25% */
                className="object-contain drop-shadow-sm w-full h-auto max-h-[75px] scale-125 origin-center"
                priority
              />
            </div>
          ) : (
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 shadow-sm border border-blue-100 dark:border-blue-800/30 transition-all">
              <Stethoscope className="h-5 w-5 text-[#008bcd] dark:text-blue-400" />
            </div>
          )}
        </div>
      <ScrollArea className="flex-1 w-full py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col gap-2 text-sm px-2 pb-10 ">
          
          {/* MÓDULOS PRINCIPALES */}
          {mainNavItems.map((item) => (
             <NavItem key={item.name} href={item.href} icon={item.icon} name={item.name} isExpanded={isHovered} />
          ))}

          <div className="mt-4">
            
            <div className={cn("flex items-center gap-2 mb-2 px-3 text-muted-foreground transition-all h-6 overflow-hidden", !isHovered && "justify-center px-0")}>
               {isHovered ? (
                 <strong className="text-xs uppercase tracking-wider whitespace-nowrap opacity-70">Módulos</strong>
               ) : (
                 <div className="h-[1px] w-8 bg-border" />
               )}
            </div>

            <Collapsible defaultOpen={true}>
              <CollapsibleTrigger className="w-full group">
                <SectionTrigger isExpanded={isHovered} icon={Stethoscope}>Área Clínica</SectionTrigger>
              </CollapsibleTrigger>
              <CollapsibleContent className={cn(!isHovered && "hidden")}>
                {clinicaNavItems.map((item) => (
                  <NavItem key={item.name} item={item} isSubItem isExpanded={isHovered} />
                ))}
              </CollapsibleContent>
            </Collapsible>
            
            {/* COLLAPSIBLE: ADMINISTRACIÓN */}
            <Collapsible defaultOpen={true}>
              <CollapsibleTrigger className="w-full group">
                <SectionTrigger isExpanded={isHovered} icon={Briefcase}>Administración</SectionTrigger>
              </CollapsibleTrigger>
              <CollapsibleContent className={cn(!isHovered && "hidden")}>
                {adminNavItems.map((item) => (
                  <NavItem key={item.name} item={item} isSubItem isExpanded={isHovered} />
                ))}
              </CollapsibleContent>
            </Collapsible>

          </div>
        </div>
      </ScrollArea>
    </nav>
  )
}

// --- COMPONENTES AUXILIARES ---

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
  const finalColor = item?.color

  const isActive = pathname === finalHref || pathname?.startsWith(finalHref + '/')

  return (
    <Link
      href={finalHref}
      className={cn(
        "group flex items-center rounded-md py-2 transition-all duration-300",
        !isExpanded ? "justify-center px-0 w-10 mx-auto" : "justify-start px-3 w-full gap-3",
        isActive
          ? "bg-blue-500/10 text-[#008bcd] dark:text-blue-400 font-semibold border border-blue-500/20 shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-foreground font-medium"
      )}
      title={!isExpanded ? finalName : undefined} 
    >
      <div className="flex items-center justify-center shrink-0">
        {finalColor && !FinalIcon ? (
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: finalColor }}
          ></div>
        ) : null}
        
        {FinalIcon ? (
          <FinalIcon
            className={cn("h-5 w-5 transition-transform group-hover:scale-105", isSubItem && !isExpanded ? "h-4 w-4" : "")} 
            style={finalColor ? { color: finalColor } : {}}
          />
        ) : null}
      </div>

      <span
        className={cn(
          "whitespace-nowrap overflow-hidden transition-all duration-300",
          isExpanded ? "w-auto opacity-100 ml-0" : "w-0 opacity-0 hidden ml-0"
        )}
      >
        {finalName}
      </span>
    </Link>
  )
}

// Componente para los títulos colapsables
const SectionTrigger = ({
  children,
  isExpanded,
  icon: Icon,
}: {
  children: React.ReactNode
  isExpanded: boolean
  icon?: LucideIcon
}) => {
  return (
    <div
      className={cn(
        "flex items-center w-full rounded-lg py-2 transition-all duration-200 mt-2",
        "hover:bg-accent",
        !isExpanded
          ? "justify-center px-0"
          : "justify-between px-3"
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden text-muted-foreground">
        {Icon && (
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors group-hover:text-foreground",
              isExpanded && "hidden"
            )}
          />
        )}

        <span
          className={cn(
            "text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 whitespace-nowrap",
            "text-muted-foreground group-hover:text-foreground",
            isExpanded
              ? "opacity-100"
              : "opacity-0 w-0 hidden"
          )}
        >
          {children}
        </span>
      </div>

      {isExpanded && (
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      )}
    </div>
  )
}