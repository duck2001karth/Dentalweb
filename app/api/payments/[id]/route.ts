import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createHash } from "crypto"

// Compatibilidad con las anulaciones históricas; hasta migrar a un campo
// estructurado de anulación, este marcador debe ser inmutable desde PATCH.
const VOID_MARKER = "[PAGO ELIMINADO"
const cents = (n: number) => Math.round(n * 100)
const isObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v)

const SNAPSHOT_KEYS = [
  "planId", "patientId", "name", "agreementId", "commercialDiscount",
  "globalDiscount", "commentsToPatient", "items", "amount",
] as const
const ITEM_KEYS = ["id", "name", "tooth", "cost", "discount", "net"] as const

// La aprobación B2 original se firmó antes de guardar el JSON en PostgreSQL;
// jsonb puede alterar el orden de las claves, no sus valores.
function validB2Hash(snapshot: unknown, expected: string): boolean {
  if (!isObject(snapshot) || !Array.isArray(snapshot.items) || !/^[a-f0-9]{64}$/i.test(expected)) return false
  const digest = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex")
  if (digest(snapshot) === expected.toLowerCase()) return true
  if (Object.keys(snapshot).some(k => !(SNAPSHOT_KEYS as readonly string[]).includes(k))) return false
  const orderedItems: Record<string, unknown>[] = []
  for (const raw of snapshot.items) {
    if (!isObject(raw) || Object.keys(raw).some(k => !(ITEM_KEYS as readonly string[]).includes(k))) return false
    const item: Record<string, unknown> = {}
    for (const key of ITEM_KEYS) if (Object.prototype.hasOwnProperty.call(raw, key)) item[key] = raw[key]
    orderedItems.push(item)
  }
  const restored: Record<string, unknown> = {}
  for (const key of SNAPSHOT_KEYS) {
    if (key === "items") restored.items = orderedItems
    else if (Object.prototype.hasOwnProperty.call(snapshot, key)) restored[key] = snapshot[key]
  }
  return digest(restored) === expected.toLowerCase()
}

async function requestMetadata() {
  const h = await headers()
  return {
    ipAddress: (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "Desconocido").slice(0, 128),
    userAgent: (h.get("user-agent") || "Desconocido").slice(0, 512),
  }
}

const paymentPatchSchema = z.object({
  method: z.enum(["CASH", "TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "INSURANCE", "OTHER"]).optional(),
  reference: z.string().max(150).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  receiptNumber: z.string().min(1).max(100).nullable().optional(),
}).strict().refine(x => Object.keys(x).length > 0, "No hay cambios para guardar")

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { params }) => {
    const paymentId = String(params.id || "")
    if (!paymentId || paymentId.length > 128) return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, ci: true } },
        treatmentPlan: { include: { items: true } },
        processedBy: { select: { id: true, name: true, specialty: true, role: true } },
      },
    })
    if (!payment) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    return { payment }
  }
)

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: paymentPatchSchema },
  async (_req, { user, params, data }) => {
    const paymentId = String(params.id || "")
    if (!paymentId || paymentId.length > 128) return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    // Un texto de usuario nunca puede crear ni borrar la marca contable de anulación.
    if (data.notes !== undefined && data.notes !== null && data.notes.toUpperCase().includes(VOID_MARKER)) {
      return NextResponse.json({ error: "Las marcas de anulación son reservadas" }, { status: 400 })
    }
    const metadata = await requestMetadata()
    try {
      return await prisma.$transaction(async tx => {
        const previous = await tx.payment.findUnique({ where: { id: paymentId } })
        if (!previous) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
        if (previous.notes?.toUpperCase().includes(VOID_MARKER)) {
          return NextResponse.json({ error: "No se puede editar un pago anulado" }, { status: 409 })
        }
        if (Number(previous.amount) <= 0) {
          return NextResponse.json({ error: "Las notas de crédito no se editan desde esta ruta" }, { status: 409 })
        }
        // El número del recibo ya emitido es evidencia contable; se preserva.
        if (data.receiptNumber !== undefined && data.receiptNumber !== previous.receiptNumber) {
          return NextResponse.json({ error: "El número de recibo emitido es inmutable" }, { status: 409 })
        }
        const updated = await tx.payment.update({
          where: { id: paymentId },
          data: {
            ...(data.method !== undefined && { method: data.method as Prisma.PaymentUpdateInput["method"] }),
            ...(data.reference !== undefined && { reference: data.reference }),
            ...(data.notes !== undefined && { notes: data.notes }),
          },
        })
        await tx.auditLog.create({ data: {
          userId: user.id, action: "UPDATE_PAYMENT", entity: "PAYMENT", entityId: paymentId,
          patientId: previous.patientId, details: `Actualización de metadatos de pago #${updated.receiptNumber || paymentId}`,
          oldData: { method: previous.method, reference: previous.reference, receiptNumber: previous.receiptNumber },
          newData: { method: updated.method, reference: updated.reference, receiptNumber: updated.receiptNumber },
          ...metadata,
        } })
        return { success: true, message: "Pago actualizado y auditado correctamente", payment: updated }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 })
    } catch (e: unknown) {
      if (isObject(e) && e.code === "P2034") return NextResponse.json({ error: "Movimiento concurrente; vuelve a consultar el pago" }, { status: 409 })
      throw e
    }
  }
)

