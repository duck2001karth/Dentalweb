import Link from "next/link"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"

const mobileAdminLinks = [
  { label: "Inicio", href: "/admin" },
  { label: "Convenios", href: "/admin/convenios" },
  { label: "Catálogo", href: "/admin/catalogo" },
  { label: "Usuarios", href: "/admin/usuarios" },
  { label: "Auditoría", href: "/admin/auditoria" },
  { label: "Respaldos", href: "/admin/respaldos" },
  { label: "Volver a clínica", href: "/" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dw-mobile-admin flex h-dvh min-w-0 overflow-hidden bg-background font-sans text-foreground transition-colors duration-200">
      <div className="hidden shrink-0 md:flex"><AdminSidebar /></div>
      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopbar />
        <nav aria-label="Secciones de administración" className="flex shrink-0 gap-2 overflow-x-auto overscroll-x-contain border-b border-border bg-card px-3 py-2 md:hidden">
          {mobileAdminLinks.map(({ label, href }) => (
            <Link key={href} href={href} className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              {label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 flex-1 overflow-y-auto bg-background p-3 custom-scrollbar sm:p-4 md:p-6">
          <div className="w-full min-w-0">{children}</div>
        </div>
      </main>
    </div>
  )
}
