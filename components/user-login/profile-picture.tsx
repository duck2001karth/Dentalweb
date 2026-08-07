"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Settings, LogOut, User as UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingsDialog } from "@/components/user-login/settingsaccount";

export const ProfilePicture = () => {
  const { data: session } = useSession();
  const [showSettings, setShowSettings] = useState(false);

  const user = session?.user as any;
  const userName = user?.name || "Patricio C";

  const userSpecialty = 
    user?.specialty || 
    user?.especialidad || 
    "ORTODONCIA";

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* TARJETA DEL PERFIL CON EFECTO HOVER */}
          <button
            type="button"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 hover:bg-accent/60 outline-none focus-visible:ring-2 focus-visible:ring-[#008bcd] group cursor-pointer"
          >
            {/* AVATAR */}
            <Avatar className="h-9 w-9 border border-border/80 group-hover:border-[#008bcd] transition-all shadow-xs shrink-0">
              <AvatarImage
                src={user?.image || ""}
                alt={userName}
                referrerPolicy="no-referrer"
                className="object-cover"
              />
              <AvatarFallback className="bg-muted text-foreground font-bold text-xs">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col text-left leading-tight pr-1">
              <span className="text-xs font-bold text-foreground group-hover:text-[#008bcd] transition-colors duration-200">
                {userName}
              </span>
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mt-0.5 opacity-80">
                {userSpecialty}
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          align="end" 
          className="w-64 p-2 bg-background border-border shadow-xl rounded-2xl font-medium print:hidden mt-1"
        >
          <DropdownMenuLabel className="p-3">
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1">
              Cuenta de Usuario
            </p>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-bold text-foreground truncate">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground truncate font-normal">
                {user?.email || "Sin correo"}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator className="bg-border/50 my-1" />

          <DropdownMenuItem 
            onClick={() => setShowSettings(true)}
            className="flex items-center cursor-pointer px-3 py-2.5 text-xs font-semibold rounded-xl hover:bg-muted focus:bg-muted transition-colors gap-2.5"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span>Ajustes de cuenta</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => signOut({ callbackUrl: "/auth" })}
            className="flex items-center cursor-pointer px-3 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors mt-1 gap-2.5"
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
  );
};