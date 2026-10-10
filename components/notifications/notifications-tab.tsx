"use client"

import { 
  Bell, Check, AlertCircle, Calendar, DollarSign, 
  UserPlus, Stethoscope, Loader2, MessageSquare, ExternalLink, ChevronRight 
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/hooks/notifications"

const getIcon = (type: string) => {
  switch (type) {
    case "DEBT_ALERT":
      return <DollarSign className="text-amber-500 w-4 h-4 stroke-[2.5]" />
    case "PAYMENT":
      return <DollarSign className="text-emerald-500 w-4 h-4" />
    case "APPOINTMENT":
      return <Calendar className="text-blue-500 w-4 h-4" />
    case "CLINICAL":
      return <Stethoscope className="text-purple-500 w-4 h-4" />
    case "SYSTEM":
      return <UserPlus className="text-amber-500 w-4 h-4" />
    case "ALERT":
      return <AlertCircle className="text-red-500 w-4 h-4" />
    default:
      return <Bell className="text-muted-foreground w-4 h-4" />
  }
}

export function NotificationsDropdown() {
  const router = useRouter()
  const { data: session } = useSession()
  const { notifications = [], isLoading, markAsRead } = useNotifications()
  const currentUser = session?.user as any
  const userRole = String(currentUser?.role || "RECEPTIONIST").toUpperCase().trim()

  const unreadNotifications = notifications.filter((n: any) => !n.isRead)
  const unreadCount = unreadNotifications.length

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    markAsRead([id])
  }

  const handleMarkAllAsRead = () => {
    const unreadIds = unreadNotifications.map((n: any) => n.id)
    if (unreadIds.length > 0) markAsRead(unreadIds)
  }

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      markAsRead([notif.id])
    }
    if (notif.link) {
      router.push(notif.link)
    }
  }

  const handleSendWhatsApp = (notif: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!notif.patientPhone) return
    const cleanPhone = String(notif.patientPhone).replace(/\D/g, "")
    const text = encodeURIComponent(
      `Hola, le saludamos de la clínica dental. Le recordamos que mantiene un saldo pendiente de $${Number(notif.pendingAmount || 0).toFixed(2)}. Si tiene dudas con sus pagos o desea agendar su próxima cita, estamos a su disposición.`
    )
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-12 w-12 rounded-full hover:bg-muted transition-colors cursor-pointer"
        >
          <Bell size={28} className="text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-[420px] rounded-2xl p-0 border-border shadow-2xl overflow-hidden bg-card"
      >
        <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">Notificaciones</span>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-red-500/15 text-red-600 dark:text-red-400 font-extrabold px-2 py-0.5 rounded-full border border-red-500/20">
                {unreadCount} nuevas
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[10px] font-bold text-[#008bcd] hover:text-blue-700 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Check size={12} /> Marcar leídas
            </button>
          )}
        </div>

        {/* Lista de Notificaciones */}
        <div className="max-h-[380px] overflow-y-auto custom-scrollbar bg-background divide-y divide-border/40">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#008bcd]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">Bandeja al día</p>
              <p className="text-xs mt-1">No tienes avisos ni deudas pendientes.</p>
            </div>
          ) : (
            notifications.map((notif: any) => {
              const isDebt = notif.type === "DEBT_ALERT"

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "px-4 py-3 flex gap-3 transition-colors cursor-pointer group",
                    !notif.isRead
                      ? isDebt
                        ? "bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-l-amber-500"
                        : "bg-blue-50/50 dark:bg-blue-950/10 hover:bg-muted/50 border-l-2 border-l-[#008bcd]"
                      : "opacity-75 hover:opacity-100 hover:bg-muted/30"
                  )}
                >
                  {/* Icono de tipo */}
                  <div
                    className={cn(
                      "mt-0.5 shrink-0 p-2 rounded-xl shadow-xs border h-fit",
                      isDebt
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-background border-border"
                    )}
                  >
                    {getIcon(notif.type)}
                  </div>

                  {/* Cuerpo del Mensaje */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5 gap-2">
                      <p
                        className={cn(
                          "text-xs truncate",
                          !notif.isRead ? "font-black text-foreground" : "font-semibold text-muted-foreground"
                        )}
                      >
                        {notif.title}
                      </p>
                      
                      {isDebt && notif.pendingAmount && (
                        <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0">
                          ${Number(notif.pendingAmount).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Acciones Rápidas para Deuda */}
                    <div className="flex items-center justify-between mt-2 pt-1">
                      <span className="text-[10px] text-muted-foreground/70 font-semibold">
                        {notif.createdAt
                          ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })
                          : "Reciente"}
                      </span>

                      <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                        {isDebt && notif.patientPhone && (userRole === "ADMIN" || userRole === "RECEPCION" || userRole === "RECEPCIONISTA") && (
                          <button
                            type="button"
                            onClick={(e) => handleSendWhatsApp(notif, e)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                            title="Enviar WhatsApp al paciente"
                          >
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </button>
                        )}

                        {notif.link && (
                          <span className="text-[10px] font-bold text-[#008bcd] flex items-center group-hover:underline">
                            Ver <ChevronRight className="w-3 h-3 ml-0.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0 mt-2 shadow-xs",
                        isDebt ? "bg-amber-500" : "bg-[#008bcd]"
                      )}
                    />
                  )}
                </div>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}