"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ListTree, Users, History, ChevronLeft, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle" 

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const adminLinks = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Catálogo de Precios", href: "/admin/catalogo", icon: ListTree },
    { name: "Gestión de Usuarios", href: "/admin/usuarios", icon: Users },
    { name: "Auditoría de Sistema", href: "/admin/auditoria", icon: History },
  ]

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-background">
      <aside className="w-[280px] bg-slate-100 dark:bg-slate-950 border-r border-border flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-border">
          <ShieldCheck className="w-6 h-6 text-emerald-500 mr-3" />
          <h1 className="text-slate-900 dark:text-white font-black text-lg tracking-tight">Admin Center</h1>
        </div>

        <div className="p-4 flex-1 space-y-1 mt-4">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Módulos</p>
          {adminLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link key={link.name} href={link.href}>
                <span className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive 
                    ? "bg-[#008bcd] text-white shadow-lg shadow-blue-900/20" 
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-foreground"
                )}>
                  <Icon className="w-4 h-4" /> {link.name}
                </span>
              </Link>
            )
          })}
        </div>
        <div className="p-6 border-t border-border flex items-center justify-between">
          <Link href="/pacientes">
            <span className="flex items-center gap-2 text-sm text-slate-500 hover:text-foreground transition-colors font-medium">
              <ChevronLeft className="w-4 h-4" /> Volver a Clínica
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-background">
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>

    </div>
  )
}