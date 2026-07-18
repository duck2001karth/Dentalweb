"use client"
import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ListTree, Users, History, ShieldCheck, ChevronLeft } from "lucide-react"

const adminLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Catálogo de Precios", href: "/admin/catalogo", icon: ListTree },
  { name: "Gestión de Usuarios", href: "/admin/usuarios", icon: Users },
  { name: "Auditoría de Sistema", href: "/admin/auditoria", icon: History },
]

export default function AdminSidebar() {
  const [isHovered, setIsHovered] = useState(false)
  const pathname = usePathname()

  return (
    <aside 
      className={`transition-all duration-300 ease-in-out bg-card border-r border-border flex flex-col z-20 shrink-0 shadow-sm ${
        isHovered ? 'w-[260px]' : 'w-[75px]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-16 flex items-center justify-center border-b border-border shrink-0">
        {isHovered ? (
          <div className="flex items-center gap-3 px-6 w-full transition-opacity duration-300">
            <ShieldCheck className="w-6 h-6 text-[#008bcd] shrink-0" />
            <h1 className="font-black text-lg tracking-tight whitespace-nowrap text-foreground">Admin Center</h1>
          </div>
        ) : (
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="w-5 h-5 text-[#008bcd]" />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {isHovered && (
          <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 whitespace-nowrap">
            Módulos Administrativos
          </p>
        )}
        
        {adminLinks.map((link) => {
          // Solución al bug: Asignar el ícono a una variable con mayúscula
          const Icon = link.icon; 
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/admin') || (pathname === '/admin' && link.href === '/admin');

          return (
            <Link key={link.name} href={link.href}>
              <span className={`flex items-center rounded-xl transition-all mb-1 ${
                isHovered ? "justify-start px-3 py-3 gap-3" : "justify-center w-11 h-11 mx-auto"
              } ${
                isActive 
                  ? "bg-[#008bcd] text-white shadow-md shadow-[#008bcd]/20" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}>
                <Icon className="w-5 h-5 shrink-0" />
                {isHovered && <span>{link.name}</span>}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-border shrink-0 bg-card flex items-center justify-center">
        <Link href="/">
          <span className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-[#008bcd] transition-colors font-semibold">
            <ChevronLeft className="w-5 h-5 shrink-0" />
            {isHovered && <span className="whitespace-nowrap">Volver a Clínica</span>}
          </span>
        </Link>
      </div>
    </aside>
  )
}