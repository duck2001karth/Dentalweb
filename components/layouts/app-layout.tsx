"use client"

import { ReactNode, useEffect, useState } from "react"
import dynamic from 'next/dynamic'
import { Menu } from "lucide-react" 
import { useSession } from "next-auth/react"
import { useSearch } from "../providers/search-provider"
import { cn } from "@/lib/utils"

import { NotificationsHelp } from "@/components/notifications/notifications-help"
import { NotificationsDropdown } from "@/components/notifications/notifications-tab"
import { DynamicBreadcrumbs } from "@/components/breadcrumbs"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { NextPatientDropdown } from "@/components/notifications/notifications-patient"

const AppCommand = dynamic(() => import('../app-command').then((mod) => mod.AppCommand))
const GlobalLoader = dynamic(() => import('../global-loader').then((mod) => mod.GlobalLoader))

// 1. Corrección del Loader del Nav para que use bg-card y no desentone al cargar
const Nav = dynamic(() => import('@/components/nav').then((mod) => mod.Nav), {
  loading: () => <div className="w-[70px] h-full bg-card border-r border-border/50" />,
})

const ProfilePicture = dynamic(() => import('../auth/profile-picture').then((mod) => mod.ProfilePicture))
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
        
        {/* 2. Barra lateral con bg-card y su borde sutil integrado */}
        <aside className="hidden md:block sticky top-0 h-screen overflow-hidden z-50 min-w-[70px] bg-card border-r border-border/50 shadow-xs transition-colors">
          <div className="h-full w-full">
            <Nav />
          </div>
        </aside>
        
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
  const { data: session } = useSession()
  const [isOnline, setIsOnline] = useState(true)

  const currentUser = session?.user as any
  const accentColor = currentUser?.calendarColor || "#008bcd"

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
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 h-[70px] flex items-center px-4 md:px-6 gap-3 print:hidden transition-colors">  
      
      <div className="md:hidden flex items-center">
        <Sheet>
          <SheetTrigger className="p-2 -ml-2 rounded-xl hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Menu className="h-5 w-5 text-foreground" />
          </SheetTrigger>
          {/* 3. Menú lateral móvil con bg-card igual que la versión de escritorio */}
          <SheetContent position="left" className="p-0 w-[260px] bg-card border-r border-border/50"> 
            <Nav />
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden md:flex items-center gap-3 shrink-0 mr-2">
        <QuickActions />
        <DynamicBreadcrumbs />
      </div>

      <div className="flex-1 flex justify-center lg:justify-start"> 
        <div className="w-full max-w-2xl">
          <AppCommand />
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 shrink-0">

        <div 
          className={cn(
            "hidden xl:flex items-center gap-1.5 mr-1 px-3 py-1.5 rounded-full border text-xs font-bold tracking-wider uppercase transition-colors shadow-xs",
            isOnline 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
              : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
          )}
          title={isOnline ? "Conexión estable a la nube" : "Sin conexión a internet"}
        >
          <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
          <span>{isOnline ? "Online" : "Offline"}</span>
        </div>

        {/* CENTRO DE AYUDA (NOTIFICATIONS-HELP) */}
        <div 
          style={{ "--hover-accent": accentColor } as React.CSSProperties}
          className="flex items-center justify-center [&_button]:h-10 [&_button]:w-10 [&_button]:rounded-xl [&_button]:bg-transparent [&_button]:border-none [&_button]:shadow-none [&_button]:hover:bg-accent/60 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:text-muted-foreground [&_button:hover_svg]:text-[var(--hover-accent)] [&_svg]:transition-colors"
        >
          <NotificationsHelp />
        </div>

        {/* PRÓXIMO PACIENTE */}
        <div 
          style={{ "--hover-accent": accentColor } as React.CSSProperties}
          className="flex items-center justify-center [&_button]:h-10 [&_button]:w-10 [&_button]:rounded-xl [&_button]:bg-transparent [&_button]:border-none [&_button]:shadow-none [&_button]:hover:bg-accent/60 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:text-muted-foreground [&_button:hover_svg]:text-[var(--hover-accent)] [&_svg]:transition-colors"
        >
          <NextPatientDropdown />
        </div>

        {/* NOTIFICACIONES */}
        <div 
          style={{ "--hover-accent": accentColor } as React.CSSProperties}
          className="flex items-center justify-center [&_button]:h-10 [&_button]:w-10 [&_button]:rounded-xl [&_button]:bg-transparent [&_button]:border-none [&_button]:shadow-none [&_button]:hover:bg-accent/60 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:text-muted-foreground [&_button:hover_svg]:text-[var(--hover-accent)] [&_svg]:transition-colors"
        >
          <NotificationsDropdown />
        </div>
        
        <div className="hidden sm:block w-[1px] h-6 bg-border/60 mx-1" />
        
        <div className="flex items-center justify-center [&_button]:h-10 [&_button]:w-10 [&_button]:rounded-xl [&_button]:hover:bg-accent/60 [&_svg]:w-5 [&_svg]:h-5">
          <ThemeToggle />
        </div>
        
        <div className="pl-1 flex items-center justify-center">
          <ProfilePicture />
        </div>
        
      </div>
    </header>
  )
}