import Link from "next/link"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Acceso Denegado | Carmo Dental",
  description: "No tienes permisos para ver esta página.",
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden text-center">
        <div className="bg-red-50 dark:bg-red-950/30 p-8 flex justify-center border-b border-slate-100 dark:border-slate-800">
          <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-full shadow-sm">
            <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-500" />
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Acceso Denegado
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-sm">
              Tu rol actual no tiene los privilegios necesarios para acceder a esta área del sistema administrativo.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-400">
            Si crees que esto es un error o necesitas acceso, por favor contacta al <span className="font-bold text-slate-800 dark:text-slate-200">Administrador Global</span>.
          </div>
          <div className="pt-4">
            <Button asChild className="w-full h-12 rounded-xl font-bold bg-[#005c8a] hover:bg-[#004a70] text-white transition-all shadow-md">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard Principal
              </Link>
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}