import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

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

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: z.any(), 
  },
  async (req, { user, data }) => {
    const input = data.input || data
    const {
      type,
      content,
      authorId,
      patientId,
      fileUrl,
      professionalSignature,
      patientSignature,
      status,
      createdAt,
      date,
    } = input

    const currentAuthorId = authorId || user.id
    if (!content || !currentAuthorId || !patientId) {
      throw new Error("Faltan datos requeridos (content, authorId o patientId)")
    }

    const noteType = type || "EVOLUTION"
    const noteStatus = status || "IN_PROGRESS"
    const noteDate = date || createdAt ? new Date(date || createdAt) : new Date()

    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const note = await prisma.$transaction(async (tx) => {
      const created = await tx.clinicalNote.create({
        data: {
          type: noteType as any,
          content,
          status: noteStatus as any,
          authorId: currentAuthorId,
          patientId,
          fileUrl: fileUrl || null,
          professionalSignature: professionalSignature || null,
          patientSignature: patientSignature || null,
          createdAt: noteDate,
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

      const isFileDoc = noteType === "GENERAL" && Boolean(fileUrl)
      const detailMsg = isFileDoc
        ? `Carga de archivo/radiografía: "${content}"`
        : `Registro de nota clínica (${noteType})`

      await tx.auditLog.create({
        data: {
          userId: currentAuthorId,
          action: "CREATE_CLINICAL_NOTE",
          entity: "CLINICAL_NOTE",
          entityId: created.id,
          patientId,
          details: detailMsg,
          newData: {
            type: created.type,
            content: created.content,
            status: created.status,
            hasFile: Boolean(created.fileUrl),
            hasProfessionalSignature: Boolean(created.professionalSignature),
            hasPatientSignature: Boolean(created.patientSignature),
          },
          ipAddress,
          userAgent,
        },
      })

      return created
    })

    return note
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