const cancelSchema = z.object({
  reason: z.string().trim().min(3).max(500),
  permanent: z.boolean().optional(),
}).strict()

export const DELETE = createApiHandler(
  { roles: ["ADMIN"] },
  async (req, { user, params }) => {
    const paymentId = String(params.id || "")
    if (!paymentId || paymentId.length > 128) return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    const raw = await req.json().catch(() => null)
    const parsed = cancelSchema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: "Indica un motivo de anulación válido (3-500 caracteres)" }, { status: 400 })
    if (parsed.data.permanent) return NextResponse.json({ error: "La eliminación física de pagos está deshabilitada" }, { status: 403 })
    const metadata = await requestMetadata()

    try {
      return await prisma.$transaction(async tx => {
        const payment = await tx.payment.findUnique({ where: { id: paymentId } })
        if (!payment) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
        if (payment.notes?.toUpperCase().includes(VOID_MARKER)) {
          return NextResponse.json({ error: "El pago ya está anulado" }, { status: 409 })
        }
        if (Number(payment.amount) <= 0) {
          return NextResponse.json({ error: "Esta ruta no anula notas de crédito ni importes negativos" }, { status: 409 })
        }
        if (payment.status !== "COMPLETED") {
          return NextResponse.json({ error: "La anulación de pagos no completados requiere un flujo separado" }, { status: 409 })
        }

        if (payment.treatmentPlanId) {
          const planId = payment.treatmentPlanId
          const plan = await tx.treatmentPlan.findUnique({
            where: { id: planId },
            include: {
              items: { orderBy: { id: "asc" } },
              approvals: { orderBy: { approvedAt: "desc" }, take: 1 },
            },
          })
          if (!plan || plan.patientId !== payment.patientId) {
            return NextResponse.json({ error: "Plan o paciente inconsistente; anulación suspendida" }, { status: 409 })
          }
          const approval = plan.approvals[0]
          const snap = approval?.snapshot
          if (!approval || !validB2Hash(snap, approval.snapshotHash) || !isObject(snap) ||
              snap.planId !== plan.id || snap.patientId !== plan.patientId || !Array.isArray(snap.items) ||
              snap.items.length !== plan.items.length) {
            return NextResponse.json({ error: "La aprobación B2 no puede verificarse; requiere revisión financiera" }, { status: 409 })
          }
          const activePayments = await tx.payment.findMany({
            where: { treatmentPlanId: planId, status: "COMPLETED" },
            select: { id: true, amount: true, notes: true },
          })
          // Devoluciones/NC no tienen historial de asignación íntegro en esta API.
          // No recalcular ni anular cobros de planes con NC hasta conciliarlos.
          if (activePayments.some(p => Number(p.amount) < 0)) {
            return NextResponse.json({ error: "El plan tiene notas de crédito; concilia las devoluciones antes de anular este cobro" }, { status: 409 })
          }
          const activeCents = activePayments
            .filter(p => !p.notes?.toUpperCase().includes(VOID_MARKER))
            .reduce((sum, p) => sum + cents(Number(p.amount)), 0)
          const currentItemCents = plan.items.reduce((sum, i) => sum + cents(Number(i.paidAmount || 0)), 0)
          if (activeCents !== cents(Number(plan.totalPaid)) || activeCents !== currentItemCents) {
            return NextResponse.json({ error: "Saldos históricos inconsistentes; se requiere conciliación antes de anular" }, { status: 409 })
          }
          // La API original CREATE_PAYMENT registra la asignación exacta por ítem.
          // Si es un cobro legado sin esa evidencia, no adivinamos la distribución.
          const creationAudit = await tx.auditLog.findFirst({
            where: { action: "CREATE_PAYMENT", entity: "PAYMENT", entityId: payment.id },
            orderBy: { createdAt: "desc" },
            select: { newData: true },
          })
          const evidence = creationAudit?.newData
          const allocations = isObject(evidence) ? evidence.allocations : null
          if (!Array.isArray(allocations) || allocations.length === 0) {
            return NextResponse.json({ error: "Este cobro no tiene asignaciones verificables; anulación manual pendiente" }, { status: 409 })
          }
          const byId = new Map(plan.items.map(item => [item.id, item]))
          const approvedById = new Map<string, number>()
          let approvedTotal = 0
          for (const saved of snap.items) {
            if (!isObject(saved)) return NextResponse.json({ error: "Prestaciones B2 inválidas" }, { status: 409 })
            const id = String(saved.id || "")
            const item = byId.get(id)
            const net = Number(saved.net)
            if (!item || !Number.isFinite(net) || net < 0 ||
                item.procedureName !== saved.name || Number(item.cost) !== Number(saved.cost) ||
                Number(item.discount) !== Number(saved.discount) || (item.tooth ?? null) !== (saved.tooth ?? null)) {
              return NextResponse.json({ error: "Las prestaciones difieren del presupuesto B2" }, { status: 409 })
            }
            const netCents = cents(net)
            approvedById.set(id, netCents)
            approvedTotal += netCents
            const current = cents(Number(item.paidAmount || 0))
            if (current < 0 || current > netCents) return NextResponse.json({ error: "Saldo de prestación inválido" }, { status: 409 })
          }
          if (approvedTotal !== cents(Number(plan.totalCost)) || approvedTotal !== cents(Number(approval.approvedAmount))) {
            return NextResponse.json({ error: "Total de presupuesto B2 inconsistente" }, { status: 409 })
          }
          const deducted = new Map<string, number>()
          let allocated = 0
          for (const rawAllocation of allocations) {
            if (!isObject(rawAllocation)) return NextResponse.json({ error: "Asignaciones contables inválidas" }, { status: 409 })
            const itemId = String(rawAllocation.id || "")
            const v = Number(rawAllocation.appliedAmount)
            if (!approvedById.has(itemId) || !Number.isFinite(v) || v <= 0 ||
                Math.abs(v - cents(v) / 100) > 0.00001) {
              return NextResponse.json({ error: "Asignación inválida; se requiere conciliación" }, { status: 409 })
            }
            const next = (deducted.get(itemId) || 0) + cents(v)
            if (next > cents(Number(byId.get(itemId)!.paidAmount || 0))) {
              return NextResponse.json({ error: "El abono original ya no está disponible para revertirse" }, { status: 409 })
            }
            deducted.set(itemId, next)
            allocated += cents(v)
          }
          if (allocated !== cents(Number(payment.amount))) {
            return NextResponse.json({ error: "Las asignaciones no corresponden al cobro original" }, { status: 409 })
          }
          for (const [itemId, amount] of deducted) {
            const item = byId.get(itemId)!
            const remaining = cents(Number(item.paidAmount || 0)) - amount
            await tx.treatmentItem.update({
              where: { id: itemId },
              data: { paidAmount: remaining / 100, isPaid: remaining === approvedById.get(itemId) },
            })
          }
          const remainingPlanPaid = activeCents - cents(Number(payment.amount))
          if (remainingPlanPaid < 0) return NextResponse.json({ error: "Saldo insuficiente para anular" }, { status: 409 })
          await tx.treatmentPlan.update({
            where: { id: planId },
            data: { totalPaid: remainingPlanPaid / 100, status: remainingPlanPaid >= approvedTotal ? "COMPLETED" : "ACTIVE" },
          })
        }

        const reason = parsed.data.reason
        const prefix = `${VOID_MARKER}/ANULADO por ${user.name || "Administrador"} el ${new Date().toISOString()}]: ${reason}`
        const originalNotes = payment.notes ? ` | Original: ${payment.notes}` : ""
        // No se truncan los campos arbitrariamente; se limita el motivo y
        // el registro original para no superar las longitudes habituales.
        await tx.payment.update({
          where: { id: paymentId },
          data: { notes: `${prefix}${originalNotes}`.slice(0, 5000) },
        })
        await tx.auditLog.create({ data: {
          userId: user.id, action: "CANCEL_PAYMENT", entity: "PAYMENT", entityId: paymentId,
          patientId: payment.patientId,
          details: `Anulación de cobro #${payment.receiptNumber || paymentId}. Motivo: ${reason}`,
          oldData: { amount: payment.amount, method: payment.method, receiptNumber: payment.receiptNumber, treatmentPlanId: payment.treatmentPlanId },
          newData: { cancelled: true, amount: payment.amount, treatmentPlanId: payment.treatmentPlanId },
          ...metadata,
        } })
        return { success: true, message: "Pago anulado y archivado en auditoría con éxito" }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 })
    } catch (e: unknown) {
      if (isObject(e) && e.code === "P2034") return NextResponse.json({ error: "Movimiento concurrente; vuelve a consultar los pagos" }, { status: 409 })
      throw e
    }
  }
)
