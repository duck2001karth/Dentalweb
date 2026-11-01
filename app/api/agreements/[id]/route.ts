import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

const updateAgreementSchema = z.object({
  name: z.string().min(1).optional(),
  institutionName: z.string().min(1).optional(),
  contactPerson: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  discountType: z.string().optional(),
  discountValue: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().nullable().optional(),
})

export const PATCH = createApiHandler(
  {
    roles: ["ADMIN"],
    schema: updateAgreementSchema,
  },
  async (req, { user, params, data }) => {
    const id = params.id as string

    // Obtenemos cabeceras para la auditoría inmutable
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updated = await prisma.$transaction(async (tx) => {
      const previous = await tx.agreement.findUnique({ where: { id } })
      if (!previous) throw new Error("NOT_FOUND")

      const res = await tx.agreement.update({
        where: { id },
        data: {
          ...data,
          ...(data.discountType !== undefined && { discountType: data.discountType as any })
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_AGREEMENT",
          entity: "AGREEMENT",
          entityId: id,
          details: `Convenio modificado: "${res.name}" (${res.institutionName})`,
          oldData: {
            name: previous.name,
            institutionName: previous.institutionName,
            discountType: previous.discountType,
            discountValue: Number(previous.discountValue),
            isActive: previous.isActive,
          },
          newData: {
            name: res.name,
            institutionName: res.institutionName,
            discountType: res.discountType,
            discountValue: Number(res.discountValue),
            isActive: res.isActive,
          },
          ipAddress,
          userAgent
        }
      })

      return res
    })

    return updated
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN"] },
  async (req, { user, params }) => {
    const id = params.id as string

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const agreement = await tx.agreement.findUnique({ where: { id } })
      if (!agreement) throw new Error("NOT_FOUND")

      await tx.treatmentPlan.updateMany({
        where: { agreementId: id },
        data: { agreementId: null },
      })
      
      await tx.agreement.delete({ where: { id } })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_AGREEMENT",
          entity: "AGREEMENT",
          entityId: id,
          details: `Se eliminó el convenio institucional: "${agreement.name}" (${agreement.institutionName})`,
          oldData: {
            name: agreement.name,
            institutionName: agreement.institutionName,
            discountType: agreement.discountType,
            discountValue: Number(agreement.discountValue),
            isActive: agreement.isActive,
            createdAt: agreement.createdAt,
          },
          ipAddress,
          userAgent
        }
      })
    })

    return { success: true, message: "Convenio eliminado y auditado correctamente" }
  }
)