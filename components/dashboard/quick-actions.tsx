"use client"

import { useState } from "react"
import { Plus, CalendarPlus, UserPlus, CreditCard, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

export function QuickActions() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isHovered, setIsHovered] = useState(false)

  const currentUser = session?.user as any
  const userRole = (currentUser?.role || "DOCTOR").toUpperCase()
  const accentColor = currentUser?.calendarColor || "#008bcd"
  const canManageFinances = userRole === "ADMIN" || userRole === "RECEPTIONIST"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="bg-transparent border-none text-foreground hover:bg-accent/60 font-bold text-sm h-10 px-3.5 rounded-xl shadow-none hidden lg:flex items-center gap-2 transition-colors duration-200 cursor-pointer outline-none group"
        >
          <Plus 
            className="w-[18px] h-[18px] stroke-[2.5] text-muted-foreground transition-colors" 
            style={{ color: isHovered ? accentColor : undefined }}
          />
          <span 
            className="tracking-tight font-medium transition-colors"
            style={{ color: isHovered ? accentColor : undefined }}
          >
            Nuevo
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="start" 
        className="w-60 rounded-2xl bg-card border border-border shadow-2xl p-1.5 mt-2 z-50"
      >
        <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
          Acciones Rápidas
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-1 bg-border/60" />

        <DropdownMenuItem 
          onClick={() => router.push("/agenda-global")} 
          className="cursor-pointer font-semibold text-xs p-2.5 rounded-xl flex items-center gap-3 transition-colors group hover:bg-muted/60"
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
            style={{
              backgroundColor: `${accentColor}18`,
              borderColor: `${accentColor}35`,
              borderWidth: 1,
              color: accentColor,
            }}
          >
            <CalendarPlus className="w-4 h-4" /> 
          </div>
          <div className="flex flex-col leading-tight">
            <span 
              className="font-bold text-foreground transition-colors text-xs group-hover:text-foreground"
            >
              Agendar Cita
            </span>
            <span className="text-[10px] text-muted-foreground font-normal">
              Ir al calendario global
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => router.push("/pacientes?new=true")}
          className="cursor-pointer font-semibold text-xs p-2.5 rounded-xl flex items-center gap-3 hover:bg-emerald-500/10 focus:bg-emerald-500/10 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-105 transition-transform">
            <UserPlus className="w-4 h-4" /> 
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-foreground group-hover:text-emerald-500 transition-colors text-xs">
              Registrar Paciente
            </span>
            <span className="text-[10px] text-muted-foreground font-normal">
              Añadir al directorio
            </span>
          </div>
        </DropdownMenuItem>

        {canManageFinances && (
          <DropdownMenuItem 
            onClick={() => router.push("/finanzas")} 
            className="cursor-pointer font-semibold text-xs p-2.5 rounded-xl flex items-center gap-3 hover:bg-amber-500/10 focus:bg-amber-500/10 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" /> 
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-foreground group-hover:text-amber-500 transition-colors text-xs">
                Registrar Cobro
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">
                Añadir pago o factura
              </span>
            </div>
          </DropdownMenuItem>
        )}

      </DropdownMenuContent>
    </DropdownMenu>
  )
}