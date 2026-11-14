import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

// Sin una relación CreditNote -> Payment en Prisma, se admite UNA nota de crédito
// por cobro original. No se intenta reconstruir devoluciones antiguas ambiguas.
const schema = z.object({
  reason: z.string().trim().min(3).max(300),
  amount: z.coerce.number().positive().finite(),
  notes: z.string().trim().max(1000).nullish(),
}).strict()

const toCents = (value: number) => Math.round(value * 100)
const isMoney = (value: number) => Number.isFinite(value) && value > 0 &&
  Math.abs(value - toCents(value) / 100) < 0.000001

function fail(error: string, status: 400 | 404 | 409 | 403) {
  return NextResponse.json({ error }, { status })
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema },
  async (_req, { user, params, data }) => {
    const paymentId = String(params.id || "")
    if (!paymentId) return fail("Falta el identificador del cobro", 400)

    const amount = Number(data.amount)
    if (!isMoney(amount)) return fail("El importe debe ser positivo y tener máximo dos decimales", 400)
    const refundCents = toCents(amount)
    const reason = data.reason as string
    const notes = (data.notes as string | null | undefined)?.trim() || null

    const h = await headers()
    const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null
    const userAgent = h.get("user-agent") || null

    try {
      return await prisma.$transaction(async (tx) => {
        const original = await tx.payment.findUnique({ where: { id: paymentId } })
        if (!original) return fail("Cobro no encontrado", 404)
        const originalAmount = Number(original.amount)
        if (original.status !== "COMPLETED" || !isMoney(originalAmount) ||
            (original.notes || "").includes("[PAGO ELIMINADO")) {
          return fail("El registro no es un cobro vigente susceptible de devolución", 409)
        }
        if (refundCents > toCents(originalAmount)) {
          return fail("La devolución supera el importe del cobro original", 409)
        }

        // El registro contable de devolución original se vincula a este pago
        // por AuditLog.oldData.originalPaymentId y también por su referencia.
        const priorAudit = await tx.auditLog.findFirst({
          where: {
            entity: "PAYMENT",
            action: "CREATE_CREDIT_NOTE",
            oldData: { path: ["originalPaymentId"], equals: paymentId },
          },
          select: { id: true },
        })
        const ncReference = `NC-${original.receiptNumber || original.id.slice(-6)}`
        const priorLegacy = await tx.payment.findFirst({
          where: { reference: ncReference, amount: { lt: 0 } },
          select: { id: true },
        })
        if (priorAudit || priorLegacy) {
          return fail("Este cobro ya tiene una nota de crédito; se requiere conciliación para una nueva devolución", 409)
        }

        // No se alteran planes con historial imposible de reconstruir.
        if (original.treatmentPlanId) {
          const planId = original.treatmentPlanId
          const plan = await tx.treatmentPlan.findUnique({
            where: { id: planId },
            include: { items: true, approvals: { orderBy: { approvedAt: "desc" }, take: 1 } },
          })
          if (!plan || plan.patientId !== original.patientId ||
              !["ACTIVE", "COMPLETED"].includes(plan.status) ||
              plan.items.length !== 1 || plan.approvals.length === 0) {
            return fail("El plan requiere conciliación antes de emitir una nota de crédito", 409)
          }
          const item = plan.items[0]
          const snapshot = plan.approvals[0].snapshot
          const saved = isObject(snapshot) && Array.isArray(snapshot.items) ? snapshot.items : null
          if (!saved || saved.length !== 1 || !isObject(saved[0]) ||
              saved[0].id !== item.id || !Number.isFinite(Number(saved[0].net)) ||
              toCents(Number(saved[0].net)) !== toCents(Number(plan.totalCost))) {
            return fail("La prestación no coincide con el presupuesto B2", 409)
          }
          // Para evitar restar devoluciones previas no identificadas, exigimos
          // que no existan otras notas de crédito dentro de este plan.
          const oldRefunds = await tx.payment.count({
            where: { treatmentPlanId: planId, amount: { lt: 0 } },
          })
          if (oldRefunds > 0) return fail("Existen notas de crédito previas en el plan; requiere conciliación", 409)

          const paid = Number(plan.totalPaid)
          const itemPaid = Number(item.paidAmount)
          if (!Number.isFinite(paid) || !Number.isFinite(itemPaid) ||
              toCents(paid) !== toCents(itemPaid) ||
              refundCents > toCents(paid) ||
              toCents(itemPaid) > toCents(Number(saved[0].net))) {
            return fail("Los saldos del plan y la prestación no son consistentes", 409)
          }

          // Comprobación independiente de los cobros originales activos.
          const movements = await tx.payment.findMany({
            where: { treatmentPlanId: planId, status: "COMPLETED" },
            select: { id: true, amount: true, notes: true },
          })
          const netMovements = movements.reduce((sum, p) =>
            sum + ((p.notes || "").includes("[PAGO ELIMINADO") ? 0 : toCents(Number(p.amount))), 0)
          if (netMovements !== toCents(paid)) {
            return fail("El saldo no concuerda con los movimientos de Caja; requiere conciliación", 409)
          }

          const remainder = toCents(paid) - refundCents
          await tx.treatmentItem.update({
            where: { id: item.id },
            data: { paidAmount: remainder / 100, isPaid: remainder === toCents(Number(saved[0].net)) },
          })
          await tx.treatmentPlan.update({
            where: { id: planId },
            data: { totalPaid: remainder / 100, status: "ACTIVE" },
          })
        }

        // Sin modificación destructiva del cobro original.
        const creditNote = await tx.payment.create({
          data: {
            patientId: original.patientId,
            amount: -(refundCents / 100),
            method: original.method,
            status: "COMPLETED",
            reference: ncReference,
            treatmentPlanId: original.treatmentPlanId,
            processedById: user.id,
            notes: `Nota de crédito. Motivo: ${reason}${notes ? `. ${notes}` : ""}`,
          },
          include: {
            treatmentPlan: { select: { id: true, name: true } },
            processedBy: { select: { id: true, name: true, specialty: true, role: true } },
          },
        })
        await tx.auditLog.create({ data: {
          userId: user.id,
          action: "CREATE_CREDIT_NOTE",
          entity: "PAYMENT",
          entityId: creditNote.id,
          patientId: original.patientId,
          details: `Nota de crédito por ${amount.toFixed(2)} del cobro ${original.receiptNumber || original.id}. Motivo: ${reason}`,
          oldData: { originalPaymentId: original.id, originalAmount: original.amount },
          newData: { refundAmount: -amount, reference: creditNote.reference, reason },
          ipAddress, userAgent,
        } })
        return { success: true, message: "Nota de crédito emitida correctamente", creditNote }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 })
    } catch (error: unknown) {
      if (isObject(error) && error.code === "P2034") {
        return fail("Hubo otro movimiento de Caja simultáneo. Consulta los movimientos antes de reintentar", 409)
      }
      throw error
    }
  }
)
