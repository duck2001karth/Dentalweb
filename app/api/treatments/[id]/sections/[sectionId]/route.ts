import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (req, { user, params }) => {
    const { id: planId, sectionId } = params

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const section = await tx.treatmentSection.findUnique({
        where: { id: sectionId as string },
        include: { plan: { select: { name: true, patientId: true } } }
      })
      if (!section) throw new Error("NOT_FOUND")
      if (section.treatmentPlanId !== planId) {
        return NextResponse.json({ error: "La fase no pertenece a este plan" }, { status: 400 })
      }

      await tx.treatmentItem.updateMany({ where: { sectionId: sectionId as string, treatmentPlanId: planId as string }, data: { sectionId: null } })
      await tx.treatmentSection.delete({ where: { id: sectionId as string } })

      await tx.auditLog.create({
        data: {
          userId: user.id, action: "DELETE_TREATMENT_SECTION", entity: "TreatmentSection", entityId: sectionId as string, patientId: section.plan?.patientId,
          details: `Fase eliminada: "${section.name}" del plan "${section.plan?.name}"`,
          oldData: { sectionName: section.name, planId },
          ipAddress, userAgent
        }
      })
    })

    return { success: true, message: "Fase eliminada correctamente" }
  }
)