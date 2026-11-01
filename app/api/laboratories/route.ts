import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

// Esquemas de validación
const createLabSchema = z.object({
  name: z.string().min(1, "El nombre del laboratorio es requerido"),
  details: z.string().optional().nullable(),
  balance: z.union([z.string(), z.number()]).optional().default(0),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

const updateLabSchema = createLabSchema.partial().extend({
  id: z.string().min(1, "El ID del laboratorio es obligatorio"),
})

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async () => {
    return await prisma.laboratory.findMany({
      orderBy: { name: "asc" },
    })
  }
)

export const POST = createApiHandler(
  {
    roles: ["ADMIN"],
    schema: createLabSchema,
  },
  async (req, { user, data }) => {
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const newLab = await prisma.$transaction(async (tx) => {
      const created = await tx.laboratory.create({
        data: {
          name: data.name,
          details: data.details || null,
          balance: Number(data.balance) || 0,
          contactPerson: data.contactPerson || null,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          notes: data.notes || null,
          isActive: data.isActive,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_LABORATORY",
          entity: "LABORATORY",
          entityId: created.id,
          details: `Creación de laboratorio externo: "${created.name}"`,
          newData: created,
          ipAddress,
          userAgent,
        },
      })

      return created
    })

    return newLab
  }
)

export const PATCH = createApiHandler(
  {
    roles: ["ADMIN"],
    schema: updateLabSchema,
  },
  async (req, { user, data }) => {
    // 1. Extraemos 'balance' aquí para que no contamine 'updateData'
    const { id, balance, ...updateData } = data

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updatedLab = await prisma.$transaction(async (tx) => {
      const previousLab = await tx.laboratory.findUnique({ where: { id } })
      if (!previousLab) throw new Error("NOT_FOUND")

      const updated = await tx.laboratory.update({
        where: { id },
        data: {
          ...updateData,
          ...(balance !== undefined && { balance: Number(balance) }),
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_LABORATORY",
          entity: "LABORATORY",
          entityId: id,
          details: `Actualización de laboratorio: "${updated.name}"`,
          oldData: previousLab,
          newData: updated,
          ipAddress,
          userAgent,
        },
      })

      return updated
    })

    return updatedLab
  }
)