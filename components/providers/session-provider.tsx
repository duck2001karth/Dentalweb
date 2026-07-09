"use client"

import { SessionProvider } from "next-auth/react"

/**
 * NextAuthProvider es un componente de cliente que envuelve la aplicación
 * para permitir el uso del hook useSession() en cualquier parte del proyecto.
 */
export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}