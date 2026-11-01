import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { params }) => {
    const id = params.id as string
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
    if (!data.text) throw new Error("El texto es obligatorio")

    const currentAuthorId = data.authorId || user.id
    const comment = await prisma.patientComment.create({
      data: { text: data.text, authorId: currentAuthorId, patientId: id },
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

    const previousComment = await prisma.patientComment.findUnique({ where: { id: commentId } })
    if (!previousComment) throw new Error("NOT_FOUND")

    await prisma.patientComment.delete({ where: { id: commentId } })

    await audit({
      action: "DELETE_PATIENT_COMMENT",
      entity: "PATIENT_COMMENT",
      entityId: commentId,
      patientId: patientId,
      details: `Eliminó un comentario del expediente del paciente.`,
      oldData: { text: previousComment.text }
    })

    return { success: true, message: "Comentario eliminado correctamente" }
  }
)