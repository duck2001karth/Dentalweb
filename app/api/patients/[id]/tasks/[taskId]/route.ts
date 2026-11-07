import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { params, data, audit }) => {
    const taskId = params.taskId as string
    const patientId = params.id as string

    if (typeof data?.isCompleted !== "boolean") {
      throw new Error("El campo isCompleted debe ser booleano")
    }
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, isDeleted: false }, select: { id: true },
    })
    if (!patient) throw new Error("NOT_FOUND")
    // Limitar la escritura al paciente de la URL (evita IDOR/BOLA).
    const result = await prisma.patientTask.updateMany({
      where: { id: taskId, patientId },
      data: { isCompleted: data.isCompleted },
    })
    if (result.count !== 1) throw new Error("NOT_FOUND")
    const task = await prisma.patientTask.findFirst({
      where: { id: taskId, patientId },
      include: { assignedTo: { select: { name: true } } },
    })
    if (!task) throw new Error("NOT_FOUND")

    await audit({
      action: "UPDATE_PATIENT_TASK",
      entity: "PATIENT_TASK",
      entityId: taskId,
      patientId: patientId,
      details: `Estado de tarea actualizado a ${data.isCompleted ? "completada" : "pendiente"}.`,
    })

    return task
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { params, audit }) => {
    const taskId = params.taskId as string
    const patientId = params.id as string

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, isDeleted: false }, select: { id: true },
    })
    if (!patient) throw new Error("NOT_FOUND")
    const existingTask = await prisma.patientTask.findFirst({
      where: { id: taskId, patientId },
      select: { id: true },
    })
    if (!existingTask) throw new Error("NOT_FOUND")

    const result = await prisma.patientTask.deleteMany({
      where: { id: taskId, patientId },
    })
    if (result.count !== 1) throw new Error("NOT_FOUND")

    await audit({
      action: "DELETE_PATIENT_TASK",
      entity: "PATIENT_TASK",
      entityId: taskId,
      patientId: patientId,
      details: "Tarea de paciente eliminada",
      oldData: { taskId }
    })

    return { success: true, message: "Tarea eliminada correctamente" }
  }
)