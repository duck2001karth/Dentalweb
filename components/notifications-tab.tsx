"use client"

import { Bell, Check, AlertCircle, Calendar, DollarSign, UserPlus, Stethoscope, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/hooks/notifications"

const getIcon = (type: string) => {
  switch(type) {
    case "PAYMENT": return <DollarSign className="text-emerald-500 w-4 h-4" />
    case "APPOINTMENT": return <Calendar className="text-blue-500 w-4 h-4" />
    case "CLINICAL": return <Stethoscope className="text-purple-500 w-4 h-4" />
    case "SYSTEM": return <UserPlus className="text-amber-500 w-4 h-4" />
    case "ALERT": return <AlertCircle className="text-red-500 w-4 h-4" />
    default: return <Bell className="text-muted-foreground w-4 h-4" />
  }
}

export function NotificationsDropdown() {
  const { data: session } = useSession()
  const { notifications, isLoading, markAsRead } = useNotifications()

  const currentUser = session?.user as any
  const userRole = currentUser?.role || "RECEPTIONIST"

  // Calculamos las no leídas
  const unreadNotifications = notifications.filter((n: any) => !n.isRead)
  const unreadCount = unreadNotifications.length

  const handleMarkAsRead = (id: string) => markAsRead([id])
  const handleMarkAllAsRead = () => {
    const unreadIds = unreadNotifications.map((n: any) => n.id)
    if (unreadIds.length > 0) markAsRead(unreadIds)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-full hover:bg-muted transition-colors">
        <Bell size={28} className="text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-[400px] rounded-2xl p-0 border-border shadow-2xl overflow-hidden">
        <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="font-bold text-sm text-foreground">Notificaciones</span>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="text-[10px] font-bold text-[#008bcd] hover:text-blue-700 transition-colors uppercase tracking-wider flex items-center gap-1">
              <Check size={12} /> Marcar leídas
            </button>
          )}
        </div>
        
        <div className="max-h-[350px] overflow-y-auto custom-scrollbar bg-background">
          {isLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#008bcd]" /></div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">Bandeja al día</p>
              <p className="text-xs mt-1">No tienes notificaciones pendientes.</p>
            </div>
          ) : (
            notifications.map((notif: any) => (
              <div 
                key={notif.id} 
                onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                className={cn(
                  "px-4 py-3 flex gap-3 transition-colors border-b border-border/50 last:border-0",
                  !notif.isRead ? "bg-blue-50/50 dark:bg-blue-950/10 cursor-pointer hover:bg-muted/50" : "opacity-70"
                )}
              >
                <div className="mt-0.5 shrink-0 bg-background p-2 rounded-full shadow-sm border border-border h-fit">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <p className={cn("text-sm truncate", !notif.isRead ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
                      {notif.title}
                    </p>
                    {userRole === "ADMIN" && (
                      <span className="text-[8px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase font-bold tracking-widest shrink-0 ml-2">
                        {notif.targetRole.substring(0,3)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{notif.message}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1.5 font-semibold">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
                {!notif.isRead && <div className="w-2 h-2 rounded-full bg-[#008bcd] shrink-0 mt-2 shadow-sm" />}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}