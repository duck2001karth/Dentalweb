"use client"

import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Menu, MoreHorizontal, Search, WifiOff, X } from "lucide-react"

import { useSearch } from "../providers/search-provider"
import { cn } from "@/lib/utils"
import { NotificationsHelp } from "@/components/notifications/notifications-help"
import { NotificationsDropdown } from "@/components/notifications/notifications-tab"
import { DynamicBreadcrumbs } from "@/components/breadcrumbs"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { NextPatientDropdown } from "@/components/notifications/notifications-patient"

const AppCommand = dynamic(() => import("../app-command").then((mod) => mod.AppCommand))
const GlobalLoader = dynamic(() => import("../global-loader").then((mod) => mod.GlobalLoader))

const Nav = dynamic(() => import("@/components/navigations/nav").then((mod) => mod.Nav), {
  loading: () => <div className="h-full min-h-20 w-full animate-pulse bg-card" />,
})

const ProfilePicture = dynamic(() =>
  import("../auth/profile-picture").then((mod) => mod.ProfilePicture)
)
const ThemeToggle = dynamic(() =>
  import("../theme-toggle").then((mod) => mod.ThemeToggle)
)

const Sheet = dynamic(() => import("../ui/sheet").then((mod) => mod.Sheet))
const SheetContent = dynamic(() => import("../ui/sheet").then((mod) => mod.SheetContent))
const SheetTrigger = dynamic(() => import("../ui/sheet").then((mod) => mod.SheetTrigger))
const SheetTitle = dynamic(() => import("../ui/sheet").then((mod) => mod.SheetTitle))

const headerIconClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

const headerWidgetClass =
  "flex shrink-0 items-center justify-center [&_button]:h-10 [&_button]:w-10 [&_button]:rounded-xl [&_button]:border-0 [&_button]:bg-transparent [&_button]:shadow-none [&_button]:hover:bg-accent/70 [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-ring [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-muted-foreground"

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const { toggle } = useSearch()

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === "b" &&
        (event.metaKey || event.ctrlKey) &&
        !event.repeat
      ) {
        event.preventDefault()
        toggle()
      }
    }

    document.addEventListener("keydown", handleShortcut)
    return () => document.removeEventListener("keydown", handleShortcut)
  }, [toggle])

  return (
    <div className="min-h-dvh min-w-0 bg-background font-sans text-foreground antialiased">
      <GlobalLoader />
      <div className="grid min-h-dvh min-w-0 grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)]">
        <aside className="sticky top-0 z-30 hidden h-dvh min-w-[70px] overflow-hidden border-r border-border/60 bg-card md:block print:hidden">
          <Nav />
        </aside>
        <div className="flex min-h-dvh min-w-0 flex-col">
          <Header />
          <main className="flex min-w-0 flex-1 flex-col" id="contenido-principal">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

const Header = () => {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isOnline, setIsOnline] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false)

  const currentUser = session?.user as { calendarColor?: string } | undefined
  const accentColor = currentUser?.calendarColor || "#008bcd"
  const hoverAccent = { "--hover-accent": accentColor } as CSSProperties

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setMobileSearchOpen(false)
    setMobileToolsOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-40 w-full min-w-0 border-b border-border/60 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85 print:hidden">
      <div className="flex h-16 min-w-0 items-center gap-1.5 px-3 sm:px-4 lg:h-[70px] lg:gap-3 lg:px-6">
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button type="button" className={headerIconClass} aria-label="Abrir menú de navegación">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent
              position="left"
              className="h-dvh w-[min(85vw,290px)] overflow-y-auto border-r border-border/60 bg-card p-0"
            >
              <SheetTitle className="sr-only">Navegación de Carmo Dental</SheetTitle>
              <Nav />
            </SheetContent>
          </Sheet>
        </div>
        <div className="hidden min-w-0 items-center gap-3 xl:flex">
          <QuickActions />
          <DynamicBreadcrumbs />
        </div>
        <div className="hidden min-w-0 items-center lg:flex xl:hidden">
          <DynamicBreadcrumbs />
        </div>
        <div className="hidden min-w-0 flex-1 justify-center px-1 md:flex lg:justify-start">
          <div className="w-full max-w-xl min-w-0">
            <AppCommand />
          </div>
        </div>

        <div className="min-w-0 flex-1 md:hidden" />

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            className={cn(headerIconClass, "md:hidden")}
            aria-label={mobileSearchOpen ? "Cerrar búsqueda" : "Abrir búsqueda"}
            aria-expanded={mobileSearchOpen}
            aria-controls="busqueda-movil"
            onClick={() => {
              setMobileSearchOpen((value) => !value)
              setMobileToolsOpen(false)
            }}
          >
            {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          {!isOnline && (
            <span className="inline-flex h-9 w-9 items-center justify-center text-destructive" title="Sin conexión a internet">
              <WifiOff className="h-4 w-4" aria-label="Sin conexión" />
            </span>
          )}
          <div
            className={cn(
              "mr-1 hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium xl:flex",
              isOnline
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            )}
            title="Estado de conexión del dispositivo"
          >
            <span className={cn("h-2 w-2 rounded-full", isOnline ? "bg-emerald-500" : "bg-destructive")} />
            {isOnline ? "Conectado" : "Sin conexión"}
          </div>

          <div className={cn(headerWidgetClass, "hidden lg:flex")} style={hoverAccent}>
            <NotificationsHelp />
          </div>
          <div className={cn(headerWidgetClass, "hidden sm:flex")} style={hoverAccent}>
            <NextPatientDropdown />
          </div>
          <div className={headerWidgetClass} style={hoverAccent}>
            <NotificationsDropdown />
          </div>
          <div className={headerWidgetClass}>
            <ThemeToggle />
          </div>
          <div className="flex shrink-0 items-center justify-center pl-0.5 sm:pl-1">
            <ProfilePicture />
          </div>
          <button
            type="button"
            className={cn(headerIconClass, "sm:hidden")}
            aria-label={mobileToolsOpen ? "Cerrar herramientas" : "Más herramientas"}
            aria-expanded={mobileToolsOpen}
            aria-controls="herramientas-moviles"
            onClick={() => {
              setMobileToolsOpen((value) => !value)
              setMobileSearchOpen(false)
            }}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <div id="busqueda-movil" className="border-t border-border/50 bg-card px-3 py-3 md:hidden">
          <AppCommand />
        </div>
      )}

      {mobileToolsOpen && (
        <div id="herramientas-moviles" className="flex items-center gap-3 border-t border-border/50 bg-card px-4 py-2 sm:hidden">
          <span className="text-xs font-medium text-muted-foreground">Ayuda y próximas citas</span>
          <div className={headerWidgetClass} style={hoverAccent}>
            <NotificationsHelp />
          </div>
          <div className={headerWidgetClass} style={hoverAccent}>
            <NextPatientDropdown />
          </div>
        </div>
      )}
    </header>
  )
}
