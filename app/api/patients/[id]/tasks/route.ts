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
    return await prisma.patientTask.findMany({
      where: { patientId: id },
      include: { assignedTo: { select: { name: true } }, creator: { select: { name: true } } },
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
    if (typeof data?.title !== "string" || !data.title.trim() || data.title.length > 500) {
      throw new Error("El título debe tener entre 1 y 500 caracteres")
    }

    const task = await prisma.patientTask.create({
      data: {
        title: data.title.trim(),
        creatorId: user.id,
        patientId: id,
        assignedToId: data.assignedToId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: { assignedTo: { select: { name: true } } }
    })

    await audit({
      action: "CREATE_PATIENT_TASK",
      entity: "PATIENT_TASK",
      entityId: task.id,
      patientId: id,
      details: "Nueva tarea de paciente registrada"
    })

    return task
  }
)