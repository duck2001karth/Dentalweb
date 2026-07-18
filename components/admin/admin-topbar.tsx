"use client"

import React, { useState, useEffect } from "react"
import { Search, Bell, User, X, Box, Calendar, DollarSign, Loader2, CheckCircle2, LogOut, Settings, UserPlus } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export function AdminTopbar() {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const userName = session?.user?.name || "Usuario"
  const userRole = (session?.user as any)?.role || "ADMIN"
  const userImage = session?.user?.image 
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<{patients: any[], catalog: any[]}>({ patients: [], catalog: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(true)
  const [isSavingPatient, setIsSavingPatient] = useState(false)
  const [patientForm, setPatientForm] = useState({
    ci: "", firstName: "", lastName: "", phone: "", email: ""
  })

  useEffect(() => {
    const handleOpenPatientModal = () => setIsPatientModalOpen(true)
    window.addEventListener("open-new-patient-modal", handleOpenPatientModal)
    return () => window.removeEventListener("open-new-patient-modal", handleOpenPatientModal)
  }, [])
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/admin/notifications')
        if (res.ok) setNotifications(await res.json())
      } catch (error) { console.error(error) }
      finally { setIsLoadingNotifs(false) }
    }
    if (isNotificationsOpen) fetchNotifs()
  }, [isNotificationsOpen])

  const unreadCount = notifications.filter(n => !n.isRead).length
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true)
        try {
          const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchTerm)}`)
          if (res.ok) setSearchResults(await res.json())
        } catch (error) { console.error(error) }
        finally { setIsSearching(false) }
      } else {
        setSearchResults({ patients: [], catalog: [] })
      }
    }, 400)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "b" || e.key === "B") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsSearchOpen(open => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])
  return (
    <>
      <header className="h-16 sticky top-0 z-30 w-full backdrop-blur-md bg-card/70 border-b border-border flex items-center justify-between px-6 transition-colors duration-200">
        <div className="flex items-center gap-4 w-full max-w-md">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-between w-full py-2 px-4 rounded-full bg-muted border border-transparent hover:border-border text-sm text-muted-foreground transition-all"
          >
            <div className="flex items-center gap-2">
              <Search size={16} />
              <span>Buscar pacientes, procedimientos...</span>
            </div>
            <kbd className="hidden md:inline-flex items-center gap-1 font-mono text-[10px] font-medium opacity-70">
              <span className="text-xs">⌘</span>B
            </kbd>
          </button>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <ThemeToggle />

          <button 
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-accent"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card"></span>}
          </button>
          
          <div className="h-8 w-px bg-border hidden md:block"></div>
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 text-left cursor-pointer hover:opacity-90 transition-all p-1 rounded-xl hover:bg-accent"
            >
              {userImage ? (
                <div className="w-9 h-9 rounded-full overflow-hidden relative border border-border shadow-sm">
                  <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm shrink-0">
                  <User size={18} />
                </div>
              )}
              <div className="hidden md:block pr-1">
                <p className="text-sm font-bold text-foreground leading-none mb-1">{userName}</p>
                <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground leading-none">{userRole.toLowerCase()}</p>
              </div>
            </button>
            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-border md:hidden">
                    <p className="text-sm font-bold text-foreground">{userName}</p>
                    <p className="text-xs text-muted-foreground uppercase">{userRole}</p>
                  </div>
                  <Link href="/admin/settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors">
                    <Settings size={16} className="text-muted-foreground" /> Configuración
                  </Link>
                  <button 
                    onClick={() => { setIsUserMenuOpen(false); signOut({ callbackUrl: "/login" }); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors text-left"
                  >
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-background/80 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)}>
          <div className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center border-b border-border px-4 py-3">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <input 
                autoFocus type="text" placeholder="Busca por CI, Nombre o Código..." 
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
              <button onClick={() => setIsSearchOpen(false)} className="p-1 text-muted-foreground hover:text-foreground rounded-md">
                <kbd className="font-mono text-xs font-bold border border-border px-1.5 py-0.5 rounded bg-muted">ESC</kbd>
              </button>
            </div>
            
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {isSearching ? (
                <div className="p-6 text-center text-muted-foreground flex flex-col items-center">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
                  <p className="text-sm">Consultando base de datos...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.patients.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">Pacientes</div>
                      {searchResults.patients.map(p => (
                        <Link
                            key={p.id}
                            href={`/paciente/${p.id}`}
                            onClick={() => setIsSearchOpen(false)}
                          >
                          <div className="w-full flex items-center gap-3 px-3 py-3 hover:bg-accent rounded-xl text-sm font-bold text-foreground">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {p.firstName?.charAt(0)}{p.lastName?.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span>{p.firstName} {p.lastName}</span>
                              <span className="text-xs font-normal text-muted-foreground">CI: {p.ci}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.catalog.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">Catálogo de Procedimientos</div>
                      {searchResults.catalog.map(c => (
                        <Link key={c.id} href="/admin/catalogo" onClick={() => setIsSearchOpen(false)}>
                          <div className="w-full flex items-center justify-between px-3 py-3 hover:bg-accent rounded-xl transition-colors">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground">{c.name}</span>
                              <span className="text-xs text-muted-foreground">Categoría: {c.category} • {c.code}</span>
                            </div>
                            <span className="text-sm font-black text-emerald-500">${c.basePrice}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  
                  {searchTerm.length >= 2 && searchResults.patients.length === 0 && searchResults.catalog.length === 0 && (
                    <div className="p-6 text-center text-muted-foreground">
                      <p className="text-sm">No se encontraron resultados para "{searchTerm}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER DE NOTIFICACIONES */}
      {isNotificationsOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm" onClick={() => setIsNotificationsOpen(false)}></div>
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-card shadow-2xl border-l border-border animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="font-black text-lg text-foreground">Notificaciones</h3>
              <button onClick={() => setIsNotificationsOpen(false)} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingNotifs ? (
                <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : notifications.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">No tienes notificaciones recientes.</p>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className={`relative p-4 rounded-2xl border ${notif.isRead ? 'bg-card border-border opacity-70' : 'bg-primary/5 border-primary/20'}`}>
                    {!notif.isRead && <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary"></span>}
                    <div className="flex gap-4">
                      <div className="p-2.5 rounded-xl bg-background border border-border">
                        {notif.type === 'PAYMENT' ? <DollarSign size={18} className="text-emerald-500" /> : <Calendar size={18} className="text-blue-500" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{notif.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {unreadCount > 0 && (
              <div className="p-4 border-t border-border">
                <button onClick={async () => {
                  await fetch('/api/admin/notifications', { method: 'PATCH' })
                  setNotifications(notifications.map(n => ({ ...n, isRead: true })))
                }} className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl">
                  <CheckCircle2 size={16} /> Marcar todas como leídas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}