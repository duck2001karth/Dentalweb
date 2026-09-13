"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Settings, LogOut, ShieldCheck, Stethoscope, UserCheck } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SettingsDialog } from "@/components/user-login/settingsaccount"

const getRoleBadge = (role?: string) => {
  const r = (role || "").toUpperCase()
  switch (r) {
    case "ADMIN":
      return { label: "Administrador", icon: ShieldCheck, color: "text-[#008bcd] bg-[#008bcd]/10 border-[#008bcd]/20" }
    case "RECEPTIONIST":
    case "RECEPCION":
      return { label: "Recepción", icon: UserCheck, color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20" }
    default:
      return { label: "Doctor", icon: Stethoscope, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
  }
}

const getInitials = (name?: string) => {
  if (!name) return "U"
  const parts = name.trim().split(" ")
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export const ProfilePicture = () => {
  const { data: session } = useSession()
  const [showSettings, setShowSettings] = useState(false)

  const user = session?.user as any
  const userName = user?.name || "Usuario"
  const userEmail = user?.email || "Sin correo asignado"
  const userRole = (user?.role || "DOCTOR").toUpperCase()
  const userSubtitle = user?.specialty || user?.especialidad || (
    userRole === "ADMIN" ? "Administración" : userRole === "RECEPTIONIST" || userRole === "RECEPCION" ? "Recepción y Caja" : "Odontología General"
  )

  const badge = getRoleBadge(userRole)
  const RoleIcon = badge.icon

  return (
    <div className="relative font-sans antialiased">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-2xl transition-all duration-200 hover:bg-muted/60 outline-none focus-visible:ring-2 focus-visible:ring-[#008bcd] group cursor-pointer"
          >
            <Avatar className="h-9 w-9 border border-border group-hover:border-[#008bcd] transition-colors shadow-xs shrink-0">
              <AvatarImage
                src={user?.image || ""}
                alt={userName}
                referrerPolicy="no-referrer"
                className="object-cover"
              />
              <AvatarFallback className="bg-[#008bcd]/10 text-[#008bcd] font-bold text-xs">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>

            <div className="hidden sm:flex flex-col text-left leading-tight pr-1">
              <span className="text-xs font-bold text-foreground group-hover:text-[#008bcd] transition-colors">
                {userName}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                {userSubtitle}
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          align="end" 
          className="w-64 p-2 bg-card border-border shadow-2xl rounded-2xl font-medium print:hidden mt-1.5"
        >
          <DropdownMenuLabel className="p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                Sesión Activa
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                <RoleIcon className="w-3 h-3" />
                {badge.label}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-bold text-foreground truncate">
                {userName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate font-normal">
                {userEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator className="bg-border/60 my-1" />

          <DropdownMenuItem 
            onClick={() => setShowSettings(true)}
            className="flex items-center cursor-pointer px-3 py-2.5 text-xs font-semibold rounded-xl text-foreground hover:bg-muted focus:bg-muted transition-colors gap-2.5"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span>Ajustes de cuenta</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => signOut({ callbackUrl: "/auth" })}
            className="flex items-center cursor-pointer px-3 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-500/10 focus:bg-rose-500/10 transition-colors mt-1 gap-2.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  )
}