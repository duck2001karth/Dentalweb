"use client"

import { Plus, CalendarPlus, UserPlus, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function QuickActions() {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-full h-9 px-4 font-bold shadow-sm hidden lg:flex transition-transform active:scale-95">
          <Plus size={16} className="mr-1.5" /> Nuevo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 rounded-xl bg-card border-border shadow-xl mt-2">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Acciones Rápidas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => router.push("/agendavand")} 
          className="cursor-pointer font-medium py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <CalendarPlus className="w-4 h-4 mr-2 text-blue-500" /> 
          <div className="flex flex-col">
            <span>Agendar Cita</span>
            <span className="text-[10px] text-muted-foreground">Ir al calendario global</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => router.push("/pacientes?new=true")}
          className="cursor-pointer font-medium py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        >
          <UserPlus className="w-4 h-4 mr-2 text-emerald-500" /> 
          <div className="flex flex-col">
            <span>Registrar Paciente</span>
            <span className="text-[10px] text-muted-foreground">Añadir al directorio</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => router.push("/finanzas")} 
          className="cursor-pointer font-medium py-2.5 hover:bg-amber-50 dark:hover:bg-amber-900/20"
        >
          <CreditCard className="w-4 h-4 mr-2 text-amber-500" /> 
          <div className="flex flex-col">
            <span>Registrar Cobro</span>
            <span className="text-[10px] text-muted-foreground">Añadir pago o factura</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}