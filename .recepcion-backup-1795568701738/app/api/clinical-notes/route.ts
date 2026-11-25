import { NoteType, Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"

const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024
const MAX_SIGNATURE_BYTES = 1024 * 1024
const DOCUMENT_MIME_TYPES = new Set([
  "image/png", "image/jpeg", "image/webp", "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
])

function validDataUrl(value: unknown, allowed: Set<string>, maxBytes: number): boolean {
  if (typeof value !== "string") return false
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match || !allowed.has(match[1])) return false
  const encoded = match[2]
  if (encoded.length > Math.ceil(maxBytes / 3) * 4 + 4) return false
  const bytes = Buffer.from(encoded, "base64")
  if (!bytes.length || bytes.length > maxBytes) return false
  if (bytes.toString("base64") !== encoded) return false
  const mime = match[1]
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const isWebp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
  const isPdf = bytes.toString("ascii", 0, 5) === "%PDF-"
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04
  if (mime === "image/png") return isPng
  if (mime === "image/jpeg") return isJpeg
  if (mime === "image/webp") return isWebp
  if (mime === "application/pdf") return isPdf
  return isZip
}

const signatureTypes = new Set(["image/png", "image/jpeg", "image/webp"])
const validSignature = (value: unknown) => validDataUrl(value, signatureTypes, MAX_SIGNATURE_BYTES)
const validDocument = (value: unknown) => validDataUrl(value, DOCUMENT_MIME_TYPES, MAX_DOCUMENT_BYTES)
const identifier = z.string().trim().min(1).max(128)

const createSchema = z.object({
  patientId: identifier,
  type: z.nativeEnum(NoteType).default(NoteType.EVOLUTION),
  content: z.string().trim().min(1).max(20000),
  status: z.string().trim().min(1).max(60).default("IN_PROGRESS"),
  fileUrl: z.string().nullable().optional(),
  professionalSignature: z.string().nullable().optional(),
  patientSignature: z.string().nullable().optional(),
  authorId: identifier.optional(), 
  createdAt: z.union([z.string(), z.date()]).optional(),
  date: z.union([z.string(), z.date()]).optional(),
  isSigned: z.boolean().optional(),
}).passthrough()

const updateSchema = z.object({
  id: identifier,
  content: z.string().trim().min(1).max(20000).optional(),
  status: z.string().trim().min(1).max(60).optional(),
  fileUrl: z.string().nullable().optional(),
  professionalSignature: z.string().nullable().optional(),
  patientSignature: z.string().nullable().optional(),
  isSigned: z.boolean().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  date: z.union([z.string(), z.date()]).optional(),
}).passthrough()

function readInput(data: unknown): unknown {
  if (data && typeof data === "object" && !Array.isArray(data) && "input" in data) {
    return (data as { input: unknown }).input
  }
  return data
}

function invalidBody(error: z.ZodError) {
  return NextResponse.json(
    { error: "Datos de nota clínica inválidos", fields: error.flatten().fieldErrors },
    { status: 422 }
  )
}

