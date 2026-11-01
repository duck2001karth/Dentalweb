import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

export const PUT = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: z.any(),
  },
  async (req, { user, params, data: reqData }) => {
    const id = params.id as string
    const { data } = reqData

    if (!id || !data) {
      throw new Error("Faltan parámetros requeridos para actualizar")
    }

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updatedRecord = await prisma.$transaction(async (tx) => {
      const previous = await tx.periodontogram.findUnique({
        where: { id },
      })
      if (!previous) throw new Error("NOT_FOUND")

      const record = await tx.periodontogram.update({
        where: { id },
        data: { data },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_PERIODONTOGRAM",
          entity: "PERIODONTOGRAM",
          entityId: id,
          patientId: previous.patientId,
          details: "Actualización de índices periodontales (sondaje, margen y sangrado)",
          oldData: { data: previous.data },
          newData: { data: record.data },
          ipAddress,
          userAgent,
        },
      })

      return record
    })

    return updatedRecord
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN"] }, 
  async (req, { user, params }) => {
    const id = params.id as string
    if (!id) {
      throw new Error("Identificador de registro no proporcionado")
    }

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const previous = await tx.periodontogram.findUnique({
        where: { id },
      })
      if (!previous) throw new Error("NOT_FOUND")

      await tx.periodontogram.delete({
        where: { id },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_PERIODONTOGRAM",
          entity: "PERIODONTOGRAM",
          entityId: id,
          patientId: previous.patientId,
          details: "Eliminación de registro periodontal del expediente clínico",
          oldData: {
            patientId: previous.patientId,
            data: previous.data,
            authorId: previous.authorId,
            createdAt: previous.createdAt,
          },
          ipAddress,
          userAgent,
        },
      })
    })

    return { success: true, message: "Evaluación eliminada y auditada correctamente" }
  }
)