"use client"

import { ReactNode, useEffect, useState } from "react"
import dynamic from 'next/dynamic'
import { Menu, HelpCircle, BookOpen, MessageCircle } from "lucide-react" 
import { useSearch } from "../providers/search-provider"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { NotificationsDropdown } from "@/components/notifications-tab"
import { DynamicBreadcrumbs } from "@/components/breadcrumbs"
import { QuickActions } from "@/components/quick-actions"
import { NextPatientDropdown } from "@/components/notifications-patient"

const AppCommand = dynamic(() => import('../app-command').then((mod) => mod.AppCommand))
const GlobalLoader = dynamic(() => import('../global-loader').then((mod) => mod.GlobalLoader))

const Nav = dynamic(() => import('../nav').then((mod) => mod.Nav), {
  loading: () => <div className="w-[70px] h-full bg-background border-r" />,
})

const ProfilePicture = dynamic(() => import('../user-login/profile-picture').then((mod) => mod.ProfilePicture))
const ThemeToggle = dynamic(() => import('../theme-toggle').then((mod) => mod.ThemeToggle))
const Sheet = dynamic(() => import('../ui/sheet').then((mod) => mod.Sheet))
const SheetContent = dynamic(() => import('../ui/sheet').then((mod) => mod.SheetContent))
const SheetTrigger = dynamic(() => import('../ui/sheet').then((mod) => mod.SheetTrigger))

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const { toggle } = useSearch()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [toggle])

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <GlobalLoader />
      <div className="md:grid md:grid-cols-[auto_1fr] min-h-screen w-full">
        <aside className="hidden md:block sticky top-0 h-screen overflow-hidden z-50 min-w-[70px]">
          <div className="h-full w-full">
            <Nav />
          </div>
        </aside>
        
        {/* ÁREA PRINCIPAL */}
        <main className="w-full flex flex-col min-h-screen overflow-x-hidden">
          <Header />
          <div className="flex-1 flex flex-col">
             {children}
          </div>
        </main>
      </div>
    </div>
  )
}

const Header = () => {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 h-[70px] flex items-center px-4 md:px-6 gap-4 print:hidden transition-all">  
      <div className="md:hidden flex items-center">
        <Sheet>
          <SheetTrigger className="p-2 -ml-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <Menu className="h-6 w-6 text-foreground" />
          </SheetTrigger>
          <SheetContent position="left" className="p-0 w-[260px]"> 
            <Nav />
          </SheetContent>
        </Sheet>
      </div>

      {/* 2. ACCIONES RÁPIDAS Y MIGAS DE PAN (Izquierda) */}
      <div className="hidden md:flex items-center gap-3 shrink-0 mr-2">
        <QuickActions />
        <DynamicBreadcrumbs />
      </div>

      {/* 3. OMNIBAR / BUSCADOR SPOTLIGHT (Centro) */}
      <div className="flex-1 flex justify-center lg:justify-start"> 
        <div className="w-full max-w-2xl">
          <AppCommand />
        </div>
      </div>
      
      {/* 4. HERRAMIENTAS, ESTADO Y PERFIL (Derecha) */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        
        {/* Indicador Online/Offline */}
        <div 
          className={cn(
            "hidden xl:flex items-center gap-1.5 mr-1 px-2.5 py-1.5 rounded-full border transition-colors",
            isOnline 
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
              : "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400"
          )}
          title={isOnline ? "Conexión estable a la nube" : "Sin conexión a internet"}
        >
          <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        {/* Menú de Ayuda */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* 1. Agregamos h-12 w-12 al Button para que el "círculo" invisible sea igual de grande */}
            <Button variant="ghost" size="icon" className="hidden sm:flex h-12 w-12 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {/* 2. Cambiamos w-5 h-5 por w-7 h-7 para que el ícono sea igual al sol */}
              <HelpCircle className="w-7 h-7" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl bg-card border-border shadow-xl">
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Centro de Ayuda</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer font-medium py-2.5 gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" /> Tutoriales
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer font-medium py-2.5 gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-500" /> Soporte Técnico
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        
        {/* Notificaciones por Próximo Paciente */}
        <NextPatientDropdown />
        {/* Notificaciones*/}
        <NotificationsDropdown />
        {/* Divisor vertical */}
        <div className="hidden sm:block w-px h-6 bg-border mx-1"></div>

        {/* Modo Claro/Oscuro */}
        <ThemeToggle />
        
        {/* Menú de Perfil de Usuario */}
        <div className="pl-1">
          <ProfilePicture />
        </div>
        
      </div>
    </header>
  )
}