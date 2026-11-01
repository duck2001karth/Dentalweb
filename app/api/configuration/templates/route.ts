import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

const createTemplateSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  type: z.string().optional().default("CONSENT"), // O "RECIPE", "EVOLUTION", etc.
  category: z.string().optional().default("General"),
  content: z.string().min(1, "El contenido de la plantilla es obligatorio"),
  requiresPatientSignature: z.boolean().optional(),
  requiresDoctorSignature: z.boolean().optional(),
  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
})

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { searchParams }) => {
    const type = searchParams.get("type")
    const onlyActive = searchParams.get("onlyActive") === "true"

    const whereClause: any = {}
    if (type && type !== "ALL") whereClause.type = type
    if (onlyActive) whereClause.isActive = true

    const templates = await prisma.documentTemplate.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, specialty: true },
        },
      },
      orderBy: [{ isDefault: "desc" }, { title: "asc" }],
    })

    return templates
  }
)

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: createTemplateSchema,
  },
  async (req, { user, data }) => {
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const newTemplate = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.documentTemplate.updateMany({
          where: { type: data.type as any },
          data: { isDefault: false },
        })
      }

      const created = await tx.documentTemplate.create({
        data: {
          title: data.title.trim(),
          type: data.type as any, 
          category: data.category.trim(),
          content: data.content.trim(), 
          requiresPatientSignature: Boolean(data.requiresPatientSignature),
          requiresDoctorSignature: Boolean(data.requiresDoctorSignature),
          isActive: data.isActive,
          isDefault: data.isDefault,
          createdById: user.id,
        },
        include: {
          createdBy: { select: { id: true, name: true, specialty: true } },
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_TEMPLATE",
          entity: "DOCUMENT_TEMPLATE",
          entityId: created.id,
          details: `Creación de plantilla clínica: "${created.title}" [${created.type}]`,
          newData: {
            title: created.title,
            type: created.type,
            category: created.category,
          },
          ipAddress,
          userAgent,
        },
      })

      return created
    })

    return newTemplate 
  }
)