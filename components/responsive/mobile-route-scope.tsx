"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"


const SCOPES = ["dw-mobile-billing", "dw-mobile-inventory", "dw-mobile-admin-route", "dw-mobile-admin-users", "dw-mobile-admin-catalog"] as const

export function MobileRouteScope() {
  const pathname = usePathname()

  useEffect(() => {
    const body = document.body
    body.classList.remove(...SCOPES)
    if (pathname === "/cajas" || pathname.startsWith("/cajas/")) {
      body.classList.add("dw-mobile-billing")
    } else if (pathname === "/inventario" || pathname.startsWith("/inventario/")) {
      body.classList.add("dw-mobile-inventory")
    } else if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      body.classList.add("dw-mobile-admin-route")
      if (pathname === "/admin/usuarios" || pathname.startsWith("/admin/usuarios/")) body.classList.add("dw-mobile-admin-users")
      if (pathname === "/admin/catalogo" || pathname.startsWith("/admin/catalogo/")) body.classList.add("dw-mobile-admin-catalog")
    }
    return () => body.classList.remove(...SCOPES)
  }, [pathname])

  return null
}
