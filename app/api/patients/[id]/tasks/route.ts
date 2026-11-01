import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { params }) => {
    const id = params.id as string
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
    if (!data.title) throw new Error("El título es obligatorio")

    const task = await prisma.patientTask.create({
      data: {
        title: data.title,
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
      details: `Nueva tarea asignada: "${task.title}"`
    })

    return task
  }
)