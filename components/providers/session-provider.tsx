"use client"
import { useEffect } from "react"
import { SessionProvider, useSession } from "next-auth/react"
function ActivityHeartbeat() {
  const { data, status } = useSession()
  const id = data?.user?.id
  const active = data?.user?.isActive
  useEffect(() => {
    if (status !== "authenticated" || !id || active !== true) return
    let busy = false
    let lastInteraction = Date.now()
    const interact = () => { lastInteraction = Date.now() }
    const send = async () => {
      if (busy || document.hidden || Date.now() - lastInteraction > 120000) return
      busy = true
      try { await fetch("/api/auth/activity", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", cache: "no-store" }) } catch {} finally { busy = false }
    }
    window.addEventListener("pointerdown", interact)
    window.addEventListener("keydown", interact)
    document.addEventListener("visibilitychange", send)
    void send()
    const timer = window.setInterval(send, 60000)
    return () => { window.clearInterval(timer); window.removeEventListener("pointerdown", interact); window.removeEventListener("keydown", interact); document.removeEventListener("visibilitychange", send) }
  }, [id, active, status])
  return null
}
export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider refetchOnWindowFocus refetchInterval={120}><ActivityHeartbeat />{children}</SessionProvider>
}
