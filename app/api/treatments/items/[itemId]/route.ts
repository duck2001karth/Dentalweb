import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: z.any() },
  async (req, { user, params, data }) => {
    const itemId = params.itemId as string
    if (!itemId) throw new Error("Falta el ID del ítem")

    const { progress, isCompleted, discount, paidAmount, isPaid, tooth, region, note, isPrivate, fileUrl, hasIncident, hasAdverseEvent, doctorId } = data
    // Los abonos solo pueden modificarse desde la API financiera.
    if (paidAmount !== undefined || isPaid !== undefined) {
      return NextResponse.json({ error: "Los importes abonados solo pueden modificarse desde Pagos" }, { status: 403 })
    }
    if (progress !== undefined && (!Number.isInteger(Number(progress)) || Number(progress) < 0 || Number(progress) > 100)) {
      return NextResponse.json({ error: "Progreso inválido (0-100)" }, { status: 400 })
    }
    if (discount !== undefined && (!Number.isFinite(Number(discount)) || Number(discount) < 0 || Number(discount) > 100)) {
      return NextResponse.json({ error: "Descuento inválido (0-100)" }, { status: 400 })
    }
    const finalIsCompleted = isCompleted ?? (progress !== undefined && Number(progress) === 100 ? true : undefined)

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updatedItem = await prisma.$transaction(async (tx) => {
      const previousItem = await tx.treatmentItem.findUnique({
        where: { id: itemId }, include: { plan: { include: { agreement: true } } }
      })
      if (!previousItem) throw new Error("ITEM_NOT_FOUND")

      const updated = await tx.treatmentItem.update({
        where: { id: itemId },
        data: {
          ...(progress !== undefined && { progress: Number(progress) }),
          ...(finalIsCompleted !== undefined && { isCompleted: Boolean(finalIsCompleted) }),
          ...(discount !== undefined && { discount: Number(discount) }),
          ...(tooth !== undefined && { tooth: String(tooth) }),
          ...(region !== undefined && { tooth: String(region) }),
          ...(note !== undefined && { evolutionNote: String(note) }),
          ...(isPrivate !== undefined && { isPrivate: Boolean(isPrivate) }),
          ...(fileUrl !== undefined && { fileUrl: String(fileUrl) }),
          ...(hasIncident !== undefined && { hasIncident: Boolean(hasIncident) }),
          ...(hasAdverseEvent !== undefined && { hasAdverseEvent: Boolean(hasAdverseEvent) }),
          ...(doctorId !== undefined && { performedById: String(doctorId) }),
        }
      })

      if (updated.treatmentPlanId) {
        const allItems = await tx.treatmentItem.findMany({ where: { treatmentPlanId: updated.treatmentPlanId } })
        const commercialDisc = Number(previousItem.plan?.commercialDiscount ?? 0)

        const agreementDisc = previousItem.plan?.agreement ? Number(previousItem.plan.agreement.discountValue || 0) : 0
        const globalDiscount = commercialDisc > 0 ? commercialDisc : agreementDisc

        const newTotalCost = allItems.reduce((acc, itm) => {
          const baseCost = Number(itm.cost || 0)
          const itmDisc = Number(itm.discount || 0)
          const effectiveDisc = itmDisc > 0 ? itmDisc : globalDiscount
          return acc + Math.max(0, baseCost - baseCost * (effectiveDisc / 100))
        }, 0)

        await tx.treatmentPlan.update({
          where: { id: updated.treatmentPlanId },
          data: { totalCost: Math.round(newTotalCost * 100) / 100 }
        })
      }

      await tx.auditLog.create({
        data: {
          userId: user.id, action: "UPDATE_TREATMENT_ITEM", entity: "TreatmentItem", entityId: updated.id, patientId: previousItem.plan?.patientId || null,
          details: `Actualización de prestación "${updated.procedureName || 'Tratamiento'}" (Diente: ${updated.tooth || 'General'}). Descuento: ${updated.discount ?? 0}%, Progreso: ${updated.progress ?? 0}%, Pagado: $${Number(updated.paidAmount || 0).toFixed(2)}`,
          oldData: { progress: previousItem.progress, isCompleted: previousItem.isCompleted, discount: previousItem.discount, paidAmount: previousItem.paidAmount, isPaid: previousItem.isPaid, tooth: previousItem.tooth, evolutionNote: previousItem.evolutionNote, hasIncident: previousItem.hasIncident, hasAdverseEvent: previousItem.hasAdverseEvent, performedById: previousItem.performedById },
          newData: { progress: updated.progress, isCompleted: updated.isCompleted, discount: updated.discount, paidAmount: updated.paidAmount, isPaid: updated.isPaid, tooth: updated.tooth, evolutionNote: updated.evolutionNote, hasIncident: updated.hasIncident, hasAdverseEvent: updated.hasAdverseEvent, performedById: updated.performedById },
          ipAddress, userAgent,
        }
      })

      return updated
    })

    return updatedItem
  }
)