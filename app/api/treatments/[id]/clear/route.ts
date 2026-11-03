import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (req, { user, params }) => {
    const id = params.id as string

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const result = await prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.findUnique({ where: { id }, include: { items: true } })
      if (!plan) throw new Error("PLAN_NOT_FOUND")

      const paymentCount = await tx.payment.count({ where: { treatmentPlanId: id } })
      if (paymentCount > 0 || Number(plan.totalPaid) > 0 || plan.items.some( (item) => Number(item.paidAmount) > 0 || item.isPaid
      )
    ) {
      return {
        blocked: true as const,
        error: "El plan tiene pagos o abonos registrados; no puede vaciarse.",
      }
    }

      const deleteResult = await tx.treatmentItem.deleteMany({ where: { treatmentPlanId: id } })
      await tx.treatmentPlan.update({ where: { id }, data: { totalCost: 0 } })

      await tx.auditLog.create({
        data: {
          userId: user.id, action: "CLEAR_TREATMENT_PLAN", entity: "TreatmentPlan", entityId: id, patientId: plan.patientId,
          details: `Se vació completamente el presupuesto del plan "${plan.name}". Se eliminaron ${plan.items.length} prestación(es). Costo anterior: $${Number(plan.totalCost).toFixed(2)}`,
          oldData: { previousTotalCost: plan.totalCost, itemsCount: plan.items.length, deletedItems: plan.items.map((item) => ({ id: item.id, procedureName: item.procedureName, cost: item.cost, discount: item.discount, tooth: item.tooth, paidAmount: item.paidAmount, isPaid: item.isPaid })) },
          newData: { totalCost: 0, itemsCount: 0 },
          ipAddress, userAgent,
        }
      })
      return { deletedCount: deleteResult.count, planName: plan.name }
    })

    if (result.blocked === true) {
      return NextResponse.json(
        { error: result.error },
        { status: 409 }
      )
    }

    return {
      success: true,
      message: "Presupuesto vaciado correctamente",
      deletedCount: result.deletedCount,
    }
  }
)