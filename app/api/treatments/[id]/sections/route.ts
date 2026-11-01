import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"], schema: z.any() },
  async (req, { user, params, data }) => {
    const id = params.id as string
    const { name } = data

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new Error("El nombre de la fase o sección es obligatorio.")
    }

    const cleanName = name.trim()
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const result = await prisma.$transaction(async (tx) => {
      const existingPlan = await tx.treatmentPlan.findUnique({
        where: { id },
        select: { id: true, name: true, patientId: true }
      })
      if (!existingPlan) throw new Error("NOT_FOUND")

      const currentSectionsCount = await tx.treatmentSection.count({ where: { treatmentPlanId: id } })
      const newSection = await tx.treatmentSection.create({
        data: { name: cleanName, treatmentPlanId: id, order: currentSectionsCount }
      })

      await tx.auditLog.create({
        data: {
          userId: user.id, action: "CREATE_TREATMENT_SECTION", entity: "TreatmentSection", entityId: newSection.id, patientId: existingPlan.patientId,
          details: `Nueva fase/sección agregada: "${cleanName}" en el plan "${existingPlan.name}"`,
          newData: { sectionId: newSection.id, sectionName: cleanName, order: newSection.order },
          ipAddress, userAgent
        }
      })
      return newSection
    })

    return { success: true, message: "Fase/sección creada exitosamente.", section: result }
  }
)