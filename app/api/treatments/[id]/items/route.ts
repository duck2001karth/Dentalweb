
import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

const roles = ["ADMIN", "DOCTOR", "RECEPTIONIST"] as const

const idsSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1),
})

const moveSchema = idsSchema.extend({
  sectionId: z.string().min(1).nullable().optional(),
})

async function getRequestMetadata() {
  const h = await headers()
  return {
    ipAddress:
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "127.0.0.1",
    userAgent: h.get("user-agent") || "Desconocido",
  }
}

async function recalculatePlanTotal(
  tx: Prisma.TransactionClient,
  planId: string,
  globalDiscount: number
) {
  const items = await tx.treatmentItem.findMany({
    where: { treatmentPlanId: planId },
    select: { cost: true, discount: true },
  })

  const total = items.reduce((sum, item) => {
    const cost = Number(item.cost ?? 0)
    const individual = Number(item.discount ?? 0)
    const discount = individual > 0 ? individual : globalDiscount

    return sum + Math.max(0, cost * (1 - discount / 100))
  }, 0)

  const newTotalCost = Math.round(total * 100) / 100

  await tx.treatmentPlan.update({
    where: { id: planId },
    data: { totalCost: newTotalCost },
  })

  return newTotalCost
}

export const POST = createApiHandler(
  { roles: [...roles], schema: z.record(z.string(), z.unknown()) },
  async (_req, { user, params, data }) => {
    const id = String(params.id || "")
    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID del plan" },
        { status: 400 }
      )
    }

    const procedureName = String(
      data.procedureName ?? data.name ?? "Prestación sin nombre"
    ).trim()

    const rawPrice = data.cost ?? data.price ?? data.basePrice ?? 0
    const parsedPrice = Number(rawPrice)

    if (!procedureName || procedureName.length > 250) {
      return NextResponse.json(
        { error: "Nombre de prestación inválido" },
        { status: 400 }
      )
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: "El costo debe ser un número válido no negativo" },
        { status: 400 }
      )
    }

    const tooth = data.toothNumber ?? data.tooth ?? data.toothNum
    const sectionId = data.sectionId
      ? String(data.sectionId)
      : null

    const metadata = await getRequestMetadata()

    return prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.findUnique({
      where: { id },
      select: {
        id: true,
        patientId: true,
        name: true,
        commercialDiscount: true,
      },
    })

      if (!plan) {
        return NextResponse.json(
          { error: "Plan no encontrado" },
          { status: 404 }
        )
      }

      let sectionName = ""

      if (sectionId) {
        const section = await tx.treatmentSection.findFirst({
          where: { id: sectionId, treatmentPlanId: id },
          select: { name: true },
        })

        if (!section) {
          return NextResponse.json(
            { error: "La fase no pertenece a este plan" },
            { status: 400 }
          )
        }

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

      await recalculatePlanTotal(
        tx,
        id,
        Number(plan.commercialDiscount ?? 0)
      )

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
    })
  }
)

export const PATCH = createApiHandler(
  { roles: [...roles], schema: moveSchema },
  async (_req, { params, data }) => {
    const id = String(params.id || "")
    const itemIds = [...new Set(data.itemIds)]
    const sectionId = data.sectionId || null

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID del plan" },
        { status: 400 }
      )
    }

    return prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.findUnique({
        where: { id },
        select: { id: true },
      })

      if (!plan) {
        return NextResponse.json(
          { error: "Plan no encontrado" },
          { status: 404 }
        )
      }

      const count = await tx.treatmentItem.count({
        where: {
          id: { in: itemIds },
          treatmentPlanId: id,
        },
      })

      if (count !== itemIds.length) {
        return NextResponse.json(
          { error: "Una o más prestaciones no pertenecen al plan" },
          { status: 400 }
        )
      }

      if (sectionId) {
        const section = await tx.treatmentSection.findFirst({
          where: { id: sectionId, treatmentPlanId: id },
          select: { id: true },
        })

        if (!section) {
          return NextResponse.json(
            { error: "La fase seleccionada no pertenece al plan" },
            { status: 400 }
          )
        }
      }

      await tx.treatmentItem.updateMany({
        where: {
          id: { in: itemIds },
          treatmentPlanId: id,
        },
        data: { sectionId },
      })

      return {
        success: true,
        message: "Fase actualizada correctamente",
      }
    })
  }
)

export const DELETE = createApiHandler(
  { roles: [...roles] },
  async (req, { user, params }) => {
    const id = String(params.id || "")

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID del plan" },
        { status: 400 }
      )
    }

    // api-handler.ts no lee el JSON de DELETE.
    // Por eso lo leemos y validamos aquí.
    const rawBody = await req.json().catch(() => null)
    const parsed = idsSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Selecciona prestaciones válidas para eliminar" },
        { status: 400 }
      )
    }

    const itemIds = [...new Set(parsed.data.itemIds)]
    const metadata = await getRequestMetadata()

    return prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.findUnique({
        where: { id },
        select: {
        id: true,
        patientId: true,
        name: true,
        totalCost: true,
        commercialDiscount: true,
      }
      })

      if (!plan) {
        return NextResponse.json(
          { error: "Plan no encontrado" },
          { status: 404 }
        )
      }

      const itemsToDelete = await tx.treatmentItem.findMany({
        where: {
          id: { in: itemIds },
          treatmentPlanId: id,
        },
      })

      if (itemsToDelete.length !== itemIds.length) {
        return NextResponse.json(
          { error: "Una o más prestaciones no existen en este plan" },
          { status: 400 }
        )
      }

      // Evita borrar prestaciones que ya tienen pagos asociados.
      const hasPayments = itemsToDelete.some(
        (item) => Number(item.paidAmount ?? 0) > 0
      )

      if (hasPayments) {
        return NextResponse.json(
          {
            error:
              "No se pueden eliminar prestaciones con abonos registrados.",
          },
          { status: 409 }
        )
      }

      await tx.treatmentItem.deleteMany({
        where: {
          id: { in: itemIds },
          treatmentPlanId: id,
        },
      })

      const newTotalCost = await recalculatePlanTotal(
        tx,
        id,
        Number(plan.commercialDiscount ?? 0)
      )

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_TREATMENT_ITEMS",
          entity: "TreatmentPlan",
          entityId: id,
          patientId: plan.patientId,
          details:
            `Se eliminaron ${itemsToDelete.length} prestación(es) ` +
            `del plan "${plan.name}". Nuevo total: ${newTotalCost.toFixed(2)}`,
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
    })
  }
)
