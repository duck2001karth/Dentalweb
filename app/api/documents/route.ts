import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

// Los adjuntos del proyecto pueden estar almacenados como data:URL/Base64
// o como referencias HTTPS. No aceptar javascript:, file:, blob: ni SVG/HTML.
// 4 millones de caracteres es un limite conservador para evitar cuerpos enormes.
const MAX_FILE_REFERENCE_LENGTH = 4_000_000

const allowedDataMimes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

function isAllowedDocumentLocation(value: string): boolean {
  if (!value || value.length > MAX_FILE_REFERENCE_LENGTH) return false

  if (value.startsWith("https://")) {
    try {
      const url = new URL(value)
      return url.protocol === "https:" && Boolean(url.hostname) &&
        !url.username && !url.password
    } catch {
      return false
    }
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    // Paths relativos del mismo sitio, sin barras invertidas ni controles.
    return !/[\\\x00-\x1f]/.test(value)
  }

  const dataMatch = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(value)
  if (dataMatch) {
    return allowedDataMimes.has(dataMatch[1].toLowerCase()) &&
      dataMatch[2].length % 4 === 0
  }

  // Compatibilidad con documentos existentes que se envian como Base64 puro.
  // El contenido no se interpreta como HTML ejecutable en esta ruta.
  return value.length % 4 === 0 &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(value)
}

const createDocumentSchema = z.object({
  patientId: z.string().trim().min(1).max(128),
  name: z.string().trim().min(1).max(200),
  type: z.string().trim().max(100).optional().default("Desconocido"),
  size: z.string().trim().max(40).optional().default("0 KB"),
  url: z.string().min(1).max(MAX_FILE_REFERENCE_LENGTH)
    .refine(isAllowedDocumentLocation, "Referencia de documento no permitida"),
  // authorId enviado por navegadores antiguos se descarta con el comportamiento
  // por defecto de z.object; la autoria SIEMPRE deriva de la sesion.
})

async function requestMetadata() {
  const h = await headers()
  return {
    ipAddress: (
      h.get("x-forwarded-for")?.split(",")[0].trim() ||
      h.get("x-real-ip") || "Desconocido"
    ).slice(0, 128),
    userAgent: (h.get("user-agent") || "Desconocido").slice(0, 512),
  }
}

// Mantener el mismo formato de salida (arreglo de documentos) usado por la UI.
// No devolver la firma Base64 del profesional en la relacion author.
const documentSelect = {
  id: true,
  patientId: true,
  name: true,
  type: true,
  size: true,
  url: true,
  authorId: true,
  createdAt: true,
  author: {
    select: {
      id: true,
      name: true,
      specialty: true,
      professionalCard: true,
    },
  },
} as const

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { searchParams }) => {
    const patientId = searchParams.get("patientId")?.trim() || ""
    if (!patientId || patientId.length > 128) {
      return NextResponse.json(
        { error: "ID del paciente invalido" },
        { status: 400 }
      )
    }

    const docs = await prisma.patientDocument.findMany({
      where: {
        patientId,
        patient: { is: { isDeleted: false } },
      },
      select: documentSelect,
      orderBy: { createdAt: "desc" },
    })

    return docs
  }
)

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
    schema: createDocumentSchema,
  },
  async (_req, { user, data }) => {
    // Parse explicito: compatible con el tipo generico de createApiHandler.
    const input = createDocumentSchema.parse(data)
    const metadata = await requestMetadata()

    const result = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findFirst({
        where: { id: input.patientId, isDeleted: false },
        select: { id: true },
      })
      if (!patient) return null

      const created = await tx.patientDocument.create({
        data: {
          patientId: patient.id,
          name: input.name,
          type: input.type,
          size: input.size,
          url: input.url,
          authorId: user.id,
        },
        select: documentSelect,
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_PATIENT_DOCUMENT",
          entity: "PATIENT_DOCUMENT",
          entityId: created.id,
          patientId: patient.id,
          details: "Adjunto de documento al expediente",
          newData: {
            type: created.type,
            hasUrl: true,
          },
          ...metadata,
        },
      })

      return created
    })

    if (!result) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      )
    }

    return result
  }
)
