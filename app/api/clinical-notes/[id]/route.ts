import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

const updateNoteSchema = z.object({
  isSigned: z.boolean().optional(),
  content: z.string().optional(),
  fileUrl: z.string().nullable().optional(),
  status: z.string().optional(),
})

// PATCH: Actualizar Nota Clínica
export const PATCH = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: updateNoteSchema,
  },
  async (req, { user, params, data }) => {
    const id = params.id as string

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updatedNote = await prisma.$transaction(async (tx) => {
      const previous = await tx.clinicalNote.findUnique({ where: { id } })
      if (!previous) throw new Error("NOT_FOUND")

      const note = await tx.clinicalNote.update({
        where: { id },
        data: { ...data },
        include: {
          author: { select: { name: true, specialty: true } },
        },
      })

      const isFile = note.type === "GENERAL" && Boolean(note.fileUrl)

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_CLINICAL_NOTE",
          entity: "CLINICAL_NOTE",
          entityId: id,
          patientId: previous.patientId,
          details: isFile
            ? `Modificación de documento/estudio: "${note.content}"`
            : `Actualización de nota clínica (${note.type})`,
          oldData: {
            content: previous.content,
            status: previous.status,
            isSigned: previous.isSigned,
            hasFile: Boolean(previous.fileUrl),
          },
          newData: {
            content: note.content,
            status: note.status,
            isSigned: note.isSigned,
            hasFile: Boolean(note.fileUrl),
          },
          ipAddress,
          userAgent
        },
      })

      return note
    })

    return updatedNote
  }
)

// DELETE: Eliminar Nota Clínica
export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (req, { user, params }) => {
    const id = params.id as string

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const previous = await tx.clinicalNote.findUnique({ where: { id } })
      if (!previous) throw new Error("NOT_FOUND")

      const isAdmin = user.role === "ADMIN"
      const isAuthor = previous.authorId === user.id

      if (!isAdmin && !isAuthor) {
        throw new Error("UNAUTHORIZED_ROLE")
      }

      await tx.clinicalNote.delete({ where: { id } })

      const isFile = previous.type === "GENERAL" && Boolean(previous.fileUrl)

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_CLINICAL_NOTE",
          entity: "CLINICAL_NOTE",
          entityId: id,
          patientId: previous.patientId,
          details: isFile
            ? `Eliminación permanente de archivo adjunto: "${previous.content}"`
            : `Eliminación de nota clínica (${previous.type})`,
          oldData: {
            type: previous.type,
            content: previous.content,
            status: previous.status,
            hasFile: Boolean(previous.fileUrl),
            authorId: previous.authorId,
            createdAt: previous.createdAt,
          },
          ipAddress,
          userAgent
        },
      })
    })

    return { success: true, message: "Registro eliminado y auditado correctamente" }
  }
)