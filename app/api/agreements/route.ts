import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

const createAgreementSchema = z.object({
  name: z.string().min(1, "El nombre del convenio es obligatorio"),
  institutionName: z.string().min(1, "El nombre de la institución es obligatorio"),
  contactPerson: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  discountType: z.string().default("PERCENTAGE"),
  discountValue: z.number().min(0, "El descuento no puede ser negativo"),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async () => {
    return await prisma.agreement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { treatmentPlans: true, patients: true },
        },
      },
    })
  }
)

export const POST = createApiHandler(
  {
    roles: ["ADMIN"],
    schema: createAgreementSchema,
  },
  async (req, { user, data }) => {
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const agreement = await prisma.$transaction(async (tx) => {
      const created = await tx.agreement.create({
        data: {
          name: data.name,
          institutionName: data.institutionName,
          contactPerson: data.contactPerson || null,
          contactPhone: data.contactPhone || null,
          contactEmail: data.contactEmail || null,
          discountType: data.discountType as any, 
          discountValue: data.discountValue,
          isActive: data.isActive,
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          endDate: data.endDate ? new Date(data.endDate) : null,
          notes: data.notes || "",
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_AGREEMENT",
          entity: "AGREEMENT",
          entityId: created.id,
          details: `Alta de convenio institucional: "${created.name}" (${created.institutionName})`,
          newData: {
            name: created.name,
            institutionName: created.institutionName,
            discountType: created.discountType,
            discountValue: created.discountValue,
            isActive: created.isActive,
          },
          ipAddress,
          userAgent
        }
      })
      
      return created
    })

    return agreement
  }
)