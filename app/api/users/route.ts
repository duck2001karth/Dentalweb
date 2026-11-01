import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { searchParams }) => {
    const role = searchParams.get("role")
    
    const whereClause: any = { isActive: true }
    if (role) whereClause.role = role

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true, name: true, email: true, role: true, 
        specialty: true, language: true, image: true
      },
      orderBy: { name: "asc" },
    })

    return users
  }
)

export const PATCH = createApiHandler(
  {
    schema: z.object({
      language: z.string().optional(),
      calendarColor: z.string().optional(),
      phoneNumber: z.string().optional(),
    }).passthrough(),
  },
  async (req, { user, data }) => {
    if (!data.language && data.calendarColor === undefined && data.phoneNumber === undefined) {
      throw new Error("No se proporcionaron datos para actualizar.")
    }

    const updateData: Record<string, any> = {}
    if (data.language !== undefined) updateData.language = data.language.trim()
    if (data.calendarColor !== undefined) updateData.calendarColor = data.calendarColor
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updatedUser = await prisma.$transaction(async (tx) => {
      const previousUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { language: true, calendarColor: true, phoneNumber: true, name: true },
      })

      const res = await tx.user.update({
        where: { id: user.id },
        data: updateData,
        select: { id: true, name: true, email: true, language: true, calendarColor: true, phoneNumber: true },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_USER_PREFERENCES",
          entity: "USER_PREFERENCES",
          entityId: user.id,
          details: `Actualización de preferencias de usuario (${res.name || user.id}). Idioma: ${res.language}`,
          oldData: previousUser || undefined,
          newData: { language: res.language, calendarColor: res.calendarColor, phoneNumber: res.phoneNumber },
          ipAddress,
          userAgent,
        },
      })

      return res
    })

    return { success: true, message: "Preferencias guardadas exitosamente.", user: updatedUser }
  }
)