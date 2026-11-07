import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

const isPath = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`)

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname
    const isApiRoute = isPath(pathname, "/api")
    if (!token || token.isActive !== true) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "Sesión inválida o cuenta deshabilitada." },
          { status: 401 }
        )
      }

      const url = new URL("/auth", req.url)
      if (token?.isActive === false) {
        url.searchParams.set("error", "AccountDisabled")
      }
      return NextResponse.redirect(url)
    }

    const role = String(token.role || "").toUpperCase().trim()
    if (!["ADMIN", "DOCTOR", "RECEPTIONIST"].includes(role)) {
      return isApiRoute
        ? NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
        : NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    if (isPath(pathname, "/api/admin")) {
      const isCatalogGet = isPath(pathname, "/api/admin/catalog") && req.method === "GET"
      const isSearchGet = isPath(pathname, "/api/admin/search") && req.method === "GET"
      if (!isCatalogGet && !isSearchGet && role !== "ADMIN") {
        return NextResponse.json(
          { error: "Acceso denegado. Se requiere rol de Administrador." },
          { status: 403 }
        )
      }
    }

    if (["/admin", "/ajustes", "/convenios"].some((p) => isPath(pathname, p))) {
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    const strictMedicalRoutes = [
      "/historia-clinica", "/odontograma", "/evoluciones",
      "/tratamientos", "/tratamiento", "/plans-treatment", "/laboratorio",
    ]
    if (strictMedicalRoutes.some((p) => isPath(pathname, p))) {
      if (role !== "ADMIN" && role !== "DOCTOR") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    const generalOperationalRoutes = [
      "/pacientes", "/paciente", "/agenda", "/agenda-global",
      "/dashboard", "/cajas", "/inventario", "/comprobantes",
    ]
    if (generalOperationalRoutes.some((p) => isPath(pathname, p))) {
      if (!["ADMIN", "DOCTOR", "RECEPTIONIST"].includes(role)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: { authorized: () => true },
    pages: { signIn: "/auth" },
  }
)

export const config = {
  matcher: [
    "/admin/:path*", "/ajustes/:path*", "/convenios/:path*",
    "/dashboard/:path*", "/pacientes/:path*", "/paciente/:path*",
    "/agenda/:path*", "/agenda-global/:path*", "/cajas/:path*",
    "/inventario/:path*", "/laboratorio/:path*",
    "/historia-clinica/:path*", "/odontograma/:path*",
    "/evoluciones/:path*", "/tratamientos/:path*",
    "/tratamiento/:path*", "/plans-treatment/:path*",
    "/comprobantes/:path*", "/api/((?!auth).*)",
  ],
}
