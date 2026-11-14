import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createHash } from "crypto"
import { z } from "zod"

const requestSchema = z.object({
  reason: z.string().trim().min(10).max(1000),
  removeItemIds: z.array(z.string().min(1).max(128)).min(1).max(100).refine(
    ids => new Set(ids).size === ids.length,
    "Hay prestaciones repetidas",
  ),
  mode: z.enum(["AUTO_IF_UNPAID", "REQUEST_REVIEW"]).default("AUTO_IF_UNPAID"),
}).strict()

const fail = (error: string, status: number) => NextResponse.json({ error }, { status })
const cents = (value: number) => Math.round(value * 100)
const TOP_KEYS = ["planId", "patientId", "name", "agreementId", "commercialDiscount", "globalDiscount", "commentsToPatient", "items", "amount"] as const
const ITEM_KEYS = ["id", "name", "tooth", "cost", "discount", "net"] as const

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function validB2Snapshot(value: unknown, expectedHash: string): value is Record<string, unknown> {
  if (!object(value) || !Array.isArray(value.items) || value.items.length === 0 || !/^[a-f0-9]{64}$/i.test(expectedHash)) return false
  if (Object.keys(value).some(key => !TOP_KEYS.includes(key as (typeof TOP_KEYS)[number]))) return false
  const items: Record<string, unknown>[] = []
  for (const entry of value.items) {
    if (!object(entry) || Object.keys(entry).some(key => !ITEM_KEYS.includes(key as (typeof ITEM_KEYS)[number]))) return false
    const normalized: Record<string, unknown> = {}
    for (const key of ITEM_KEYS) if (Object.prototype.hasOwnProperty.call(entry, key)) normalized[key] = entry[key]
    items.push(normalized)
  }
  const normalized: Record<string, unknown> = {}
  for (const key of TOP_KEYS) {
    if (key === "items") normalized.items = items
    else if (Object.prototype.hasOwnProperty.call(value, key)) normalized[key] = value[key]
  }
  const hash = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex")
  return hash(value) === expectedHash.toLowerCase() || hash(normalized) === expectedHash.toLowerCase()
}

async function metadata() {
  const h = await headers()
  return {
    ipAddress: (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "Desconocido").slice(0, 128),
    userAgent: (h.get("user-agent") || "Desconocido").slice(0, 512),
  }
}

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (_req, { user, params }) => {
    const id = typeof params.id === "string" ? params.id.trim() : ""
    if (!id || id.length > 128) return fail("ID de plan inválido", 400)
    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      select: { id: true, doctorId: true, patient: { select: { isDeleted: true } } },
    })
    if (!plan || plan.patient.isDeleted) return fail("Plan no encontrado", 404)
    if (user.role !== "ADMIN" && plan.doctorId !== user.id) return fail("Este tratamiento no está asignado al profesional", 403)
    const events = await prisma.auditLog.findMany({
      where: {
        entity: "TreatmentPlan", entityId: id,
        action: { in: ["REQUEST_TREATMENT_CORRECTION", "CREATE_TREATMENT_REVISION"] },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, action: true, createdAt: true, userId: true, newData: true },
    })
    return { requests: events }
  },
)

