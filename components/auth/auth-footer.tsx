"use client"
import { ShieldAlert, HelpCircle } from "lucide-react"
export function AuthFooter() {
  return <footer className="w-full space-y-1.5 border-t border-border pt-3 text-center text-xs text-muted-foreground">
    <div className="flex items-center justify-center gap-1.5 font-semibold text-foreground"><ShieldAlert className="h-3.5 w-3.5 text-amber-500"/>Uso exclusivo interno y confidencial</div>
    <p className="mx-auto max-w-sm text-[11px] leading-relaxed">Acceso restringido. Las acciones quedan registradas bajo auditoría.</p>
    <div className="flex items-center justify-center gap-2 text-[11px]"><span>Carmo Dental v1.0</span><span>·</span><a href="mailto:soporte@carmodental.com" className="flex items-center gap-1 hover:text-foreground"><HelpCircle className="h-3 w-3"/>Soporte TI</a></div>
  </footer>
}
