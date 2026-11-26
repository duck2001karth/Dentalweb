"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  ListTree, 
  Users, 
  History, 
  ShieldCheck, 
  ChevronLeft,
  Handshake,
  Sparkles,
  Database 
} from "lucide-react"

const adminLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Convenios y Tarifas", href: "/admin/convenios", icon: Handshake, isNew: true },
  { name: "Catálogo de Precios", href: "/admin/catalogo", icon: ListTree },
  { name: "Gestión de Usuarios", href: "/admin/usuarios", icon: Users },
  { name: "Auditoría de Sistema", href: "/admin/auditoria", icon: History },
  { name: "Respaldos y Seguridad", href: "/admin/respaldos", icon: Database },
]

export default function AdminSidebar() {
  const [isHovered, setIsHovered] = useState(false)
  const pathname = usePathname()

  return (
    <aside 
      className={`transition-all duration-300 ease-in-out bg-card/95 backdrop-blur-md border-r border-border flex flex-col z-30 shrink-0 select-none shadow-sm ${
        isHovered ? "w-[270px]" : "w-[76px]"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-16 flex items-center justify-center border-b border-border/80 shrink-0 px-4">
        {isHovered ? (
          <div className="flex items-center gap-3 w-full animate-in fade-in duration-200">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#008bcd]/10 text-[#008bcd] border border-[#008bcd]/20 shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <h1 className="font-black text-base tracking-tight whitespace-nowrap text-foreground">
                Admin Center
              </h1>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Panel de Control
              </span>
            </div>
          </div>
        ) : (
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#008bcd]/10 text-[#008bcd] border border-[#008bcd]/20 transition-transform hover:scale-105">
            <ShieldCheck className="w-5 h-5 stroke-[2.3]" />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 custom-scrollbar">
        {isHovered && (
          <p className="px-3 text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-3 animate-in fade-in duration-150">
            Módulos Administrativos
          </p>
        )}
        
        {adminLinks.map((link) => {
          const Icon = link.icon
          const isActive = 
            link.href === "/admin" 
              ? pathname === "/admin" 
              : pathname === link.href || pathname.startsWith(`${link.href}/`)

          return (
            <Link key={link.name} href={link.href} className="block group relative">
              <div 
                className={`flex items-center rounded-xl transition-all font-semibold text-xs relative overflow-hidden ${
                  isHovered 
                    ? "justify-start px-3.5 py-3 gap-3" 
                    : "justify-center w-11 h-11 mx-auto"
                } ${
                  isActive 
                    ? "bg-[#008bcd] text-white shadow-md shadow-[#008bcd]/25 font-bold" 
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                {isActive && isHovered && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
                )}

                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                  isActive ? "scale-105" : "group-hover:scale-110"
                }`} />

                {isHovered && (
                  <div className="flex items-center justify-between w-full overflow-hidden animate-in fade-in duration-200">
                    <span className="whitespace-nowrap tracking-tight">{link.name}</span>
                    {link.isNew && (
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isActive 
                          ? "bg-white/20 text-white" 
                          : "bg-[#008bcd]/15 text-[#008bcd]"
                      }`}>
                        <Sparkles className="w-2.5 h-2.5" /> Nuevo
                      </span>
                    )}
                  </div>
                )}
                {!isHovered && (
                  <div className="fixed left-[84px] px-3 py-1.5 bg-[#0b0f19] text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-slate-800 whitespace-nowrap">
                    {link.name}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
      <div className="p-3 border-t border-border shrink-0 bg-card">
        <Link href="/">
          <div className={`flex items-center rounded-xl py-2.5 transition-all text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/60 ${
            isHovered ? "justify-start px-3 gap-2" : "justify-center w-11 h-11 mx-auto"
          }`}>
            <ChevronLeft className="w-5 h-5 shrink-0 text-[#008bcd]" />
            {isHovered && <span className="whitespace-nowrap">Volver a Clínica</span>}
          </div>
        </Link>
      </div>
    </aside>
  )
}