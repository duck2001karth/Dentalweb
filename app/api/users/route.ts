import { NextResponse } from "next/server"
import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { z } from "zod"
import { headers } from "next/headers"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { searchParams }) => {
    const rawRole = searchParams.get("role")
    if (rawRole && !Object.values(UserRole).includes(rawRole as UserRole)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
    }

    // Se conserva la estructura de respuesta utilizada por los selectores actuales.
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(rawRole ? { role: rawRole as UserRole } : {}),
      },
      select: {
        id: true, name: true, email: true, role: true,
        specialty: true, language: true, image: true,
      },
      orderBy: { name: "asc" },
    })
    return users
  }
)

export const PATCH = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
    schema: z.object({
      language: z.string().trim().min(2).max(20).optional(),
      calendarColor: z.string().trim().max(40).optional(),
      phoneNumber: z.string().trim().max(40).optional(),
    }).strip(),
  },
  async (_req, { user, data }) => {
    if (
      data.language === undefined &&
      data.calendarColor === undefined &&
      data.phoneNumber === undefined
    ) {
      return NextResponse.json({ error: "No se proporcionaron datos para actualizar." }, { status: 400 })
    }

    const updateData: Record<string, string> = {}
    if (data.language !== undefined) updateData.language = data.language
    if (data.calendarColor !== undefined) updateData.calendarColor = data.calendarColor
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim()
      || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = (headersList.get("user-agent") || "Desconocido").slice(0, 512)

    const updatedUser = await prisma.$transaction(async (tx) => {
      const previousUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { language: true, calendarColor: true, phoneNumber: true, name: true },
      })
      const res = await tx.user.update({
        where: { id: user.id }, data: updateData,
        select: {
          id: true, name: true, email: true,
          language: true, calendarColor: true, phoneNumber: true,
        },
      })
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_USER_PREFERENCES",
          entity: "USER_PREFERENCES",
          entityId: user.id,
          details: "Actualización de preferencias del usuario",
          oldData: previousUser || undefined,
          newData: {
            language: res.language,
            calendarColor: res.calendarColor,
            phoneNumber: res.phoneNumber,
          },
          ipAddress, userAgent,
        },
      })
      return res
    })

    return { success: true, message: "Preferencias guardadas exitosamente.", user: updatedUser }
  }
)
