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

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="cursor-pointer transition-all hover:opacity-80 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#008bcd] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            <Avatar className="h-11 w-11 border-2 border-transparent hover:border-muted-foreground/20 transition-all shadow-sm">
              <AvatarImage
                src={session?.user?.image || ""}
                alt={session?.user?.name || "Usuario"}
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="bg-blue-50 dark:bg-blue-900/20 text-[#008bcd] font-bold text-lg">
                {session?.user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-6 h-6" />}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-64 p-2 bg-background border-border shadow-xl rounded-xl font-medium print:hidden"
        >
          <DropdownMenuLabel className="p-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Cuenta
            </p>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-bold text-foreground truncate">
                {session?.user?.name || "Usuario"}
              </p>
              <p className="text-xs text-muted-foreground truncate font-normal">
                {session?.user?.email || "Sin correo"}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator className="bg-border/50 my-1" />
          <DropdownMenuItem 
            onClick={() => setShowSettings(true)}
            className="flex items-center cursor-pointer px-3 py-2.5 text-sm rounded-lg hover:bg-muted focus:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4 mr-2.5 text-muted-foreground" />
            <span>Ajustes de cuenta</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => signOut({ callbackUrl: "/auth" })}
            className="flex items-center cursor-pointer px-3 py-2.5 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30 transition-colors mt-1"
          >
            <LogOut className="w-4 h-4 mr-2.5" />
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