export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"], schema: requestSchema },
  async (_req, { user, params, data }) => {
    const id = typeof params.id === "string" ? params.id.trim() : ""
    if (!id || id.length > 128) return fail("ID de plan inválido", 400)
    const info = await metadata()
    try {
      return await prisma.$transaction(async tx => {
        // Bloqueo de fila: serializa con transacciones que actualizan el mismo plan.
        const locked = await tx.treatmentPlan.updateMany({ where: { id }, data: { updatedAt: new Date() } })
        if (locked.count !== 1) return fail("Plan no encontrado", 404)
        const plan = await tx.treatmentPlan.findUniqueOrThrow({
          where: { id },
          include: {
            patient: { select: { isDeleted: true } },
            agreement: { select: { discountType: true, discountValue: true } },
            items: { orderBy: { id: "asc" } },
            sections: { orderBy: { order: "asc" } },
            approvals: { orderBy: { approvedAt: "desc" }, take: 1 },
            payments: { select: { id: true }, take: 1 },
          },
        })
        if (plan.patient.isDeleted) return fail("Plan no encontrado", 404)
        if (user.role !== "ADMIN" && plan.doctorId !== user.id) return fail("Este tratamiento no está asignado al profesional", 403)
        if (plan.approvals.length === 0 || !["ACTIVE", "COMPLETED"].includes(plan.status)) {
          return fail("Este flujo es exclusivo para presupuestos aprobados B2. Los borradores se editan normalmente.", 409)
        }
        const selected = new Set(data.removeItemIds)
        if (plan.items.filter(i => selected.has(i.id)).length !== selected.size) return fail("Las prestaciones seleccionadas no pertenecen al plan", 400)
        if (selected.size === plan.items.length) return fail("No se puede crear una versión sin prestaciones. Utiliza el proceso administrativo de anulación.", 409)

        const previousRevision = await tx.auditLog.findFirst({
          where: { action: "CREATE_TREATMENT_REVISION", entity: "TreatmentPlan", entityId: id },
          select: { id: true },
        })
        if (previousRevision) return fail("Ya existe una versión corregida de este presupuesto. Consulta su historial.", 409)

        const hasMoney = plan.payments.length > 0 || Number(plan.totalPaid) !== 0 || plan.items.some(i => Number(i.paidAmount) !== 0 || i.isPaid)
        if (hasMoney || data.mode === "REQUEST_REVIEW") {
          const pending = await tx.auditLog.findFirst({
            where: { action: "REQUEST_TREATMENT_CORRECTION", entity: "TreatmentPlan", entityId: id },
            select: { id: true },
          })
          if (pending) return fail("Ya existe una solicitud de revisión para este presupuesto. No se duplicó.", 409)
          const entry = await tx.auditLog.create({
            data: {
              userId: user.id,
              action: "REQUEST_TREATMENT_CORRECTION",
              entity: "TreatmentPlan",
              entityId: id,
              patientId: plan.patientId,
              details: "Solicitud de rectificación de presupuesto firmado; SIN cambio financiero ni clínico",
              newData: {
                originalPlanId: id,
                reason: data.reason,
                removeItemIds: data.removeItemIds,
                status: "PENDING_ADMIN_FINANCIAL_REVIEW",
                hasFinancialHistory: hasMoney,
              },
              ...info,
            },
          })
          return {
            success: true, mode: "REQUEST_REVIEW", requestId: entry.id,
            message: "Solicitud registrada. El presupuesto original, los pagos y la firma B2 permanecen intactos. Requiere revisión administrativa y financiera.",
          }
        }

        if (plan.status !== "ACTIVE") return fail("Solo se puede generar una versión automática de planes ACTIVE sin pagos", 409)
        const approval = plan.approvals[0]
        const snapshot = approval.snapshot
        if (!validB2Snapshot(snapshot, approval.snapshotHash)) return fail("La evidencia B2 original es inválida; requiere revisión manual", 409)
        const saved = snapshot.items as Record<string, unknown>[]
        if (saved.length !== plan.items.length || snapshot.planId !== id || snapshot.patientId !== plan.patientId) {
          return fail("El presupuesto ya no coincide con la evidencia B2", 409)
        }
        const indexed = new Map(plan.items.map(i => [i.id, i]))
        let originalTotal = 0
        for (const item of saved) {
          const current = indexed.get(String(item.id))
          const net = Number(item.net)
          if (!current || !Number.isFinite(net) || net < 0 ||
              current.procedureName !== item.name ||
              (current.tooth ?? null) !== (item.tooth ?? null) ||
              Number(current.cost) !== Number(item.cost) ||
              Number(current.discount) !== Number(item.discount)) {
            return fail("Las prestaciones difieren de la aprobación B2", 409)
          }
          originalTotal += cents(net)
        }
        if (originalTotal !== cents(Number(plan.totalCost)) || originalTotal !== cents(Number(approval.approvedAmount))) {
          return fail("Los importes del plan no coinciden con su aprobación B2", 409)
        }
        const commercial = Number(plan.commercialDiscount || 0)
        const agreementDiscount = plan.agreement?.discountType === "PERCENTAGE" ? Number(plan.agreement.discountValue) : 0
        const globalDiscount = commercial > 0 ? commercial : agreementDiscount
        if (!Number.isFinite(globalDiscount) || globalDiscount < 0 || globalDiscount > 100) return fail("Descuento global inválido", 409)

        const retained = plan.items.filter(i => !selected.has(i.id))
        let totalCents = 0
        for (const item of retained) {
          const cost = Number(item.cost)
          const disc = Number(item.discount)
          if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(disc) || disc < 0 || disc > 100) return fail("Importes de prestaciones inválidos", 409)
          totalCents += cents(cost * (1 - (disc > 0 ? disc : globalDiscount) / 100))
        }
        const suffix = " (corrección pendiente B2)"
        const name = `${plan.name.slice(0, 200 - suffix.length)}${suffix}`
        const revision = await tx.treatmentPlan.create({
          data: {
            name, patientId: plan.patientId, doctorId: plan.doctorId,
            agreementId: plan.agreementId, commercialDiscount: plan.commercialDiscount,
            collaborators: plan.collaborators,
            status: "DRAFT", totalCost: totalCents / 100, totalPaid: 0,
          },
          select: { id: true, name: true, status: true, totalCost: true },
        })
        const sectionMap = new Map<string, string>()
        for (const section of plan.sections) {
          const copy = await tx.treatmentSection.create({
            data: { treatmentPlanId: revision.id, name: section.name, order: section.order },
            select: { id: true },
          })
          sectionMap.set(section.id, copy.id)
        }
        for (const item of retained) {
          await tx.treatmentItem.create({
            data: {
              treatmentPlanId: revision.id,
              procedureName: item.procedureName,
              cost: item.cost,
              discount: item.discount,
              tooth: item.tooth,
              sectionId: item.sectionId ? (sectionMap.get(item.sectionId) ?? null) : null,
            },
          })
        }

        const cancelled = await tx.treatmentPlan.updateMany({
          where: { id, status: "ACTIVE", totalPaid: 0 },
          data: { status: "CANCELLED" },
        })
        if (cancelled.count !== 1) throw new Error("CORRECTION_CONFLICT")
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "CREATE_TREATMENT_REVISION",
            entity: "TreatmentPlan",
            entityId: id,
            patientId: plan.patientId,
            details: "Versión B2 original conservada y cancelada; nueva versión DRAFT para rectificación y nueva firma",
            oldData: { status: "ACTIVE", totalCost: plan.totalCost, itemsCount: plan.items.length },
            newData: {
              originalPlanId: id, newPlanId: revision.id, reason: data.reason,
              removeItemIds: data.removeItemIds, status: "AWAITING_NEW_B2_SIGNATURE",
              newTotalCost: revision.totalCost,
            },
            ...info,
          },
        })
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "CREATE_CORRECTED_TREATMENT_DRAFT",
            entity: "TreatmentPlan",
            entityId: revision.id,
            patientId: plan.patientId,
            details: "Nuevo borrador derivado de versión B2 cancelada; requiere nueva firma del paciente",
            newData: { originalPlanId: id, requiresFreshPatientSignature: true },
            ...info,
          },
        })
        return {
          success: true,
          mode: "NEW_DRAFT",
          originalPlanId: id,
          newPlanId: revision.id,
          status: revision.status,
          message: "Presupuesto original conservado y cancelado; nuevo borrador creado. Debe obtenerse una nueva firma B2 antes de cobrar.",
        }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        return fail("El presupuesto fue modificado simultáneamente. Actualiza la pantalla e inténtalo nuevamente.", 409)
      }
      if (error instanceof Error && error.message === "CORRECTION_CONFLICT") {
        return fail("El presupuesto cambió durante la corrección. Reintenta la operación.", 409)
      }
      throw error
    }
  },
)
