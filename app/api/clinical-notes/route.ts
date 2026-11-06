import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { searchParams }) => {
    const patientId = searchParams.get("patientId")
    if (!patientId) throw new Error("patientId requerido")

    const clinicalNotes = await prisma.clinicalNote.findMany({
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

    return { clinicalNotes }
  }
)

const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024
const DOCUMENT_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
])

function validDocumentDataUrl(value: unknown): boolean {
  if (typeof value !== "string") return false
  // Se exige un data URL real, no una URL remota proporcionada por el navegador.
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match || !DOCUMENT_MIME_TYPES.has(match[1])) return false
  const encoded = match[2]
  if (encoded.length > Math.ceil(MAX_DOCUMENT_BYTES / 3) * 4 + 4) return false
  const bytes = Buffer.from(encoded, "base64")
  if (bytes.length === 0 || bytes.length > MAX_DOCUMENT_BYTES) return false
  // Verificación básica de formato; no reemplaza un antivirus ni Storage privado.
  const mime = match[1]
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const isWebp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
  const isPdf = bytes.toString("ascii", 0, 5) === "%PDF-"
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && [0x03, 0x05, 0x07].includes(bytes[2])
  if (mime === "image/png") return isPng
  if (mime === "image/jpeg") return isJpeg
  if (mime === "image/webp") return isWebp
  if (mime === "application/pdf") return isPdf
  return isZip
}

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
    // Mantiene el contrato anterior { input: {...} } o {...}.
    // Las validaciones de privilegios se efectúan explícitamente abajo.
    schema: z.any(),
  },
  async (_req, { user, data }) => {
    const input = data?.input ?? data
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json({ error: "Datos de la nota inválidos" }, { status: 400 })
    }

    const {
      type, content, patientId, fileUrl, professionalSignature,
      patientSignature, status, createdAt, date,
    } = input

    const role = String(user.role || "").toUpperCase()
    const isReception = role === "RECEPTIONIST"
    const noteType = type || "EVOLUTION"
    const noteStatus = status || "IN_PROGRESS"

    if (typeof patientId !== "string" || !patientId.trim() ||
        typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Paciente y contenido son obligatorios" }, { status: 400 })
    }

    if (isReception) {
      const allowedKeys = new Set([
        "type", "content", "patientId", "authorId", "fileUrl", "status",
      ])
      const forbiddenKey = Object.keys(input).find((key) => !allowedKeys.has(key))
      if (forbiddenKey || noteType !== "GENERAL" || noteStatus !== "COMPLETED" ||
          content.trim().length > 255 || !validDocumentDataUrl(fileUrl)) {
        return NextResponse.json(
          { error: "Recepción solo puede adjuntar documentos válidos de hasta 3 MB; no puede crear evoluciones ni firmas." },
          { status: 403 }
        )
      }
      // Se admite authorId por compatibilidad con RX, pero nunca se utiliza
      // como autor ni como responsable de auditoría.
      if (input.authorId !== undefined && input.authorId !== user.id) {
        return NextResponse.json({ error: "El autor debe ser el usuario autenticado" }, { status: 403 })
      }
    }

    // Para archivos nuevos, aplicamos los límites en servidor a todos los roles.
    if (noteType === "GENERAL" && fileUrl && !validDocumentDataUrl(fileUrl)) {
      return NextResponse.json(
        { error: "Archivo no válido o mayor de 3 MB" },
        { status: 400 }
      )
    }

    let noteDate = new Date()
    if (!isReception && (date || createdAt)) {
      noteDate = new Date(date || createdAt)
      if (Number.isNaN(noteDate.getTime())) {
        return NextResponse.json({ error: "Fecha inválida" }, { status: 400 })
      }
    }

    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    return prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findUnique({
        where: { id: patientId }, select: { id: true },
      })
      if (!patient) {
        return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
      }

      const created = await tx.clinicalNote.create({
        data: {
          type: noteType as any,
          content: content.trim(),
          status: noteStatus as any,
          authorId: user.id,
          patientId,
          fileUrl: fileUrl || null,
          professionalSignature: isReception ? null : (professionalSignature || null),
          patientSignature: isReception ? null : (patientSignature || null),
          createdAt: noteDate,
        },
        include: {
          author: {
            select: {
              id: true, name: true, specialty: true,
              professionalCard: true, signatureBase64: true,
            },
          },
        },
      })

      const isFileDoc = noteType === "GENERAL" && Boolean(fileUrl)
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_CLINICAL_NOTE",
          entity: "CLINICAL_NOTE",
          entityId: created.id,
          patientId,
          details: isFileDoc
            ? `Carga de archivo/radiografía: "${content.trim()}"`
            : `Registro de nota clínica (${noteType})`,
          newData: {
            type: created.type,
            content: created.content,
            status: created.status,
            hasFile: Boolean(created.fileUrl),
            hasProfessionalSignature: Boolean(created.professionalSignature),
            hasPatientSignature: Boolean(created.patientSignature),
          },
          ipAddress, userAgent,
        },
      })
      return created
    })
  }
)

export const PATCH = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: z.any(),
  },
  async (req, { user, data }) => {
    const input = data.input || data
    const {
      id,
      content,
      status,
      fileUrl,
      professionalSignature,
      patientSignature,
      isSigned,
      date,
      createdAt,
    } = input

    if (!id) throw new Error("ID de la nota requerido")

    const updateDate = date || createdAt ? new Date(date || createdAt) : undefined

    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updatedNote = await prisma.$transaction(async (tx) => {
      const previous = await tx.clinicalNote.findUnique({ where: { id } })
      if (!previous) throw new Error("NOT_FOUND")

      const updated = await tx.clinicalNote.update({
        where: { id },
        data: {
          ...(content !== undefined && { content }),
          ...(status !== undefined && { status: status as any }),
          ...(fileUrl !== undefined && { fileUrl }),
          ...(professionalSignature !== undefined && { professionalSignature }),
          ...(patientSignature !== undefined && { patientSignature }),
          ...(isSigned !== undefined && { isSigned: Boolean(isSigned) }),
          ...(updateDate !== undefined && { createdAt: updateDate }),
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
          userId: user.id,
          action: "UPDATE_CLINICAL_NOTE",
          entity: "CLINICAL_NOTE",
          entityId: id,
          patientId: previous.patientId,
          details: `Actualización de nota clínica (${updated.type})`,
          oldData: {
            content: previous.content,
            status: previous.status,
            isSigned: previous.isSigned,
            hasProfessionalSignature: Boolean(previous.professionalSignature),
          },
          newData: {
            content: updated.content,
            status: updated.status,
            isSigned: updated.isSigned,
            hasProfessionalSignature: Boolean(updated.professionalSignature),
          },
          ipAddress,
          userAgent,
        },
      })

      return updated
    })

    return updatedNote
  }
)