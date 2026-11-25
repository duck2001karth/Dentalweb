"use client"
import { useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Stethoscope, ShieldCheck } from "lucide-react"
import { UserAuthForm } from "@/components/auth/user-auth"
import { AuthFooter } from "@/components/auth/auth-footer"

export default function AuthenticationPage() {
  const { status, data } = useSession()
  const router = useRouter()
  const authorized = data?.user?.isActive === true && ["ADMIN", "DOCTOR", "RECEPTIONIST"].includes(String(data?.user?.role))
  useEffect(() => { if (status === "authenticated" && authorized) router.replace("/") }, [status, authorized, router])
  if (status === "loading" || (status === "authenticated" && authorized)) return <div className="h-dvh grid place-items-center text-muted-foreground">Verificando sesión...</div>
  return (
    <main className="grid min-h-dvh w-full bg-background text-foreground lg:h-dvh lg:min-h-0 lg:grid-cols-2 lg:overflow-hidden">
      <aside className="relative flex min-h-28 flex-col justify-between overflow-hidden bg-cover bg-center p-5 text-white lg:h-full lg:min-h-0 lg:p-8" style={{ backgroundImage: "linear-gradient(135deg,rgba(8,30,48,.82),rgba(0,70,100,.35)),url(/dental.jpg)" }}>
        <div className="flex items-center gap-3 text-xl font-bold"><Stethoscope className="h-6 w-6"/>Carmo Dental</div>
        <div className="hidden max-w-lg lg:block"><h2 className="text-2xl font-bold xl:text-3xl">Gestión clínica segura</h2><p className="mt-2 text-sm text-slate-100">Atención odontológica, administración y continuidad del cuidado.</p></div>
      </aside>
      <section className="flex min-h-0 flex-col px-5 py-5 sm:px-8 lg:h-full lg:overflow-y-auto">
        <div className="mx-auto my-auto w-full max-w-[400px] space-y-4">
          <div className="space-y-1.5 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-sky-600 dark:text-sky-400"/><h1 className="text-2xl font-black">Acceso al sistema</h1><p className="text-sm text-muted-foreground">Ingresa con tu cuenta autorizada de Carmo Dental.</p></div>
          {status === "authenticated" ? <div className="space-y-3 rounded-xl border p-3 text-sm"><p>Tu sesión no tiene acceso autorizado.</p><button className="font-bold text-sky-600 dark:text-sky-400" onClick={() => void signOut({ callbackUrl: "/auth" })}>Cerrar sesión y cambiar de cuenta</button></div> : <UserAuthForm/>}
          <AuthFooter/>
        </div>
      </section>
    </main>
  )
}
