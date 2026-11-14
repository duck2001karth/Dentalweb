import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

async function requestMetadata() {
  const h = await headers()
  return {
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null,
    userAgent: h.get("user-agent") || "Desconocido",
  }
}

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (_req, { user, params }) => {
    const planId = String(params.id || "")
    const sectionId = String(params.sectionId || "")
    if (!planId || !sectionId) {
      return NextResponse.json({ error: "Falta el ID del plan o de la fase" }, { status: 400 })
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
            { error: "No se pueden eliminar fases de un plan aprobado o con movimientos de Caja" },
            { status: 409 },
          )
        }

        const section = await tx.treatmentSection.findUnique({
          where: { id: sectionId },
          select: { id: true, name: true, treatmentPlanId: true },
        })
        if (!section) {
          return NextResponse.json({ error: "Fase no encontrada" }, { status: 404 })
        }
        if (section.treatmentPlanId !== planId) {
          return NextResponse.json({ error: "La fase no pertenece a este plan" }, { status: 400 })
        }

        // Preserva las prestaciones; únicamente las desasocia de la fase eliminada.
        await tx.treatmentItem.updateMany({
          where: { treatmentPlanId: planId, sectionId },
          data: { sectionId: null },
        })
        await tx.treatmentSection.delete({ where: { id: sectionId } })

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "DELETE_TREATMENT_SECTION",
            entity: "TreatmentSection",
            entityId: sectionId,
            patientId: plan.patientId,
            details: "Se eliminó una fase de un presupuesto en borrador; sus prestaciones se conservaron",
            oldData: { sectionName: section.name, planId },
            ...metadata,
          },
        })

        return { success: true, message: "Fase eliminada correctamente" }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        return NextResponse.json({ error: "El plan cambió simultáneamente. Vuelve a intentarlo." }, { status: 409 })
      }
      throw error
    }
  },
)
