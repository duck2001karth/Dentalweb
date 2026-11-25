"use client"

import { ShortcutTrigger } from "@/components/providers/keyboard-shortcuts-provider"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { Menu, Search, X } from "lucide-react"
import { useSession } from "next-auth/react"

import { cn } from "@/lib/utils"
import { NotificationsHelp } from "@/components/notifications/notifications-help"
import { NotificationsDropdown } from "@/components/notifications/notifications-tab"
import { DynamicBreadcrumbs } from "@/components/breadcrumbs"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { NextPatientDropdown } from "@/components/notifications/notifications-patient"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const AppCommand = dynamic(() => import("../app-command").then((mod) => mod.AppCommand))
const GlobalLoader = dynamic(() => import("../global-loader").then((mod) => mod.GlobalLoader))
const Nav = dynamic(() => import("@/components/navigations/nav").then((mod) => mod.Nav), {
  loading: () => <div className="h-full w-full animate-pulse bg-card" />,
})
const ProfilePicture = dynamic(() => import("../auth/profile-picture").then((mod) => mod.ProfilePicture))
const ThemeToggle = dynamic(() => import("../theme-toggle").then((mod) => mod.ThemeToggle))

export const AppLayout = ({ children }: { children: ReactNode }) => {


  return (
    <div className="min-h-dvh w-full min-w-0 bg-background font-sans text-foreground antialiased">
      <GlobalLoader />
      <div className="flex min-h-dvh min-w-0">

        <aside className="sticky top-0 z-30 hidden h-dvh shrink-0 border-r border-border/60 bg-card lg:block">
          <Nav />
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </div>
    </div>
  )
}

const Header = () => {
  const { data: session } = useSession()
  const pathname = usePathname()
  const currentUser = session?.user as { calendarColor?: string } | undefined
  const accentColor = currentUser?.calendarColor || "#008bcd"

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setMobileMenuOpen(false)
    setMobileSearchOpen(false)
  }, [pathname])

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

 const iconControlClass = cn(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
  "lg:h-11 lg:w-11",
  "transition-colors hover:bg-accent/60",
  "[&_button]:flex [&_button]:h-10 [&_button]:w-10",
  "[&_button]:items-center [&_button]:justify-center",
  "[&_button]:rounded-xl [&_button]:border-0",
  "[&_button]:bg-transparent [&_button]:shadow-none",
  "[&_button]:hover:bg-accent/60",
  "lg:[&_button]:h-11 lg:[&_button]:w-11",
  "[&_svg]:h-5 [&_svg]:w-5",
  "lg:[&_svg]:h-[22px] lg:[&_svg]:w-[22px]",
  "[&_svg]:text-muted-foreground",
  "[&_button:hover_svg]:text-primary"
)

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border/60 bg-background/90 backdrop-blur-xl print:hidden">
      <div className="flex h-[60px] min-w-0 items-center gap-2 px-3 sm:h-16 sm:px-4 lg:h-[72px] lg:gap-4 lg:px-6">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Abrir menú de navegación"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent
            position="left"
            size="content"
            showCloseButton={false}
            className="flex h-dvh w-[min(320px,88vw)] max-w-[88vw] flex-col overflow-hidden bg-card p-0"
          >
            <SheetHeader className="shrink-0 border-b border-border/60 px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <SheetTitle>Carmo Dental</SheetTitle>
                  <SheetDescription className="text-xs">Navegación del sistema</SheetDescription>
                </div>
                <SheetClose asChild>
                  <button
                    type="button"
                    aria-label="Cerrar menú"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </SheetClose>
              </div>
            </SheetHeader>
            <div className="min-h-0 w-full min-w-0 flex-1 overflow-hidden">
              <Nav mobile onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="hidden min-w-0 shrink-0 items-center gap-2 lg:flex">
          <QuickActions />
          <DynamicBreadcrumbs />
        </div>
        <div className="hidden min-w-0 flex-1 justify-center px-2 sm:flex lg:justify-start">
          <div className="w-full max-w-[700px]">
            <AppCommand />
          </div>
        </div>

        <div className="min-w-0 flex-1 sm:hidden">
          <span className="block truncate text-sm font-semibold">Carmo Dental</span>
        </div>

        <div className="flex shrink-0 items-center gap-1 lg:gap-2">
          <button
            type="button"
            aria-label={mobileSearchOpen ? "Cerrar búsqueda" : "Abrir búsqueda"}
            aria-expanded={mobileSearchOpen}
            onClick={() => setMobileSearchOpen((value) => !value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
          >
            <Search className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>

          <div
            className={cn(
              "hidden items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium xl:flex",
              isOnline
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-destructive/20 bg-destructive/10 text-destructive"
            )}
            title={isOnline ? "Conectado a internet" : "Sin conexión a internet"}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", isOnline ? "bg-emerald-500" : "bg-destructive")} />
            {isOnline ? "Online" : "Offline"}
          </div>

          <div style={{ "--hover-accent": accentColor } as React.CSSProperties} className={cn(iconControlClass, "hidden sm:flex")}>
            <NotificationsHelp />
          </div>
          <div style={{ "--hover-accent": accentColor } as React.CSSProperties} className={cn(iconControlClass, "hidden md:flex")}>
            <NextPatientDropdown />
          </div>
          <div style={{ "--hover-accent": accentColor } as React.CSSProperties} className={iconControlClass}>
            <NotificationsDropdown />
          </div>
          <ShortcutTrigger />
          <div className={iconControlClass}><ThemeToggle /></div>
          <div className="flex shrink-0 items-center pl-1"><ProfilePicture /></div>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="border-t border-border/50 px-3 py-3 sm:hidden">
          <div className="mx-auto w-full max-w-xl"><AppCommand /></div>
        </div>
      )}
    </header>
  )
}
