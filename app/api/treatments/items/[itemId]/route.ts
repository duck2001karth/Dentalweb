import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

const updateSchema = z.object({
  progress: z.number().int().min(0).max(100).optional(),
  isCompleted: z.boolean().optional(),
  discount: z.number().min(0).max(100).optional(),
  paidAmount: z.unknown().optional(),
  isPaid: z.unknown().optional(),
  tooth: z.string().max(30).nullable().optional(),
  region: z.string().max(30).nullable().optional(),
  note: z.string().max(10000).nullable().optional(),
  isPrivate: z.boolean().optional(),
  fileUrl: z.string().max(2048).nullable().optional(),
  hasIncident: z.boolean().optional(),
  hasAdverseEvent: z.boolean().optional(),
  doctorId: z.string().min(1).max(100).nullable().optional(),
}).strict().refine(value => Object.keys(value).length > 0, {
  message: "No se recibieron campos para actualizar",
})

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function isValidFileReference(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true
  try {
    const url = new URL(value)
    return url.protocol === "https:"
  } catch {
    return false
  }
}

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: updateSchema },
  async (_req, { user, params, data }) => {
    const itemId = String(params.itemId || "").trim()
    if (!itemId) return jsonError("Falta el ID del ítem", 400)
    if (data.paidAmount !== undefined || data.isPaid !== undefined) {
      return jsonError("Los importes abonados solo pueden modificarse desde Pagos", 403)
    }
    if (data.tooth !== undefined && data.region !== undefined) {
      return jsonError("Envía tooth o region, no ambos", 400)
    }
    if (typeof data.fileUrl === "string" && data.fileUrl !== "" && !isValidFileReference(data.fileUrl)) {
      return jsonError("Referencia de archivo no permitida", 400)
    }

    const financialChange = data.discount !== undefined || data.tooth !== undefined || data.region !== undefined
    const h = await headers()
    const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null
    const userAgent = h.get("user-agent") || null

    try {
      return await prisma.$transaction(async (tx) => {
        const previous = await tx.treatmentItem.findUnique({
          where: { id: itemId },
          include: {
            plan: {
              include: {
                agreement: true,
                patient: { select: { isDeleted: true } },
                approvals: { select: { id: true }, take: 1 },
                payments: { select: { id: true }, take: 1 },
              },
            },
          },
        })
        if (!previous || !previous.plan || previous.plan.patient?.isDeleted) {
          return jsonError("Prestación o paciente no encontrado", 404)
        }

        const plan = previous.plan
        const isAdmin = user.role === "ADMIN"
        const assignedDoctor = plan.doctorId === user.id
        const performingDoctor = previous.performedById === user.id
        if (!isAdmin && user.role !== "DOCTOR") return jsonError("No autorizado para modificar prestaciones", 403)
        if (!isAdmin && !assignedDoctor && !performingDoctor) {
          return jsonError("La prestación pertenece a otro profesional", 403)
        }
        if (financialChange && !isAdmin && !assignedDoctor) {
          return jsonError("Solo el profesional responsable del plan puede modificar su presupuesto", 403)
        }
        if (data.doctorId !== undefined && !isAdmin && !assignedDoctor) {
          return jsonError("No autorizado para reasignar el profesional", 403)
        }

        const hasFinancialHistory =
          plan.approvals.length > 0 ||
          plan.payments.length > 0 ||
          Number(plan.totalPaid ?? 0) !== 0 ||
          Number(previous.paidAmount ?? 0) !== 0 ||
          previous.isPaid === true

        if (financialChange && (plan.status !== "DRAFT" || hasFinancialHistory)) {
          return jsonError("No se pueden alterar descuentos o piezas de un presupuesto aprobado, cerrado o con pagos", 409)
        }
        if (financialChange && !Number.isFinite(Number(plan.totalCost))) {
          return jsonError("El presupuesto tiene importes inconsistentes", 409)
        }

        if (data.doctorId) {
          const doctor = await tx.user.findFirst({
            where: { id: data.doctorId, isActive: true, role: { in: ["DOCTOR", "ADMIN"] } },
            select: { id: true },
          })
          if (!doctor) return jsonError("El profesional no existe o no está habilitado", 400)
        }
        const locked = await tx.treatmentPlan.updateMany({
          where: { id: plan.id, status: plan.status },
          data: { status: plan.status },
        })
        if (locked.count !== 1) return jsonError("El estado del presupuesto cambió. Actualiza la pantalla", 409)

        const updated = await tx.treatmentItem.update({
          where: { id: itemId },
          data: {
            ...(data.progress !== undefined && { progress: data.progress }),
            ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
            ...(data.isCompleted === undefined && data.progress === 100 && { isCompleted: true }),
            ...(data.discount !== undefined && { discount: data.discount }),
            ...(data.tooth !== undefined && { tooth: data.tooth }),
            ...(data.region !== undefined && { tooth: data.region }),
            ...(data.note !== undefined && { evolutionNote: data.note }),
            ...(data.isPrivate !== undefined && { isPrivate: data.isPrivate }),
            ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
            ...(data.hasIncident !== undefined && { hasIncident: data.hasIncident }),
            ...(data.hasAdverseEvent !== undefined && { hasAdverseEvent: data.hasAdverseEvent }),
            ...(data.doctorId !== undefined && { performedById: data.doctorId }),
          },
        })

        if (financialChange) {
          const allItems = await tx.treatmentItem.findMany({
            where: { treatmentPlanId: plan.id },
            select: { cost: true, discount: true },
          })
          const commercial = Number(plan.commercialDiscount || 0)
          const agreementDiscount = plan.agreement?.discountType === "PERCENTAGE"
            ? Number(plan.agreement.discountValue || 0) : 0
          const globalDiscount = commercial > 0 ? commercial : agreementDiscount
          if (!Number.isFinite(globalDiscount) || globalDiscount < 0 || globalDiscount > 100) {
            return jsonError("Descuento global del plan inválido", 409)
          }
          let totalCents = 0
          for (const item of allItems) {
            const cost = Number(item.cost)
            const itemDiscount = Number(item.discount || 0)
            if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(itemDiscount) || itemDiscount < 0 || itemDiscount > 100) {
              return jsonError("Existen prestaciones con importes inválidos", 409)
            }
            const rate = itemDiscount > 0 ? itemDiscount : globalDiscount
            totalCents += Math.round(cost * (1 - rate / 100) * 100)
          }
          await tx.treatmentPlan.update({ where: { id: plan.id }, data: { totalCost: totalCents / 100 } })
        }
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "UPDATE_TREATMENT_ITEM",
            entity: "TreatmentItem",
            entityId: updated.id,
            patientId: plan.patientId,
            details: financialChange ? "Actualización de parámetros de prestación en borrador" : "Actualización de evolución de prestación",
            oldData: {
              progress: previous.progress,
              isCompleted: previous.isCompleted,
              discount: previous.discount,
              tooth: previous.tooth,
              performedById: previous.performedById,
            },
            newData: {
              progress: updated.progress,
              isCompleted: updated.isCompleted,
              discount: updated.discount,
              tooth: updated.tooth,
              performedById: updated.performedById,
            },
            ipAddress,
            userAgent,
          },
        })
        return updated
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        return jsonError("Otra operación actualizó el presupuesto. Vuelve a intentarlo", 409)
      }
      throw error
    }
  }
)
