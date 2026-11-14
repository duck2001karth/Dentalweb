import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

const roles = ["ADMIN", "DOCTOR", "RECEPTIONIST"] as const
const idsSchema = z.object({ itemIds: z.array(z.string().min(1)).min(1).max(250) }).strict()
const moveSchema = idsSchema.extend({
  sectionId: z.string().min(1).nullable().optional(),
}).strict()

const cents = (value: number) => Math.round(value * 100)
const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 })
const conflict = (error: string) => NextResponse.json({ error }, { status: 409 })
const notFound = () => NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })

async function getRequestMetadata() {
  const h = await headers()
  return {
    ipAddress: (
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "Desconocido"
    ).slice(0, 128),
    userAgent: (h.get("user-agent") || "Desconocido").slice(0, 512),
  }
}
async function lockEditableDraft(tx: Prisma.TransactionClient, id: string) {
  const existing = await tx.treatmentPlan.findUnique({
    where: { id },
    select: { id: true, status: true },
  })
  if (!existing) return { error: notFound() } as const
  if (existing.status !== "DRAFT") {
    return { error: conflict("Solo se pueden modificar prestaciones de presupuestos en borrador.") } as const
  }

  const locked = await tx.treatmentPlan.updateMany({
    where: { id, status: "DRAFT" },
    data: { status: "DRAFT" },
  })
  if (locked.count !== 1) {
    return { error: conflict("El estado del presupuesto cambió. Actualiza la pantalla.") } as const
  }

  const plan = await tx.treatmentPlan.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      patientId: true,
      name: true,
      totalCost: true,
      totalPaid: true,
      commercialDiscount: true,
      agreement: { select: { discountType: true, discountValue: true } },
    },
  })

  const [approvals, payments, paidItems] = await Promise.all([
    tx.treatmentApproval.count({ where: { treatmentPlanId: id } }),
    tx.payment.count({ where: { treatmentPlanId: id } }),
    tx.treatmentItem.count({ where: { treatmentPlanId: id, paidAmount: { gt: 0 } } }),
  ])

  if (approvals > 0 || payments > 0 || paidItems > 0 || Number(plan.totalPaid) !== 0) {
    return {
      error: conflict("Este presupuesto tiene autorización B2 o movimientos financieros. No se pueden modificar sus prestaciones."),
    } as const
  }

  return { plan } as const
}

async function recalculatePlanTotal(tx: Prisma.TransactionClient, plan: {
  id: string
  commercialDiscount: number
  agreement: { discountType: string; discountValue: Prisma.Decimal } | null
}) {
  const commercial = Number(plan.commercialDiscount || 0)
  const agreementDiscount = plan.agreement?.discountType === "PERCENTAGE"
    ? Number(plan.agreement.discountValue)
    : 0
  const globalDiscount = commercial > 0 ? commercial : agreementDiscount

  if (!Number.isFinite(globalDiscount) || globalDiscount < 0 || globalDiscount > 100) {
    throw new Error("INVALID_PLAN_DISCOUNT")
  }

  const items = await tx.treatmentItem.findMany({
    where: { treatmentPlanId: plan.id },
    select: { cost: true, discount: true },
  })

  let totalCents = 0
  for (const item of items) {
    const cost = Number(item.cost)
    const itemDiscount = Number(item.discount)
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(itemDiscount) || itemDiscount < 0 || itemDiscount > 100) {
      throw new Error("INVALID_ITEM_AMOUNT")
    }
    const effectiveDiscount = itemDiscount > 0 ? itemDiscount : globalDiscount
    totalCents += cents(cost * (1 - effectiveDiscount / 100))
  }

  const newTotalCost = totalCents / 100
  await tx.treatmentPlan.update({
    where: { id: plan.id },
    data: { totalCost: newTotalCost },
  })
  return newTotalCost
}

// Crear una prestación únicamente en un plan no aprobado y sin pagos.
export const POST = createApiHandler(
  { roles: [...roles], schema: z.record(z.string(), z.unknown()) },
  async (_req, { user, params, data }) => {
    const id = typeof params.id === "string" ? params.id.trim() : ""
    if (!id) return badRequest("Falta el ID del plan")

    const procedureName = String(data.procedureName ?? data.name ?? "Prestación sin nombre").trim()
    const rawPrice = data.cost ?? data.price ?? data.basePrice ?? 0
    const parsedPrice = Number(rawPrice)
    const tooth = data.toothNumber ?? data.tooth ?? data.toothNum
    const sectionId = data.sectionId == null || data.sectionId === ""
      ? null
      : String(data.sectionId)

    if (!procedureName || procedureName.length > 250) return badRequest("Nombre de prestación inválido")
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0 || parsedPrice > 1_000_000 || Math.abs(parsedPrice - cents(parsedPrice) / 100) > 0.00001) {
      return badRequest("El costo debe ser válido, no negativo y tener como máximo dos decimales")
    }
    if (sectionId && sectionId.length > 128) return badRequest("Fase inválida")
    if (tooth != null && String(tooth).length > 30) return badRequest("Número de pieza inválido")

    const metadata = await getRequestMetadata()
    try {
      return await prisma.$transaction(async (tx) => {
        const checked = await lockEditableDraft(tx, id)
        if ("error" in checked) return checked.error
        const plan = checked.plan

        let sectionName = ""
        if (sectionId) {
          const section = await tx.treatmentSection.findFirst({
            where: { id: sectionId, treatmentPlanId: id },
            select: { name: true },
          })
          if (!section) return badRequest("La fase no pertenece a este plan")
          sectionName = section.name
        }

        const item = await tx.treatmentItem.create({
          data: {
            treatmentPlanId: id,
            procedureName,
            cost: parsedPrice,
            tooth: tooth == null || tooth === "" ? null : String(tooth),
            sectionId,
          },
        })
        await recalculatePlanTotal(tx, plan)
        const location = item.tooth || "General"
        const detailMsg = sectionName
          ? `Se añadió "${item.procedureName}" (${location}) a la fase "${sectionName}" del plan "${plan.name}"`
          : `Se añadió "${item.procedureName}" (${location}) al plan "${plan.name}"`

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "CREATE_TREATMENT_ITEM",
            entity: "TreatmentItem",
            entityId: item.id,
            patientId: plan.patientId,
            details: detailMsg,
            newData: {
              id: item.id,
              treatmentPlanId: id,
              procedureName: item.procedureName,
              cost: item.cost,
              tooth: item.tooth,
              sectionId: item.sectionId,
            },
            ...metadata,
          },
        })
        return item
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 })
    } catch (error: any) {
      if (error?.code === "P2034") return conflict("Otro cambio ocurrió al mismo tiempo. Actualiza la pantalla e inténtalo nuevamente.")
      throw error
    }
  }
)

