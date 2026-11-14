import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status })
export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (_req, { user, params }) => {
    const id = typeof params.id === "string" ? params.id.trim() : ""
    if (!id) return jsonError("Falta el ID del plan", 400)

    const h = await headers()
    const metadata = {
      ipAddress: (
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        h.get("x-real-ip") ||
        "Desconocido"
      ).slice(0, 128),
      userAgent: (h.get("user-agent") || "Desconocido").slice(0, 512),
    }

    try {
      return await prisma.$transaction(
        async (tx) => {
          // Una escritura condicional toma un bloqueo de fila y serializa
          // esta modificación frente a otras operaciones del mismo plan.
          const current = await tx.treatmentPlan.findUnique({
            where: { id },
            select: {
              id: true,
              name: true,
              patientId: true,
              doctorId: true,
              status: true,
              totalCost: true,
              totalPaid: true,
              patient: { select: { isDeleted: true } },
            },
          })

          if (!current || current.patient.isDeleted) {
            return jsonError("Plan no encontrado", 404)
          }
          if (user.role !== "ADMIN" && current.doctorId !== user.id) {
            return jsonError("No tienes permiso para vaciar este presupuesto", 403)
          }
          if (current.status !== "DRAFT") {
            return jsonError("Solo se pueden vaciar presupuestos en borrador", 409)
          }

          const locked = await tx.treatmentPlan.updateMany({
            where: { id, status: "DRAFT" },
            data: { status: "DRAFT" },
          })
          if (locked.count !== 1) {
            return jsonError("El estado del presupuesto cambió. Actualiza la pantalla", 409)
          }

          const [approvalCount, paymentCount, items] = await Promise.all([
            tx.treatmentApproval.count({ where: { treatmentPlanId: id } }),
            tx.payment.count({ where: { treatmentPlanId: id } }),
            tx.treatmentItem.findMany({
              where: { treatmentPlanId: id },
              select: { id: true, paidAmount: true, isPaid: true },
            }),
          ])

          if (
            approvalCount > 0 ||
            paymentCount > 0 ||
            Number(current.totalPaid) !== 0 ||
            items.some((item) => Number(item.paidAmount) !== 0 || item.isPaid)
          ) {
            return jsonError(
              "El presupuesto tiene una aprobación B2 o movimientos de Caja y no puede vaciarse",
              409,
            )
          }

          const deleted = await tx.treatmentItem.deleteMany({
            where: { treatmentPlanId: id },
          })
          await tx.treatmentPlan.update({
            where: { id },
            data: { totalCost: 0 },
          })

          await tx.auditLog.create({
            data: {
              userId: user.id,
              action: "CLEAR_TREATMENT_PLAN",
              entity: "TreatmentPlan",
              entityId: id,
              patientId: current.patientId,
              details: `Se vació el presupuesto en borrador; prestaciones eliminadas: ${deleted.count}`,
              oldData: {
                previousTotalCost: current.totalCost,
                itemsCount: items.length,
                deletedItemIds: items.map((item) => item.id),
              },
              newData: { totalCost: 0, itemsCount: 0 },
              ...metadata,
            },
          })

          return {
            success: true,
            message: "Presupuesto vaciado correctamente",
            deletedCount: deleted.count,
          }
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 15000,
        },
      )
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        return jsonError("El presupuesto cambió simultáneamente. Vuelve a intentarlo", 409)
      }
      throw error
    }
  },
)
