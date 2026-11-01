import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

// GET: Obtener todos los periodontogramas de un paciente
export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { searchParams }) => {
    const patientId = searchParams.get("patientId")
    if (!patientId) {
      throw new Error("Falta el ID del paciente") 
    }

    const records = await prisma.periodontogram.findMany({
      where: { patientId },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return records
  }
)

// POST: Crear un nuevo registro periodontal
export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: z.any(), // Permitimos cualquier estructura JSON en data
  },
  async (req, { user, data }) => {
    const { patientId, data: periodontogramData, authorId } = data

    if (!patientId || !periodontogramData) {
      throw new Error("Datos incompletos para el registro")
    }

    const currentUserId = authorId || user.id

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.periodontogram.create({
        data: {
          patientId,
          data: periodontogramData,
          authorId: currentUserId,
        },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      })

      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: "CREATE_PERIODONTOGRAM",
          entity: "PERIODONTOGRAM",
          entityId: created.id,
          patientId,
          details: "Registro inicial de evaluación periodontal (sondaje y margen)",
          newData: { data: created.data },
          ipAddress,
          userAgent,
        },
      })

      return created
    })

    return record // El api-handler envía status 200/201 automáticamente
  }
)

// PUT: Actualizar registro general
export const PUT = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: z.any(),
  },
  async (req, { user, data }) => {
    const { id, data: periodontogramData } = data

    if (!id || !periodontogramData) {
      throw new Error("Faltan parámetros requeridos (ID o datos)")
    }

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updated = await prisma.$transaction(async (tx) => {
      const previous = await tx.periodontogram.findUnique({
        where: { id },
      })
      if (!previous) throw new Error("NOT_FOUND")

      const res = await tx.periodontogram.update({
        where: { id },
        data: { data: periodontogramData },
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
          details: "Actualización de índices periodontales",
          oldData: { data: previous.data },
          newData: { data: res.data },
          ipAddress,
          userAgent,
        },
      })

      return res
    })

    return updated
  }
)

// DELETE: Eliminar usando searchParams (?id=...)
export const DELETE = createApiHandler(
  { roles: ["ADMIN"] }, 
  async (req, { user, searchParams }) => {
    const id = searchParams.get("id")
    if (!id) {
      throw new Error("ID de registro requerido")
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
          details: "Eliminación de registro periodontal histórico",
          oldData: { data: previous.data },
          ipAddress,
          userAgent,
        },
      })
    })

    return { success: true, message: "Evaluación periodontal eliminada correctamente" }
  }
)