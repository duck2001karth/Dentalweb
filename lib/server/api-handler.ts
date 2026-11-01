import { NextRequest, NextResponse } from "next/server"
import { UserRole } from "@prisma/client"
import { getSessionUser } from "@/lib/server/get-session-user"
import { logAuditEvent } from "@/lib/audit"
import { z, ZodSchema } from "zod"

type Role = keyof typeof UserRole // "ADMIN" | "DOCTOR" | "RECEPTIONIST"

interface HandlerContext<T> {
  user: Awaited<ReturnType<typeof getSessionUser>>
  data: T
  params: Record<string, any>
  searchParams: URLSearchParams
  audit: (params: Omit<Parameters<typeof logAuditEvent>[0], "userId">) => Promise<void>
}

interface HandlerOptions<T> {
  roles?: Role[]
  schema?: ZodSchema<T>
}

export function createApiHandler<T = any>(
  options: HandlerOptions<T>,
  handler: (req: NextRequest, context: HandlerContext<T>) => Promise<NextResponse | any>
) {
  return async (req: NextRequest, routeContext?: { params?: Promise<any> | any }) => {
    try {
      const user = await getSessionUser()

      if (options.roles && options.roles.length > 0 && !options.roles.includes(user.role as Role)) {
        await logAuditEvent({
          userId: user.id,
          action: "UNAUTHORIZED_ACCESS_ATTEMPT",
          entity: "API_ROUTE",
          entityId: req.nextUrl.pathname,
          details: `Rol ${user.role} intentó acceder a una ruta restringida para [${options.roles.join(", ")}].`,
        })

        return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
      }

      let data: any = undefined
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        let body: any = null
        try {
          body = await req.json()
        } catch {
          return NextResponse.json(
            { error: "Cuerpo de solicitud (JSON) inválido o vacío." },
            { status: 400 }
          )
        }

        if (options.schema) {
          data = options.schema.parse(body)
        } else {
          data = body
        }
      }

      const params = routeContext?.params ? await routeContext.params : {}
      const searchParams = req.nextUrl.searchParams

      const auditHelper = async (auditParams: Omit<Parameters<typeof logAuditEvent>[0], "userId">) => {
        await logAuditEvent({
          userId: user.id,
          ...auditParams,
        })
      }

      const result = await handler(req, {
        user,
        data,
        params,
        searchParams,
        audit: auditHelper,
      })

      return result instanceof NextResponse ? result : NextResponse.json(result)

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Datos de entrada inválidos", details: error.flatten() },
          { status: 422 }
        )
      }

      if (
        error.message === "No se encontró una sesión activa" ||
        error.message === "Usuario no encontrado en la base de datos"
      ) {
        return NextResponse.json({ error: "Sesión inválida o no autenticada" }, { status: 401 })
      }

      if (error.message === "NOT_FOUND" || error.message === "DOCUMENT_NOT_FOUND") {
        return NextResponse.json({ error: "Recurso no encontrado" }, { status: 404 })
      }

      console.error(`[API Error] ${req.nextUrl.pathname}:`, error)
      return NextResponse.json(
        { error: error?.message || "Error interno del servidor" },
        { status: 500 }
      )
    }
  }
}