// Mover prestaciones de fase en un borrador, sin modificar importes.
export const PATCH = createApiHandler(
  { roles: [...roles], schema: moveSchema },
  async (_req, { user, params, data }) => {
    const id = typeof params.id === "string" ? params.id.trim() : ""
    if (!id) return badRequest("Falta el ID del plan")
    if (new Set(data.itemIds).size !== data.itemIds.length) return badRequest("Hay prestaciones repetidas")
    const itemIds = data.itemIds
    const sectionId = data.sectionId || null
    const metadata = await getRequestMetadata()

    try {
      return await prisma.$transaction(async (tx) => {
        const checked = await lockEditableDraft(tx, id)
        if ("error" in checked) return checked.error
        const plan = checked.plan

        const count = await tx.treatmentItem.count({
          where: { id: { in: itemIds }, treatmentPlanId: id },
        })
        if (count !== itemIds.length) return badRequest("Una o más prestaciones no pertenecen al plan")

        if (sectionId) {
          const section = await tx.treatmentSection.findFirst({
            where: { id: sectionId, treatmentPlanId: id }, select: { id: true },
          })
          if (!section) return badRequest("La fase seleccionada no pertenece al plan")
        }

        const previous = await tx.treatmentItem.findMany({
          where: { id: { in: itemIds }, treatmentPlanId: id },
          select: { id: true, sectionId: true },
        })
        await tx.treatmentItem.updateMany({
          where: { id: { in: itemIds }, treatmentPlanId: id },
          data: { sectionId },
        })
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "MOVE_TREATMENT_ITEMS",
            entity: "TreatmentPlan",
            entityId: id,
            patientId: plan.patientId,
            details: `Cambio de fase de ${itemIds.length} prestación(es) del plan "${plan.name}"`,
            oldData: { items: previous },
            newData: { itemIds, sectionId },
            ...metadata,
          },
        })
        return { success: true, message: "Fase actualizada correctamente" }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 })
    } catch (error: any) {
      if (error?.code === "P2034") return conflict("Otro cambio ocurrió al mismo tiempo. Actualiza la pantalla e inténtalo nuevamente.")
      throw error
    }
  }
)

export const DELETE = createApiHandler(
  { roles: [...roles] },
  async (req, { user, params }) => {
    const id = typeof params.id === "string" ? params.id.trim() : ""
    if (!id) return badRequest("Falta el ID del plan")
    const rawBody = await req.json().catch(() => null)
    const parsed = idsSchema.safeParse(rawBody)
    if (!parsed.success) return badRequest("Selecciona prestaciones válidas para eliminar")
    const itemIds = parsed.data.itemIds
    if (new Set(itemIds).size !== itemIds.length) return badRequest("Hay prestaciones repetidas")
    const metadata = await getRequestMetadata()

    try {
      return await prisma.$transaction(async (tx) => {
        const checked = await lockEditableDraft(tx, id)
        if ("error" in checked) return checked.error
        const plan = checked.plan

        const itemsToDelete = await tx.treatmentItem.findMany({
          where: { id: { in: itemIds }, treatmentPlanId: id },
        })
        if (itemsToDelete.length !== itemIds.length) {
          return badRequest("Una o más prestaciones no existen en este plan")
        }
        if (itemsToDelete.some((item) => Number(item.paidAmount) !== 0)) {
          return conflict("No se pueden eliminar prestaciones con abonos registrados")
        }

        await tx.treatmentItem.deleteMany({
          where: { id: { in: itemIds }, treatmentPlanId: id },
        })
        const newTotalCost = await recalculatePlanTotal(tx, plan)

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "DELETE_TREATMENT_ITEMS",
            entity: "TreatmentPlan",
            entityId: id,
            patientId: plan.patientId,
            details: `Se eliminaron ${itemsToDelete.length} prestación(es) del plan "${plan.name}". Nuevo total: ${newTotalCost.toFixed(2)}`,
            oldData: {
              deletedItems: itemsToDelete.map((item) => ({
                id: item.id,
                procedureName: item.procedureName,
                cost: item.cost,
                discount: item.discount,
                tooth: item.tooth,
                paidAmount: item.paidAmount,
                sectionId: item.sectionId,
              })),
              previousTotalCost: plan.totalCost,
            },
            ...metadata,
          },
        })
        return {
          success: true,
          message: `${itemsToDelete.length} prestación(es) eliminada(s) correctamente`,
          deletedCount: itemsToDelete.length,
          newTotalCost,
        }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 })
    } catch (error: any) {
      if (error?.code === "P2034") return conflict("Otro cambio ocurrió al mismo tiempo. Actualiza la pantalla e inténtalo nuevamente.")
      throw error
    }
  }
)
