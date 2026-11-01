import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { headers } from "next/headers"

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { user, params }) => {
    const id = params.id as string

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const result = await prisma.$transaction(async (tx) => {
      const previousPlan = await tx.treatmentPlan.findUnique({
        where: { id }, select: { id: true, name: true, status: true, totalCost: true, patientId: true, doctorId: true }
      })
      if (!previousPlan) throw new Error("PLAN_NOT_FOUND")

      const updatedPlan = await tx.treatmentPlan.update({
        where: { id }, data: { status: "ACTIVE" }
      })

      await tx.auditLog.create({
        data: {
          userId: user.id, action: "APPROVE_TREATMENT_PLAN", entity: "TreatmentPlan", entityId: id, patientId: previousPlan.patientId,
          details: `Plan de tratamiento "${previousPlan.name}" aprobado y activado. Presupuesto: $${Number(previousPlan.totalCost).toFixed(2)}`,
          oldData: { status: previousPlan.status }, newData: { status: "ACTIVE" },
          ipAddress, userAgent,
        }
      })
      return updatedPlan
    })

    return { success: true, message: "Plan activado correctamente", plan: result }
  }
)