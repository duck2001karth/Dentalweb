import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

const createSectionSchema = z.object({
  name: z.string().trim().min(1, "El nombre de la fase es obligatorio").max(150),
}).strict()

async function requestMetadata() {
  const h = await headers()
  return {
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null,
    userAgent: h.get("user-agent") || "Desconocido",
  }
}

// Esta ruta modifica la estructura del presupuesto: debe permanecer inmutable
// después de B2 o de cualquier movimiento de Caja.
export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"], schema: createSectionSchema },
  async (_req, { user, params, data }) => {
    const planId = String(params.id || "")
    if (!planId) {
      return NextResponse.json({ error: "Falta el ID del plan" }, { status: 400 })
    }

    const metadata = await requestMetadata()
    try {
      return await prisma.$transaction(async (tx) => {
        const plan = await tx.treatmentPlan.findUnique({
          where: { id: planId },
          select: {
            id: true,
            name: true,
            patientId: true,
            doctorId: true,
            status: true,
            totalPaid: true,
            patient: { select: { isDeleted: true } },
            approvals: { select: { id: true }, take: 1 },
            payments: { select: { id: true }, take: 1 },
            items: {
              where: { paidAmount: { gt: 0 } },
              select: { id: true },
              take: 1,
            },
          },
        })

        if (!plan || plan.patient.isDeleted) {
          return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
        }
        if (user.role !== "ADMIN" && plan.doctorId !== user.id) {
          return NextResponse.json({ error: "No tienes permiso para modificar este plan" }, { status: 403 })
        }
        if (
          plan.status !== "DRAFT" ||
          plan.approvals.length > 0 ||
          plan.payments.length > 0 ||
          plan.items.length > 0 ||
          Number(plan.totalPaid ?? 0) !== 0
        ) {
          return NextResponse.json(
            { error: "No se pueden modificar las fases de un plan aprobado o con movimientos de Caja" },
            { status: 409 },
          )
        }

        const highest = await tx.treatmentSection.aggregate({
          where: { treatmentPlanId: planId },
          _max: { order: true },
        })
        const newSection = await tx.treatmentSection.create({
          data: {
            name: data.name,
            treatmentPlanId: planId,
            order: (highest._max.order ?? -1) + 1,
          },
        })

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "CREATE_TREATMENT_SECTION",
            entity: "TreatmentSection",
            entityId: newSection.id,
            patientId: plan.patientId,
            details: "Se creó una fase del presupuesto en borrador",
            newData: { sectionId: newSection.id, sectionName: newSection.name, order: newSection.order, planId },
            ...metadata,
          },
        })

        return { success: true, message: "Fase/sección creada exitosamente.", section: newSection }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        return NextResponse.json({ error: "El plan cambió simultáneamente. Vuelve a intentarlo." }, { status: 409 })
      }
      throw error
    }
  },
)