function parseDate(value: string | Date | undefined): Date | null {
  if (value === undefined) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

async function requestMetadata() {
  const h = await headers()
  return {
    ipAddress: (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "Desconocido").slice(0, 128),
    userAgent: (h.get("user-agent") || "Desconocido").slice(0, 512),
  }
}

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { user, searchParams }) => {
    const patientId = searchParams.get("patientId")?.trim() || ""
    if (!patientId || patientId.length > 128) {
      return NextResponse.json({ error: "patientId inválido" }, { status: 400 })
    }
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, isDeleted: false },
      select: { id: true },
    })
    if (!patient) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

    if (user.role === "RECEPTIONIST") {
      const clinicalNotes = await prisma.clinicalNote.findMany({
        where: { patientId, type: NoteType.GENERAL, fileUrl: { not: null } },
        select: {
          id: true, patientId: true, authorId: true, type: true, content: true,
          status: true, fileUrl: true, isSigned: true, createdAt: true, updatedAt: true,
          author: { select: { id: true, name: true, specialty: true, professionalCard: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      return { clinicalNotes }
    }

    const clinicalNotes = await prisma.clinicalNote.findMany({
      where: { patientId },
      select: {
        id: true, patientId: true, authorId: true, type: true, content: true,
        status: true, fileUrl: true, professionalSignature: true,
        patientSignature: true, isSigned: true, createdAt: true, updatedAt: true,
        author: {
          select: { id: true, name: true, specialty: true, professionalCard: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })
    return { clinicalNotes }
  }
)

export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: z.any() },
  async (_req, { user, data }) => {
    const raw = readInput(data)
    const parsed = createSchema.safeParse(raw)
    if (!parsed.success) return invalidBody(parsed.error)
    const input = parsed.data
    const isReception = user.role === "RECEPTIONIST"

    if (input.authorId && input.authorId !== user.id) {
      return NextResponse.json({ error: "El autor debe ser el usuario autenticado" }, { status: 403 })
    }

    if (isReception) {
      const allowed = new Set(["type", "content", "patientId", "authorId", "fileUrl", "status"])
      if (Object.keys(raw as Record<string, unknown>).some(key => !allowed.has(key)) ||
          input.type !== NoteType.GENERAL || input.status !== "COMPLETED" ||
          input.content.length > 255 || !validDocument(input.fileUrl)) {
        return NextResponse.json(
          { error: "Recepción solo puede adjuntar documentos válidos de hasta 3 MB; no puede registrar evoluciones ni firmas" },
          { status: 403 }
        )
      }
    }

    if (input.fileUrl && !validDocument(input.fileUrl)) {
      return NextResponse.json({ error: "Adjunto inválido o mayor de 3 MB" }, { status: 400 })
    }
    if (input.professionalSignature && input.professionalSignature !== user.signatureBase64) {
      return NextResponse.json({ error: "La firma profesional debe corresponder a la sesión autenticada" }, { status: 403 })
    }
    if (input.patientSignature && !validSignature(input.patientSignature)) {
      return NextResponse.json({ error: "Firma del paciente inválida" }, { status: 400 })
    }
    if (input.isSigned && !input.professionalSignature && !input.patientSignature) {
      return NextResponse.json({ error: "No se puede marcar una nota como firmada sin una firma" }, { status: 400 })
    }
    const createdAt = isReception ? new Date() : parseDate(input.date ?? input.createdAt)
    if (!createdAt) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 })
    const metadata = await requestMetadata()
    const result = await prisma.$transaction(async tx => {
      const patient = await tx.patient.findFirst({
        where: { id: input.patientId, isDeleted: false }, select: { id: true },
      })
      if (!patient) return { kind: "not-found" as const }

      const signed = Boolean(input.professionalSignature || input.patientSignature)
      const created = await tx.clinicalNote.create({
        data: {
          patientId: input.patientId, authorId: user.id,
          type: input.type, content: input.content, status: input.status,
          fileUrl: input.fileUrl || null,
          professionalSignature: isReception ? null : (input.professionalSignature || null),
          patientSignature: isReception ? null : (input.patientSignature || null),
          isSigned: isReception ? false : signed,
          createdAt,
        },
        include: { author: { select: { id: true, name: true, specialty: true, professionalCard: true } } },
      })
      await tx.auditLog.create({
        data: {
          userId: user.id, action: "CREATE_CLINICAL_NOTE", entity: "CLINICAL_NOTE",
          entityId: created.id, patientId: created.patientId,
          details: input.type === NoteType.GENERAL && input.fileUrl ? "Adjunto clínico cargado" : `Nota clínica creada (${created.type})`,
          newData: {
            type: created.type, status: created.status,
            hasFile: Boolean(created.fileUrl), isSigned: created.isSigned,
            hasProfessionalSignature: Boolean(created.professionalSignature),
            hasPatientSignature: Boolean(created.patientSignature),
          },
          ...metadata,
        },
      })
      return { kind: "ok" as const, note: created }
    })
    if (result.kind === "not-found") return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
    // Evitar devolver la firma del profesional o el archivo a Recepción en la respuesta POST.
    if (isReception) {
      const { fileUrl, professionalSignature, patientSignature, ...safe } = result.note
      void fileUrl; void professionalSignature; void patientSignature
      return safe
    }
    return result.note
  }
)

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"], schema: z.any() },
  async (_req, { user, data }) => {
    const parsed = updateSchema.safeParse(readInput(data))
    if (!parsed.success) return invalidBody(parsed.error)
    const input = parsed.data
    if (input.professionalSignature && input.professionalSignature !== user.signatureBase64) {
      return NextResponse.json({ error: "La firma profesional debe corresponder al usuario autenticado" }, { status: 403 })
    }
    if (input.patientSignature && !validSignature(input.patientSignature)) {
      return NextResponse.json({ error: "Firma del paciente inválida" }, { status: 400 })
    }
    if (input.fileUrl && !validDocument(input.fileUrl)) {
      return NextResponse.json({ error: "Adjunto inválido o mayor de 3 MB" }, { status: 400 })
    }
    if (input.isSigned === true && !input.professionalSignature && !input.patientSignature) {
      return NextResponse.json({ error: "No se puede firmar una nota sin una firma válida" }, { status: 400 })
    }
    if (input.isSigned === false && (input.professionalSignature || input.patientSignature)) {
      return NextResponse.json({ error: "Una nota con firmas no puede quedar sin estado de firma" }, { status: 400 })
    }
    const hasChanges = ["content", "status", "fileUrl", "professionalSignature", "patientSignature", "isSigned", "date", "createdAt"]
      .some(key => Object.prototype.hasOwnProperty.call(input, key))
    if (!hasChanges) return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 })
    const updateDate = input.date !== undefined || input.createdAt !== undefined
      ? parseDate(input.date ?? input.createdAt)
      : undefined
    if (updateDate === null) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 })
    const metadata = await requestMetadata()

    const result = await prisma.$transaction(async tx => {
      const previous = await tx.clinicalNote.findUnique({
        where: { id: input.id },
        include: { patient: { select: { isDeleted: true } } },
      })
      if (!previous || previous.patient.isDeleted) return { kind: "not-found" as const }
      if (user.role !== "ADMIN" && previous.authorId !== user.id) return { kind: "forbidden" as const }
      if (previous.isSigned || Boolean(previous.professionalSignature) || Boolean(previous.patientSignature)) {
        return { kind: "locked" as const }
      }
      const signed = Boolean(input.professionalSignature || input.patientSignature)
      const changes: Prisma.ClinicalNoteUpdateManyMutationInput = {
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.fileUrl !== undefined ? { fileUrl: input.fileUrl } : {}),
        ...(input.professionalSignature !== undefined ? { professionalSignature: input.professionalSignature } : {}),
        ...(input.patientSignature !== undefined ? { patientSignature: input.patientSignature } : {}),
        ...(signed ? { isSigned: true } : {}),
        ...(updateDate !== undefined ? { createdAt: updateDate } : {}),
      }
      const changed = await tx.clinicalNote.updateMany({
        where: { id: input.id, isSigned: false, professionalSignature: null, patientSignature: null },
        data: changes,
      })
      if (changed.count !== 1) return { kind: "locked" as const }
      const updated = await tx.clinicalNote.findUniqueOrThrow({
        where: { id: input.id },
        include: { author: { select: { id: true, name: true, specialty: true, professionalCard: true } } },
      })
      await tx.auditLog.create({
        data: {
          userId: user.id, action: "UPDATE_CLINICAL_NOTE", entity: "CLINICAL_NOTE",
          entityId: input.id, patientId: previous.patientId,
          details: "Nota clínica actualizada",
          oldData: { status: previous.status, isSigned: previous.isSigned,
            hasProfessionalSignature: Boolean(previous.professionalSignature),
            hasPatientSignature: Boolean(previous.patientSignature) },
          newData: { status: updated.status, isSigned: updated.isSigned,
            changedFields: Object.keys(changes),
            hasProfessionalSignature: Boolean(updated.professionalSignature),
            hasPatientSignature: Boolean(updated.patientSignature) },
          ...metadata,
        },
      })
      return { kind: "ok" as const, note: updated }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    if (result.kind === "not-found") return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 })
    if (result.kind === "forbidden") return NextResponse.json({ error: "No tiene permisos para modificar esta nota" }, { status: 403 })
    if (result.kind === "locked") return NextResponse.json({ error: "La nota ya está firmada y no puede modificarse" }, { status: 409 })
    return result.note
  }
)
