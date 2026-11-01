import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

const updateTemplateSchema = z.object({
  title: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  content: z.string().optional(),
  requiresPatientSignature: z.boolean().optional(),
  requiresDoctorSignature: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
})

export const PATCH = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: updateTemplateSchema,
  },
  async (req, { user, params, data }) => {
    const id = params.id as string

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.documentTemplate.findUnique({ where: { id } })
      if (!existing) throw new Error("NOT_FOUND")

      if (data.isDefault) {
      await tx.documentTemplate.updateMany({
        where: { type: (data.type || existing.type) as any, id: { not: id } }, 
        data: { isDefault: false },
      })
    }

      const res = await tx.documentTemplate.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title.trim() }),
          ...(data.type !== undefined && { type: data.type as any }),
          ...(data.category !== undefined && { category: data.category.trim() }),
          ...(data.content !== undefined && { content: data.content.trim() }),
          ...(data.requiresPatientSignature !== undefined && { requiresPatientSignature: data.requiresPatientSignature }),
          ...(data.requiresDoctorSignature !== undefined && { requiresDoctorSignature: data.requiresDoctorSignature }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_TEMPLATE",
          entity: "DOCUMENT_TEMPLATE",
          entityId: id,
          details: `Actualización de plantilla clínica: "${res.title}"`,
          oldData: { title: existing.title, isActive: existing.isActive },
          newData: { title: res.title, isActive: res.isActive },
          ipAddress,
          userAgent,
        },
      })

      return res
    })

    return updated
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (req, { user, params }) => {
    const id = params.id as string

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const existing = await tx.documentTemplate.findUnique({ where: { id } })
      if (!existing) throw new Error("NOT_FOUND")

      await tx.documentTemplate.delete({ where: { id } })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_TEMPLATE",
          entity: "DOCUMENT_TEMPLATE",
          entityId: id,
          details: `Eliminación de plantilla clínica: "${existing.title}"`,
          oldData: { title: existing.title, type: existing.type },
          ipAddress,
          userAgent,
        },
      })
    })

    return { success: true, message: "Plantilla eliminada y auditada correctamente" }
  }
)