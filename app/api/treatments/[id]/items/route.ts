import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: z.any() },
  async (req, { user, params, data }) => {
    const id = params.id as string
    if (!id) throw new Error("Falta el ID del plan de tratamiento")

    const procedureName = data.procedureName || data.name || "Prestación sin nombre"
    const rawPrice = data.cost ?? data.price ?? data.basePrice ?? 0
    const parsedPrice = isNaN(parseFloat(rawPrice)) ? 0 : parseFloat(rawPrice)
    const tooth = data.toothNumber || data.tooth || data.toothNum || null
    const sectionId = data.sectionId || null

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const newItem = await prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.findUnique({ where: { id }, select: { id: true, patientId: true, name: true, totalCost: true } })
      if (!plan) throw new Error("PLAN_NOT_FOUND")

      let sectionName = ""
      if (sectionId) {
        const sec = await tx.treatmentSection.findUnique({ where: { id: sectionId }, select: { name: true, treatmentPlanId: true } })
        if (sec && sec.treatmentPlanId === id) sectionName = sec.name
      }

      const item = await tx.treatmentItem.create({
        data: {
          treatmentPlanId: id, procedureName: String(procedureName), cost: parsedPrice,
          tooth: tooth ? String(tooth) : null, sectionId: sectionId ? String(sectionId) : null,
        }
      })

      await tx.treatmentPlan.update({ where: { id }, data: { totalCost: { increment: parsedPrice } } })

      const detailMsg = sectionName 
        ? `Se añadió la prestación "${item.procedureName}" (${item.tooth || "General"}) a la fase "${sectionName}" con costo de $${parsedPrice.toFixed(2)} al plan "${plan.name}"`
        : `Se añadió la prestación "${item.procedureName}" (${item.tooth || "General"}) con costo de $${parsedPrice.toFixed(2)} al plan "${plan.name}"`

      await tx.auditLog.create({
        data: {
          userId: user.id, action: "CREATE_TREATMENT_ITEM", entity: "TreatmentItem", entityId: item.id, patientId: plan.patientId, details: detailMsg,
          newData: { id: item.id, treatmentPlanId: id, procedureName: item.procedureName, cost: item.cost, tooth: item.tooth, sectionId: item.sectionId },
          ipAddress, userAgent,
        }
      })
      return item
    })

    return newItem
  }
)

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: z.any() },
  async (req, { params, data }) => {
    const id = params.id as string
    const { itemIds, sectionId } = data

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      throw new Error("Debe especificar las prestaciones a actualizar")
    }

    await prisma.treatmentItem.updateMany({
      where: { id: { in: itemIds }, treatmentPlanId: id },
      data: { sectionId: sectionId || null },
    })

    return { success: true, message: "Fase actualizada correctamente" }
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: z.any() },
  async (req, { user, params, data }) => {
    const id = params.id as string
    const { itemIds } = data

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      throw new Error("No se seleccionaron ítems para eliminar")
    }

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const result = await prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.findUnique({ where: { id }, select: { id: true, patientId: true, name: true, totalCost: true } })
      if (!plan) throw new Error("PLAN_NOT_FOUND")

      const itemsToDelete = await tx.treatmentItem.findMany({ where: { id: { in: itemIds }, treatmentPlanId: id } })
      if (itemsToDelete.length === 0) throw new Error("ITEMS_NOT_FOUND")

      await tx.treatmentItem.deleteMany({ where: { id: { in: itemIds }, treatmentPlanId: id } })

      const remainingItems = await tx.treatmentItem.findMany({ where: { treatmentPlanId: id } })
      const newTotalCost = remainingItems.reduce((acc, item) => {
        const baseCost = item.cost || 0
        const dscto = item.discount || 0
        return acc + (baseCost - (baseCost * (dscto / 100)))
      }, 0)

      await tx.treatmentPlan.update({ where: { id }, data: { totalCost: newTotalCost } })

      await tx.auditLog.create({
        data: {
          userId: user.id, action: "DELETE_TREATMENT_ITEMS", entity: "TreatmentPlan", entityId: id, patientId: plan.patientId,
          details: `Se eliminaron ${itemsToDelete.length} prestación(es) del plan "${plan.name}". Nuevo total: $${newTotalCost.toFixed(2)}`,
          oldData: {
            deletedItems: itemsToDelete.map((item) => ({ id: item.id, procedureName: item.procedureName, cost: item.cost, discount: item.discount, tooth: item.tooth, paidAmount: item.paidAmount, sectionId: item.sectionId })),
            previousTotalCost: plan.totalCost,
          },
          ipAddress, userAgent,
        }
      })
      return { newTotalCost, deletedCount: itemsToDelete.length }
    })

    return { success: true, message: `${result.deletedCount} ítem(s) eliminado(s) correctamente`, newTotalCost: result.newTotalCost }
  }
)