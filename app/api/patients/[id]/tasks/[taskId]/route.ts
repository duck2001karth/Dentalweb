import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { params, data, audit }) => {
    const taskId = params.taskId as string
    const patientId = params.id as string

    const task = await prisma.patientTask.update({
      where: { id: taskId },
      data: { isCompleted: Boolean(data.isCompleted) },
      include: { assignedTo: { select: { name: true } } }
    })

    await audit({
      action: "UPDATE_PATIENT_TASK",
      entity: "PATIENT_TASK",
      entityId: taskId,
      patientId: patientId,
      details: `Tarea "${task.title}" marcada como ${data.isCompleted ? "completada" : "pendiente"}.`,
    })

    return task
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { params, audit }) => {
    const taskId = params.taskId as string
    const patientId = params.id as string

    const existingTask = await prisma.patientTask.findUnique({ where: { id: taskId } })
    if (!existingTask) throw new Error("NOT_FOUND")

    await prisma.patientTask.delete({ where: { id: taskId } })

    await audit({
      action: "DELETE_PATIENT_TASK",
      entity: "PATIENT_TASK",
      entityId: taskId,
      patientId: patientId,
      details: `Tarea eliminada: "${existingTask.title}".`,
      oldData: { title: existingTask.title }
    })

    return { success: true, message: "Tarea eliminada correctamente" }
  }
)