import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

const createRecordSchema = z.object({
  patientId: z.string().min(1, "Falta el ID del paciente"),
  planId: z.string().optional().nullable(),
  toothNumber: z.union([z.string(), z.number()]),
  surfaces: z.union([z.string(), z.array(z.string())]),
  status: z.string().min(1, "El estado es requerido"),
  isEvolution: z.boolean().optional(),
  authorId: z.string().optional(),
  notes: z.string().optional().nullable(),
  comments: z.string().optional().nullable(),
})

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { searchParams }) => {
    const patientId = searchParams.get("patientId")
    if (!patientId) throw new Error("Falta el ID del paciente")

    const records = await prisma.odontogramRecord.findMany({
      where: { patientId },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return records
  }
)

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: createRecordSchema,
  },
  async (req, { user, data }) => {
    const currentAuthorId = data.authorId || user.id
    const toothNum = Number(data.toothNumber)
    const normalizedSurfaces = Array.isArray(data.surfaces) ? data.surfaces : [data.surfaces]

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.odontogramRecord.create({
        data: {
          patientId: data.patientId,
          planId: data.planId || null,
          toothNumber: toothNum,
          surfaces: normalizedSurfaces,
          status: data.status,
          notes: data.notes || data.comments || null,
          isEvolution: data.isEvolution || false,
          authorId: currentAuthorId,
        },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      })

      await tx.auditLog.create({
        data: {
          userId: currentAuthorId,
          action: "CREATE_ODONTOGRAM_RECORD",
          entity: "ODONTOGRAM",
          entityId: created.id,
          patientId: data.patientId,
          details: `Registro de hallazgo clínico (${created.status}) en pieza #${created.toothNumber}`,
          newData: {
            toothNumber: created.toothNumber,
            surfaces: created.surfaces,
            status: created.status,
            notes: created.notes,
            isEvolution: created.isEvolution,
          },
          ipAddress,
          userAgent,
        },
      })

      return created
    })

    return record
  }
)

export const PATCH = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: z.object({
      id: z.string().min(1, "Falta el ID del registro"),
      notes: z.string().optional().nullable(),
    }),
  },
  async (req, { user, data }) => {
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updatedRecord = await prisma.$transaction(async (tx) => {
      const previous = await tx.odontogramRecord.findUnique({ where: { id: data.id } })
      if (!previous) throw new Error("NOT_FOUND")

      const updated = await tx.odontogramRecord.update({
        where: { id: data.id },
        data: { notes: data.notes !== undefined ? data.notes : null },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_ODONTOGRAM_RECORD",
          entity: "ODONTOGRAM",
          entityId: data.id,
          patientId: previous.patientId,
          details: `Actualización de observación en pieza #${previous.toothNumber}`,
          oldData: { notes: previous.notes },
          newData: { notes: updated.notes },
          ipAddress,
          userAgent,
        },
      })

      return updated
    })

    return { success: true, record: updatedRecord }
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (req, { user, searchParams }) => {
    const id = searchParams.get("id")
    const patientId = searchParams.get("patientId")
    const toothNumber = searchParams.get("toothNumber")

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    // 1. Caso: Eliminación de un registro puntual vía ?id=...
    if (id) {
      await prisma.$transaction(async (tx) => {
        const previous = await tx.odontogramRecord.findUnique({ where: { id } })
        if (!previous) throw new Error("NOT_FOUND")

        await tx.odontogramRecord.delete({ where: { id } })

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "DELETE_ODONTOGRAM_RECORD",
            entity: "ODONTOGRAM",
            entityId: id,
            patientId: previous.patientId,
            details: `Eliminación de hallazgo clínico en pieza #${previous.toothNumber}`,
            oldData: {
              toothNumber: previous.toothNumber,
              surfaces: previous.surfaces,
              status: previous.status,
              notes: previous.notes,
            },
            ipAddress,
            userAgent,
          },
        })
      })

      return { success: true, message: "Registro anulado" }
    }

    // 2. Caso: Saneamiento completo de una pieza vía ?patientId=...&toothNumber=...
    if (patientId && toothNumber) {
      const toothNumInt = parseInt(toothNumber, 10)

      await prisma.$transaction(async (tx) => {
        const recordsToDelete = await tx.odontogramRecord.findMany({
          where: { patientId, toothNumber: toothNumInt },
        })

        await tx.odontogramRecord.deleteMany({
          where: { patientId, toothNumber: toothNumInt },
        })

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "CLEAR_ODONTOGRAM_TOOTH",
            entity: "ODONTOGRAM",
            entityId: `TOOTH-${toothNumInt}`,
            patientId,
            details: `Saneamiento completo de la pieza #${toothNumInt} (${recordsToDelete.length} registros eliminados)`,
            oldData: recordsToDelete.map((r) => ({ id: r.id, status: r.status, surfaces: r.surfaces })),
            ipAddress,
            userAgent,
          },
        })
      })

      return { success: true, message: "Pieza saneada" }
    }

    throw new Error("Faltan parámetros de eliminación")
  }
)