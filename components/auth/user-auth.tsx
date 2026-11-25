"use client"
import * as React from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"
const messages: Record<string,string> = { CredentialsSignin: "Correo o contraseña incorrectos, o acceso temporalmente bloqueado.", AccessDenied: "Cuenta no autorizada. Contacta al administrador.", AccountDisabled: "Tu cuenta está deshabilitada.", AccountSuspended: "Tu cuenta está deshabilitada.", OAuthAccountNotLinked: "No se pudo vincular tu cuenta de Google. Contacta al administrador.", AuthUnavailable: "El servicio de acceso no está disponible temporalmente.", OAuthCallback: "Google no pudo completar el acceso. Intenta otra vez o consulta a soporte.", Callback: "No se pudo completar el acceso. Consulta a soporte si persiste.", OAuthSignin: "No se pudo iniciar la conexión con Google.", Configuration: "El servicio de acceso necesita revisión técnica.", SwitchAccount: "Cierra la sesión anterior antes de cambiar de cuenta.", OAuthCreateAccount: "No se pudo vincular la cuenta autorizada. Consulta a soporte." }
const safeMessage = (code: string) => (Object.prototype.hasOwnProperty.call(messages, code) ? messages[code] : undefined) || "No se pudo iniciar sesión. Inténtalo nuevamente más tarde."
export function UserAuthForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter()
  const [email,setEmail] = React.useState("")
  const [password,setPassword] = React.useState("")
  const [show,setShow] = React.useState(false)
  const [busy,setBusy] = React.useState<"credentials"|"google"|null>(null)
  const [error,setError] = React.useState("")
  const lock = React.useRef(false)
  React.useEffect(() => { const code = new URLSearchParams(window.location.search).get("error"); if (code) setError(safeMessage(code)) }, [])
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (lock.current) return; lock.current=true; setBusy("credentials"); setError("")
    try {
      const res = await signIn("credentials", { redirect:false, email:email.trim().toLowerCase(), password })
      if (!res?.ok || res.error) { setError(safeMessage(res?.error || "AuthUnavailable")); setPassword(""); setShow(false); return }
      router.replace("/"); router.refresh()
    } catch { setError("No se pudo conectar. Inténtalo nuevamente.") } finally { lock.current=false; setBusy(null) }
  }
  async function google() {
    if (lock.current) return; lock.current=true; setBusy("google"); setError("")
    try { await signIn("google", { callbackUrl:"/" }) } catch { setError("No se pudo conectar con Google.") } finally { lock.current=false; setBusy(null) }
  }
  return <div className={cn("grid gap-3",className)} {...props}>
    {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-800 dark:text-rose-200"><ShieldAlert className="w-4 h-4 shrink-0"/><div><p className="leading-relaxed">{error}</p></div></div>}
    <form onSubmit={submit} className="grid gap-2">
      <label htmlFor="login-email" className="text-sm font-semibold">Correo autorizado</label><div className="relative"><Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground"/><Input id="login-email" type="email" placeholder="usuario@correo.com" autoComplete="username" maxLength={254} required value={email} disabled={!!busy} onChange={e=>setEmail(e.target.value)} className="h-10 pl-10 rounded-xl bg-background"/></div>
      <label htmlFor="login-password" className="text-sm font-semibold">Contraseña</label><div className="relative"><Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground"/><Input id="login-password" type={show?"text":"password"} placeholder="Contraseña" autoComplete="current-password" maxLength={200} required value={password} disabled={!!busy} onChange={e=>setPassword(e.target.value)} className="h-10 pl-10 pr-12 rounded-xl bg-background"/><button type="button" aria-label={show?"Ocultar contraseña":"Mostrar contraseña"} aria-pressed={show} onClick={()=>setShow(!show)} className="absolute right-3 top-2.5 text-muted-foreground">{show?<EyeOff size={20}/>:<Eye size={20}/>}</button></div>
      <Button type="submit" disabled={!!busy} className="h-10 rounded-xl font-bold">{busy==="credentials"&&<Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>}Iniciar sesión</Button>
    </form>
    <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="flex-1 border-t"/>O continuar con<span className="flex-1 border-t"/></div>
    <Button type="button" variant="outline" onClick={google} disabled={!!busy} className="h-10 rounded-xl font-semibold">{busy==="google"?<Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>:<Icons.google className="mr-2 h-4 w-4"/>}Google</Button>
    <p className="text-xs text-muted-foreground text-center">Solo cuentas autorizadas por la clínica.</p>
  </div>
}
