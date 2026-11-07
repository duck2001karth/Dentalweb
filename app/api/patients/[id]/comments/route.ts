import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { params }) => {
    const id = params.id as string
    const patient = await prisma.patient.findFirst({
      where: { id, isDeleted: false }, select: { id: true },
    })
    if (!patient) throw new Error("NOT_FOUND")
    return await prisma.patientComment.findMany({
      where: { patientId: id },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }
)

export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { params, user, data, audit }) => {
    const id = params.id as string
    const patient = await prisma.patient.findFirst({
      where: { id, isDeleted: false }, select: { id: true },
    })
    if (!patient) throw new Error("NOT_FOUND")
    if (typeof data?.text !== "string" || !data.text.trim() || data.text.length > 5000) {
      throw new Error("El comentario debe tener entre 1 y 5000 caracteres")
    }

    // La identidad del autor proviene siempre de la sesión, nunca del navegador.
    const currentAuthorId = user.id
    const comment = await prisma.patientComment.create({
      data: { text: data.text.trim(), authorId: currentAuthorId, patientId: id },
      include: { author: { select: { name: true } } }
    })

    await audit({
      action: "CREATE_PATIENT_COMMENT",
      entity: "PATIENT_COMMENT",
      entityId: comment.id,
      patientId: id,
      details: `Añadió un comentario en el expediente del paciente.`
    })

    return comment
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { params, searchParams, audit }) => {
    const patientId = params.id as string
    const commentId = searchParams.get("commentId")

    if (!commentId) throw new Error("Falta el ID del comentario")

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, isDeleted: false }, select: { id: true },
    })
    if (!patient) throw new Error("NOT_FOUND")
    const previousComment = await prisma.patientComment.findFirst({
      where: { id: commentId, patientId },
      select: { id: true },
    })
    if (!previousComment) throw new Error("NOT_FOUND")

    const deleted = await prisma.patientComment.deleteMany({
      where: { id: commentId, patientId },
    })
    if (deleted.count !== 1) throw new Error("NOT_FOUND")

    await audit({
      action: "DELETE_PATIENT_COMMENT",
      entity: "PATIENT_COMMENT",
      entityId: commentId,
      patientId: patientId,
      details: `Eliminó un comentario del expediente del paciente.`,
      oldData: { commentId }
    })

    return { success: true, message: "Comentario eliminado correctamente" }
  }
)