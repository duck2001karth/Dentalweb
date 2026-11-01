import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

// Esquema de validación para la subida de documentos
const createDocumentSchema = z.object({
  patientId: z.string().min(1, "El ID del paciente es obligatorio"),
  name: z.string().min(1, "El nombre del documento es obligatorio"),
  type: z.string().optional().default("Desconocido"),
  size: z.string().optional().default("0 KB"),
  url: z.string().min(1, "La URL del archivo es obligatoria"),
  authorId: z.string().optional(),
})


export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { searchParams }) => {
    const patientId = searchParams.get("patientId")
    
    if (!patientId) {
      throw new Error("Falta el ID del paciente") 
    }

    const docs = await prisma.patientDocument.findMany({
      where: { patientId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            specialty: true,
            professionalCard: true,
            signatureBase64: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return docs
  }
)
export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: createDocumentSchema,
  },
  async (req, { user, data }) => {
    const currentAuthorId = data.authorId || user.id

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.patientDocument.create({
        data: {
          patientId: data.patientId,
          name: data.name,
          type: data.type,
          size: data.size,
          url: data.url,
          authorId: currentAuthorId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              specialty: true,
              professionalCard: true,
              signatureBase64: true,
            },
          },
        },
      })
      await tx.auditLog.create({
        data: {
          userId: currentAuthorId,
          action: "CREATE_PATIENT_DOCUMENT",
          entity: "PATIENT_DOCUMENT",
          entityId: created.id,
          patientId: data.patientId,
          details: `Subida de documento/archivo: "${created.name}"`,
          newData: {
            name: created.name,
            type: created.type,
            size: created.size,
            hasUrl: Boolean(created.url),
          },
          ipAddress,
          userAgent,
        },
      })

      return created
    })

    return doc 
  }
)