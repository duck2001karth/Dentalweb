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
    const data = reqData.input || reqData
    const { medications, indications, observations, doctorSignature } = data

    if (!id) throw new Error("Falta el ID de la receta")

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updated = await prisma.$transaction(async (tx) => {
      const previous = await tx.prescription.findUnique({
        where: { id },
      })
      if (!previous) throw new Error("NOT_FOUND")

      const isAdmin = user.role === "ADMIN" 
      const isAuthor = previous.authorId === user.id

      if (!isAdmin && !isAuthor) {
        throw new Error("UNAUTHORIZED_ROLE") 
      }

      const res = await tx.prescription.update({
        where: { id },
        data: {
          ...(medications !== undefined && { medications }),
          ...(indications !== undefined && { indications }),
          observations: observations !== undefined ? observations : previous.observations,
          ...(doctorSignature !== undefined && { doctorSignature }),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              specialty: true,
              signatureBase64: true,
              professionalCard: true,
            },
          },
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_PRESCRIPTION",
          entity: "PRESCRIPTION",
          entityId: id,
          patientId: previous.patientId,
          details: "Modificación de fármacos o posología en receta médica",
          oldData: {
            medications: previous.medications,
            indications: previous.indications,
            observations: previous.observations,
            hasDoctorSignature: Boolean(previous.doctorSignature),
          },
          newData: {
            medications: res.medications,
            indications: res.indications,
            observations: res.observations,
            hasDoctorSignature: Boolean(res.doctorSignature),
          },
          ipAddress,
          userAgent,
        },
      })

      return res
    })

    const authorLicense = updated.author?.professionalCard || ""

    return {
      ...updated,
      doctorSignature: updated.doctorSignature || updated.author?.signatureBase64 || null,
      doctorLicense: authorLicense,
    }
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (req, { user, params }) => {
    const id = params.id as string
    if (!id) throw new Error("Falta el ID de la receta")

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const previous = await tx.prescription.findUnique({
        where: { id },
      })
      if (!previous) throw new Error("NOT_FOUND")

      const isAdmin = user.role === "ADMIN"
      const isAuthor = previous.authorId === user.id

      if (!isAdmin && !isAuthor) {
        throw new Error("UNAUTHORIZED_ROLE")
      }

      await tx.prescription.delete({
        where: { id },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_PRESCRIPTION",
          entity: "PRESCRIPTION",
          entityId: id,
          patientId: previous.patientId,
          details: "Eliminación de receta médica del expediente",
          oldData: {
            medications: previous.medications,
            indications: previous.indications,
            observations: previous.observations,
            authorId: previous.authorId,
            createdAt: previous.createdAt,
          },
          ipAddress,
          userAgent,
        },
      })
    })

    return { success: true, message: "Receta eliminada y auditada correctamente" }
  }
)