import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { sanitizeRichHTML, escapeHTML } from "@/lib/sanitize"

// Este endpoint recibe el cuerpo directo (igual que el PUT original).
// Los campos no listados nunca se escriben en la base de datos.
const updateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().trim().min(1).max(100_000).optional(),
  specialistName: z.string().trim().max(200).nullish(),
  specialistIdDoc: z.string().trim().max(100).nullish(),
  doctorSignature: z.string().max(3_000_000).nullish(),
  patientSignature: z.string().max(3_000_000).nullish(),
}).passthrough()

function validPatientSignature(value: string): boolean {
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(value)
  if (!match) return false
  const encoded = match[2]
  if (encoded.length % 4 !== 0) return false
  const bytes = Buffer.from(encoded, "base64")
  if (bytes.length < 12 || bytes.length > 2_000_000) return false
  const mime = match[1].toLowerCase()
  if (mime === "png") {
    return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  }
  if (mime === "jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
}

async function requestMetadata() {
  const h = await headers()
  return {
    ipAddress: (h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "Desconocido").slice(0, 128),
    userAgent: (h.get("user-agent") || "Desconocido").slice(0, 512),
  }
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

const documentSelect = {
  id: true,
  patientId: true,
  treatmentPlanId: true,
  title: true,
  content: true,
  specialistName: true,
  specialistIdDoc: true,
  doctorSignature: true,
  patientSignature: true,
  isVoided: true,
  authorId: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
} as const

export const PUT = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"], schema: updateDocumentSchema },
  async (_req, { user, params, data }) => {
    const id = typeof params.id === "string" ? params.id.trim() : ""
    if (!id || id.length > 128) return errorResponse("ID de documento inválido", 400)

    // Parse explícito: evita los errores de TypeScript por 'unknown'.
    const input = updateDocumentSchema.parse(data)
    const hasDoctorSignature = Boolean(input.doctorSignature)
    const hasPatientSignature = Boolean(input.patientSignature)
    const hasTextChanges = input.title !== undefined || input.content !== undefined

    if (!hasDoctorSignature && !hasPatientSignature && !hasTextChanges) {
      return errorResponse("No hay cambios permitidos para actualizar", 400)
    }
    if (hasPatientSignature && !validPatientSignature(input.patientSignature!)) {
      return errorResponse("Firma del paciente inválida: use PNG, JPEG o WebP Base64", 400)
    }

    const cleanTitle = input.title === undefined ? undefined : escapeHTML(input.title)
    const cleanContent = input.content === undefined ? undefined : sanitizeRichHTML(input.content)
    if (cleanTitle !== undefined && !cleanTitle.trim()) return errorResponse("Título inválido", 400)
    if (cleanContent !== undefined && !cleanContent.trim()) return errorResponse("Contenido inválido", 400)

    const metadata = await requestMetadata()

    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.clinicalDocument.findUnique({
        where: { id },
        select: {
          id: true,
          patientId: true,
          authorId: true,
          title: true,
          isVoided: true,
          doctorSignature: true,
          patientSignature: true,
          patient: { select: { isDeleted: true } },
        },
      })
      if (!previous || previous.patient.isDeleted) return { kind: "not-found" as const }

      // ADMIN supervisa todos los documentos; DOCTOR solo edita los propios.
      if (user.role !== "ADMIN" && previous.authorId !== user.id) {
        return { kind: "forbidden" as const }
      }
      if (previous.isVoided) return { kind: "voided" as const }
      if (previous.doctorSignature || previous.patientSignature) {
        return { kind: "signed" as const }
      }

      let doctorSignature: string | undefined
      if (hasDoctorSignature) {
        const currentUser = await tx.user.findFirst({
          where: { id: user.id, isActive: true },
          select: { signatureBase64: true },
        })
        if (!currentUser?.signatureBase64 || input.doctorSignature !== currentUser.signatureBase64) {
          return { kind: "invalid-signature" as const }
        }
        doctorSignature = currentUser.signatureBase64
      }

      // Condiciones en la escritura: un documento firmado/anulado concurrentemente
      // no puede modificarse. No confiar solamente en la lectura anterior.
      const changed = await tx.clinicalDocument.updateMany({
        where: {
          id,
          isVoided: false,
          doctorSignature: null,
          patientSignature: null,
        },
        data: {
          ...(cleanTitle !== undefined ? { title: cleanTitle } : {}),
          ...(cleanContent !== undefined ? { content: cleanContent } : {}),
          ...(doctorSignature !== undefined ? { doctorSignature } : {}),
          ...(hasPatientSignature ? { patientSignature: input.patientSignature } : {}),
          // No permitir cambiar identidad del firmante usando specialistName,
          // specialistIdDoc o authorId suministrados por el navegador.
        },
      })
      if (changed.count !== 1) return { kind: "conflict" as const }

      const updated = await tx.clinicalDocument.findUniqueOrThrow({
        where: { id },
        select: documentSelect,
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_CLINICAL_DOCUMENT",
          entity: "CLINICAL_DOCUMENT",
          entityId: id,
          patientId: previous.patientId,
          details: "Actualización controlada de documento clínico",
          oldData: {
            hasDoctorSignature: false,
            hasPatientSignature: false,
          },
          newData: {
            changedFields: [
              ...(cleanTitle !== undefined ? ["title"] : []),
              ...(cleanContent !== undefined ? ["content"] : []),
              ...(doctorSignature !== undefined ? ["doctorSignature"] : []),
              ...(hasPatientSignature ? ["patientSignature"] : []),
            ],
            hasDoctorSignature: Boolean(updated.doctorSignature),
            hasPatientSignature: Boolean(updated.patientSignature),
          },
          ...metadata,
        },
      })
      return { kind: "ok" as const, document: updated }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    if (result.kind === "not-found") return errorResponse("Documento no encontrado", 404)
    if (result.kind === "forbidden") return errorResponse("No tiene permisos sobre este documento", 403)
    if (result.kind === "voided") return errorResponse("El documento está anulado", 409)
    if (result.kind === "signed") return errorResponse("El documento firmado es inmutable; cree una nueva versión", 409)
    if (result.kind === "invalid-signature") return errorResponse("La firma profesional no coincide con la firma guardada", 400)
    if (result.kind === "conflict") return errorResponse("El documento cambió durante la operación; vuelva a consultar", 409)
    return result.document
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (_req, { user, params }) => {
    const id = typeof params.id === "string" ? params.id.trim() : ""
    if (!id || id.length > 128) return errorResponse("ID de documento inválido", 400)
    const metadata = await requestMetadata()

    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.clinicalDocument.findUnique({
        where: { id },
        select: {
          id: true,
          patientId: true,
          authorId: true,
          isVoided: true,
          doctorSignature: true,
          patient: { select: { isDeleted: true } },
        },
      })
      if (!previous || previous.patient.isDeleted) return { kind: "not-found" as const }
      if (user.role !== "ADMIN" && previous.authorId !== user.id) {
        return { kind: "forbidden" as const }
      }
      if (previous.isVoided) return { kind: "voided" as const }

      // Anulación lógica: conservar documentos y firmas existentes como evidencia.
      const changed = await tx.clinicalDocument.updateMany({
        where: { id, isVoided: false },
        data: { isVoided: true },
      })
      if (changed.count !== 1) return { kind: "voided" as const }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "VOID_CLINICAL_DOCUMENT",
          entity: "CLINICAL_DOCUMENT",
          entityId: id,
          patientId: previous.patientId,
          details: "Anulación lógica de documento clínico",
          oldData: { isVoided: false, hasDoctorSignature: Boolean(previous.doctorSignature) },
          newData: { isVoided: true },
          ...metadata,
        },
      })
      return { kind: "ok" as const }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    if (result.kind === "not-found") return errorResponse("Documento no encontrado", 404)
    if (result.kind === "forbidden") return errorResponse("No tiene permisos para anular este documento", 403)
    if (result.kind === "voided") return errorResponse("Documento ya anulado", 409)
    return { success: true, message: "Documento clínico anulado y auditado con éxito" }
  }
)
