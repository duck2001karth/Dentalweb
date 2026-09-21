"use client"

import { useMemo } from "react"
import { CalendarClock, User, ArrowRight, Clock, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useGetAppointments } from "@/hooks/appointments" 

export function NextPatientDropdown() {
  const router = useRouter()
  const { data: session } = useSession()

  const currentUser = session?.user as any
  const accentColor = currentUser?.calendarColor || "#008bcd"
  
  const { appointments, isLoading } = useGetAppointments({
    fecha: new Date(),
    doctorId: currentUser?.id,
  })

  const nextAppointment = useMemo(() => {
    if (!appointments || appointments.length === 0) return null;

    const pendingAppointments = appointments.filter(
      (app: any) => app.status === "SCHEDULED" || app.status === "WAITING"
    );

    if (pendingAppointments.length === 0) return null;

    const now = new Date();
    const currentHourMin = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const upcoming = pendingAppointments.find((app: any) => app.startTime >= currentHourMin) || pendingAppointments[0];

    return upcoming;
  }, [appointments])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-full text-muted-foreground hover:text-[#008bcd] hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
          <CalendarClock size={28} />
          {nextAppointment && (
            <span 
              className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full border-2 border-background animate-pulse" 
              style={{ backgroundColor: accentColor }}
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-2xl p-0 border-border shadow-2xl overflow-hidden mt-2 bg-popover">
        <div 
          className="px-4 py-3 border-b"
          style={{ 
            backgroundColor: `${accentColor}18`,
            borderBottomColor: `${accentColor}30`
          }}
        >
          <span 
            className="font-bold text-sm flex items-center gap-2"
            style={{ color: accentColor }}
          >
            <Clock size={16} /> Próximo Paciente
          </span>
        </div>
        
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: accentColor }} />
          </div>
        ) : nextAppointment ? (
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 border"
                style={{
                  backgroundColor: `${accentColor}15`,
                  borderColor: `${accentColor}30`,
                  color: accentColor,
                }}
              >
                {nextAppointment.patient?.firstName?.charAt(0)}{nextAppointment.patient?.lastName?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-foreground truncate">
                  {nextAppointment.patient?.firstName} {nextAppointment.patient?.lastName}
                </p>
                <p 
                  className="text-xs font-semibold w-fit px-2 py-0.5 rounded-md mt-0.5 border"
                  style={{
                    backgroundColor: `${accentColor}12`,
                    borderColor: `${accentColor}25`,
                    color: accentColor,
                  }}
                >
                  Hoy, {nextAppointment.startTime}
                </p>
              </div>
            </div>
            <div className="space-y-1 mb-4">
              <p className="text-sm text-muted-foreground truncate"><span className="font-semibold text-foreground">Motivo:</span> {nextAppointment.reason || "Consulta general"}</p>
              <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Box:</span> {nextAppointment.box || "Sin asignar"}</p>
            </div>
            <Button 
              onClick={() => router.push(`/paciente/${nextAppointment.patientId}`)}
              style={{ backgroundColor: accentColor }}
              className="w-full text-white font-bold rounded-xl transition-transform active:scale-95 hover:opacity-90 cursor-pointer"
            >
              Ir a Ficha Clínica <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <CalendarClock className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm font-bold text-foreground">Agenda Libre</p>
            <p className="text-xs mt-1">No tienes más citas pendientes para hoy.</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}