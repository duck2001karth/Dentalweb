"use client"
import { useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Stethoscope, ShieldCheck } from "lucide-react"
import { UserAuthForm } from "@/components/auth/user-auth"
import { AuthFooter } from "@/components/auth/auth-footer"
export default function AuthenticationPage() {
  const { status, data } = useSession(); const router = useRouter()
  useEffect(()=>{ if(status==="authenticated" && data?.user?.isActive===true) router.replace("/") },[status,data?.user?.isActive,router])
  if(status==="loading") return <div className="min-h-screen grid place-items-center text-muted-foreground">Verificando sesión...</div>
  return <main className="min-h-dvh grid lg:grid-cols-2 bg-background text-foreground">
    <aside className="relative min-h-40 lg:min-h-screen bg-cover bg-center flex flex-col justify-between p-7 lg:p-12 text-white" style={{backgroundImage:"linear-gradient(135deg,rgba(8,30,48,.82),rgba(0,70,100,.35)),url(/dental.jpg)"}}><div className="flex items-center gap-3 text-2xl font-bold"><Stethoscope/>Carmo Dental</div><div className="hidden lg:block max-w-lg"><h2 className="text-4xl font-bold">Gestión clínica segura</h2><p className="mt-3 text-slate-100">Atención odontológica, administración y continuidad del cuidado.</p></div></aside>
    <section className="flex items-center justify-center p-6 sm:p-12"><div className="w-full max-w-md space-y-7"><div className="space-y-2 text-center"><ShieldCheck className="mx-auto w-10 h-10 text-sky-600 dark:text-sky-400"/><h1 className="text-3xl font-black">Acceso al sistema</h1><p className="text-sm text-muted-foreground">Ingresa con tu cuenta autorizada de Carmo Dental.</p></div>{status==="authenticated" && data?.user?.isActive!==true ? <div className="rounded-xl border p-4 text-sm space-y-3"><p>Tu sesión no tiene acceso autorizado.</p><button className="font-bold text-sky-600 dark:text-sky-400" onClick={()=>void signOut({callbackUrl:"/auth"})}>Cerrar sesión y cambiar de cuenta</button></div> : <UserAuthForm/>}<AuthFooter/></div></section>
  </main>
}
