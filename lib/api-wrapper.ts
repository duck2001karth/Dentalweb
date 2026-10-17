import { NextResponse } from "next/server"
import { User } from "@prisma/client"
import { getSessionUser } from "@/lib/server/get-session-user"
import { logAuditEvent } from "@/lib/audit"

type Role = "ADMIN" | "DOCTOR" | "RECEPTIONIST" | "PATIENT"

export interface ProtectedRouteContext {
  params: Record<string, string | string[]>
  user: User
  audit: (params: Omit<Parameters<typeof logAuditEvent>[0], "userId">) => Promise<void>
}

export function withProtection(
  allowedRoles: Role[],
  handler: (req: Request, ctx: ProtectedRouteContext) => Promise<NextResponse>
) {
  return async (req: Request, context: { params: Record<string, string | string[]> }) => {
    try {
      const user = await getSessionUser()

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role as Role)) {
        await logAuditEvent({
          userId: user.id,
          action: "UNAUTHORIZED_ACCESS_ATTEMPT",
          entity: "API_ROUTE",
          entityId: req.url,
          details: `El usuario con rol ${user.role} intentó acceder a una ruta restringida para ${allowedRoles.join(", ")}.`,
        })

        return NextResponse.json(
          { error: "No tienes permisos suficientes para realizar esta acción." },
          { status: 403 }
        )
      }

      const auditHelper = async (auditParams: Omit<Parameters<typeof logAuditEvent>[0], "userId">) => {
        await logAuditEvent({
          userId: user.id,
          ...auditParams,
        })
      }

      return await handler(req, { ...context, user, audit: auditHelper })
    } catch (error: any) {
      if (error.message === "No se encontró una sesión activa" || error.message === "Usuario no encontrado en la base de datos") {
        return NextResponse.json({ error: "Sesión inválida o expirada." }, { status: 401 })
      }

      console.error("[API_WRAPPER_ERROR]", error)
      return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
    }
  }
}