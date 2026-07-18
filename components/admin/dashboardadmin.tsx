"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Search, Bell, User, ChevronLeft, 
  LayoutDashboard, ListTree, Users, History, ShieldCheck, X, DollarSign, Box, Calendar, Loader2, CheckCircle2
} from 'lucide-react';
import { ThemeToggle } from "@/components/theme-toggle";

const adminLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Catálogo de Precios", href: "/admin/catalogo", icon: ListTree },
  { name: "Gestión de Usuarios", href: "/admin/usuarios", icon: Users },
  { name: "Auditoría de Sistema", href: "/admin/auditoria", icon: History },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "ADMIN";
  const userName = session?.user?.name || "Usuario";

  // Estados reales para buscador y notificaciones
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<{patients: any[], catalog: any[]}>({ patients: [], catalog: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);

  // Carga de notificaciones reales
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/admin/notifications');
        if (res.ok) setNotifications(await res.json());
      } catch (error) { console.error(error); }
      finally { setIsLoadingNotifs(false); }
    };
    if (isNotificationsOpen) fetchNotifs();
  }, [isNotificationsOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = async () => {
    try {
      await fetch('/api/admin/notifications', { method: 'PATCH' });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) { console.error(error); }
  };

  // Buscador real con Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchTerm)}`);
          if (res.ok) setSearchResults(await res.json());
        } catch (error) { console.error(error); }
        finally { setIsSearching(false); }
      } else {
        setSearchResults({ patients: [], catalog: [] });
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Atajo Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const getNotifIcon = (type: string) => {
    if (type === 'PAYMENT') return <DollarSign size={18} className="text-emerald-500" />;
    if (type === 'INVENTORY') return <Box size={18} className="text-orange-500" />;
    return <Calendar size={18} className="text-blue-500" />;
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden transition-colors duration-200">
      
      {/* 1. SIDEBAR TOTALMENTE INTEGRADO AL MODO OSCURO */}
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
            const Icon = link.icon;
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/admin');
            
            return (
              <Link key={link.name} href={link.href} title={!isHovered ? link.name : ""}>
                <span className={`flex items-center rounded-xl transition-all mb-1 ${
                  isHovered ? "justify-start px-3 py-3 gap-3" : "justify-center w-11 h-11 mx-auto"
                } ${
                  isActive 
                    ? "bg-[#008bcd] text-white shadow-md shadow-blue-500/20" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}>
                  <Icon className="w-5 h-5 shrink-0" /> 
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                    isHovered ? "w-auto opacity-100" : "w-0 opacity-0 hidden"
                  }`}>
                    {link.name}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        
        {/* FOOTER SIDEBAR SIN EL TOGGLE */}
        <div className="p-4 border-t border-border shrink-0 bg-card flex items-center justify-center">
          <Link href="/">
            <span className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-[#008bcd] transition-colors font-semibold">
              <ChevronLeft className="w-5 h-5 shrink-0" />
              {isHovered && <span className="whitespace-nowrap">Volver a Clínica</span>}
            </span>
          </Link>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* TOP NAVBAR CON GLASSMORPHISM Y BOTÓN DE MODO OSCURO A LA DERECHA */}
        <header className="h-16 bg-card/70 backdrop-blur-md border-b border-border px-6 flex items-center justify-between shrink-0 z-10 shadow-sm transition-colors duration-200">
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
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* EL BOTÓN DE CAMBIO DE MODO CLARO/OSCURO AHORA AQUÍ */}
            <ThemeToggle />

            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-accent"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card"></span>
              )}
            </button>
            
            <div className="h-8 w-px bg-border hidden md:block"></div>
            
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm shrink-0">
                <User size={18} />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-foreground leading-none mb-1">{userName}</p>
                <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground leading-none">
                  {userRole.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ÁREA DE TRABAJO REALMENTE DINÁMICA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
          <div className="max-w-7xl mx-auto h-full">
             {children}
          </div>
        </div>
      </main>

      {/* MODAL DEL BUSCADOR INTEGRADO */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4 bg-background/80 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)}>
          <div className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden border border-border animate-in id:fade-in id:zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
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
                        <Link key={p.id} href={`/pacientes/${p.id}`} onClick={() => setIsSearchOpen(false)}>
                          <div className="w-full flex items-center gap-3 px-3 py-3 hover:bg-accent rounded-xl text-sm font-bold">{p.firstName} {p.lastName} <span className="text-xs font-normal text-muted-foreground">(CI: {p.ci})</span></div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.catalog.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">Procedimientos</div>
                      {searchResults.catalog.map(c => (
                        <Link key={c.id} href="/admin/catalogo" onClick={() => setIsSearchOpen(false)}>
                          <div className="w-full flex items-center justify-between px-3 py-3 hover:bg-accent rounded-xl text-sm font-bold"><div>{c.name} <p className="text-xs font-normal text-muted-foreground">{c.code}</p></div><span className="text-emerald-500">${c.basePrice}</span></div>
                        </Link>
                      ))}
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
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-card shadow-2xl border-l border-border animate-in id:slide-in-from-right duration-300 flex flex-col">
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
                    <div className="flex gap-4">
                      <div className="p-2.5 rounded-xl bg-background border border-border">{getNotifIcon(notif.type)}</div>
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
                <button onClick={markAllAsRead} className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl">
                  <CheckCircle2 size={16} /> Marcar todas como leídas
                </button>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}