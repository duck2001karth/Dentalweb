import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { headers } from "next/headers"
import { createHash } from "crypto"
import { z } from "zod"
import { NextResponse } from "next/server"

const schema = z.object({
  confirmed: z.literal(true),
  signatureBase64: z.string().max(1_500_000).optional(),
}).strict()

const cents = (n: number) => Math.round(n * 100)

const ORIGINAL_SNAPSHOT_KEYS = [
  "planId", "patientId", "name", "agreementId", "commercialDiscount",
  "globalDiscount", "commentsToPatient", "items", "amount",
] as const
const ORIGINAL_ITEM_KEYS = ["id", "name", "tooth", "cost", "discount", "net"] as const

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function restoreOriginalSnapshotOrder(snapshot: unknown): Record<string, unknown> | null {
  if (!isPlainRecord(snapshot)) return null
  // No se ignoran propiedades inesperadas: cualquier cambio en la evidencia
  // sigue invalidando la aprobación.
  const allowedSnapshotKeys = new Set<string>(ORIGINAL_SNAPSHOT_KEYS)
  if (Object.keys(snapshot).some((key) => !allowedSnapshotKeys.has(key))) return null
  if (!Array.isArray(snapshot.items) || snapshot.items.length === 0) return null

  const originalItems: Record<string, unknown>[] = []
  const allowedItemKeys = new Set<string>(ORIGINAL_ITEM_KEYS)
  for (const item of snapshot.items) {
    if (!isPlainRecord(item) || Object.keys(item).some((key) => !allowedItemKeys.has(key))) return null
    const orderedItem: Record<string, unknown> = {}
    for (const key of ORIGINAL_ITEM_KEYS) {
      if (Object.prototype.hasOwnProperty.call(item, key)) orderedItem[key] = item[key]
    }
    originalItems.push(orderedItem)
  }

  const orderedSnapshot: Record<string, unknown> = {}
  for (const key of ORIGINAL_SNAPSHOT_KEYS) {
    if (key === "items") {
      orderedSnapshot.items = originalItems
    } else if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
      orderedSnapshot[key] = snapshot[key]
    }
  }
  return orderedSnapshot
}

function hasValidApprovalHash(snapshot: unknown, expectedHash: string): boolean {
  if (typeof expectedHash !== "string" || !/^[0-9a-f]{64}$/i.test(expectedHash)) return false
  if (!isPlainRecord(snapshot) || !Array.isArray(snapshot.items) || snapshot.items.length === 0) return false
  const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex")

  // Compatible con el orden directo si la base de datos lo preserva.
  if (hash(snapshot) === expectedHash.toLowerCase()) return true
  // Para jsonb, verificar la serialización EXACTA usada al crear B2.
  const restored = restoreOriginalSnapshotOrder(snapshot)
  return restored !== null && hash(restored) === expectedHash.toLowerCase()
}

// Conserva las verificaciones financieras que utiliza Caja D4.
function approvalMatches(plan: any, approval: any): boolean {
  if (!approval || !hasValidApprovalHash(approval.snapshot, approval.snapshotHash)) return false
  const snapshot = approval.snapshot as any
  if (snapshot.planId !== plan.id || snapshot.patientId !== plan.patientId) return false
  if (snapshot.items.length !== plan.items.length) return false
  const byId = new Map<string, any>(plan.items.map((item: any) => [item.id, item]))
  let total = 0
  for (const saved of snapshot.items) {
    const item = byId.get(String(saved.id))
    const net = Number(saved.net)
    if (!item || !Number.isFinite(net) || net < 0 ||
      Number(item.cost) !== Number(saved.cost) ||
      Number(item.discount) !== Number(saved.discount) ||
      item.procedureName !== saved.name ||
      (item.tooth ?? null) !== (saved.tooth ?? null)) return false
    const paid = cents(Number(item.paidAmount || 0))
    if (paid < 0 || paid > cents(net)) return false
    total += cents(net)
  }
  return total === cents(Number(snapshot.amount)) &&
    total === cents(Number(approval.approvedAmount)) &&
    total === cents(Number(plan.totalCost))
}

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { params }) => {
    const id = typeof params.id === "string" ? params.id.trim() : ""
    if (!id || id.length > 128) return NextResponse.json({ error: "ID de plan inválido" }, { status: 400 })
    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        items: true,
        approvals: { orderBy: { approvedAt: "desc" }, take: 1 },
      },
    })
    if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    const latest = plan.approvals[0] ?? null
    const valid = approvalMatches(plan, latest)
    return {
      status: plan.status,
      hasB2: Boolean(latest),
      valid,
      canAuthorize: plan.status === "DRAFT" || (plan.status === "ACTIVE" && !latest),
      reason: valid ? null : latest ? "La versión del presupuesto difiere de su aprobación B2." :
        plan.status === "ACTIVE" ? "Este presupuesto activo necesita una autorización B2 actual." : null,
    }
  }
)

export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema },
  async (_req, { user, params, data }) => {
    const id = typeof params.id === "string" ? params.id.trim() : ""
    if (!id || id.length > 128) return NextResponse.json({ error: "ID de plan inválido" }, { status: 400 })
    const h = await headers()
    const ipAddress = (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "Desconocido").slice(0, 128)
    const userAgent = (h.get("user-agent") || "Desconocido").slice(0, 512)

    return prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.findUnique({
        where: { id },
        include: {
          patient: { select: { id: true, signatureBase64: true, isDeleted: true } },
          items: true, agreement: true,
          approvals: { orderBy: { approvedAt: "desc" }, take: 1 },
        },
      })
      if (!plan || plan.patient.isDeleted) return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 404 })
      const historical = plan.status === "ACTIVE" && plan.approvals.length === 0
      const draft = plan.status === "DRAFT"
      if (!draft && !historical) {
        return NextResponse.json({ error: "Este presupuesto no admite una aprobación nueva por esta ruta." }, { status: 409 })
      }
      if (plan.items.length === 0) return NextResponse.json({ error: "PLAN_EMPTY" }, { status: 409 })
      if (plan.items.some(i => !Number.isFinite(i.cost) || i.cost < 0 || !Number.isFinite(i.discount) || i.discount < 0 || i.discount > 100)) {
        return NextResponse.json({ error: "INVALID_ITEM_AMOUNT" }, { status: 409 })
      }
      if (!Number.isFinite(plan.commercialDiscount) || plan.commercialDiscount < 0 || plan.commercialDiscount > 100) {
        return NextResponse.json({ error: "INVALID_DISCOUNT" }, { status: 409 })
      }

      // Un presupuesto generado para corregir una aprobación previa requiere SIEMPRE
      // una firma nueva del paciente. La firma de su perfil no autoriza la revisión.
      const correctedDraft = draft ? await tx.auditLog.findFirst({
        where: { action: "CREATE_CORRECTED_TREATMENT_DRAFT", entity: "TreatmentPlan", entityId: id },
        select: { id: true },
      }) : null
      const freshSignatureRequired = historical || Boolean(correctedDraft)
      const signature = freshSignatureRequired ? data.signatureBase64 : (data.signatureBase64 || plan.patient.signatureBase64)
      if (!signature || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(signature)) {
        return NextResponse.json({ error: freshSignatureRequired ? "Esta versión corregida requiere una firma nueva y la autorización actual del paciente." : "PATIENT_SIGNATURE_REQUIRED" }, { status: 400 })
      }
      const globalDiscount = Number(plan.commercialDiscount) > 0 ? Number(plan.commercialDiscount) :
        (plan.agreement?.discountType === "PERCENTAGE" ? Number(plan.agreement.discountValue) : 0)
      if (!Number.isFinite(globalDiscount) || globalDiscount < 0 || globalDiscount > 100) {
        return NextResponse.json({ error: "INVALID_GLOBAL_DISCOUNT" }, { status: 409 })
      }
      const items = [...plan.items].sort((a,b) => a.id.localeCompare(b.id)).map(i => ({
        id: i.id, name: i.procedureName, tooth: i.tooth, cost: i.cost, discount: i.discount,
        net: Math.round(i.cost * (1 - (i.discount > 0 ? i.discount : globalDiscount)/100) * 100) / 100,
      }))
      const amount = Math.round(items.reduce((sum,i) => sum + i.net, 0) * 100) / 100
      if (historical && cents(amount) !== cents(Number(plan.totalCost))) {
        return NextResponse.json({ error: "El total actual difiere del valor del plan activo. Revisa el presupuesto antes de autorizarlo." }, { status: 409 })
      }
      if (historical) {
        const paidItemsCents = plan.items.reduce((sum, i) => sum + cents(Number(i.paidAmount || 0)), 0)
        const planPaidCents = cents(Number(plan.totalPaid || 0))
        const exceedsApproved = plan.items.some(i => {
          const approved = items.find(saved => saved.id === i.id)
          return !approved || cents(Number(i.paidAmount || 0)) < 0 ||
            cents(Number(i.paidAmount || 0)) > cents(approved.net)
        })
        if (exceedsApproved || paidItemsCents !== planPaidCents) {
          return NextResponse.json({ error: "Los abonos históricos no coinciden con los saldos por prestación. Requiere revisión antes de regularizar." }, { status: 409 })
        }
      }
      const snapshot = {
        planId: plan.id, patientId: plan.patientId, name: plan.name,
        agreementId: plan.agreementId, commercialDiscount: plan.commercialDiscount,
        globalDiscount, commentsToPatient: plan.commentsToPatient, items, amount,
      }
      const snapshotHash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex")
      if (draft) {
        const updated = await tx.treatmentPlan.updateMany({
          where: { id, status: "DRAFT" }, data: { status: "ACTIVE", totalCost: amount },
        })
        if (updated.count !== 1) return NextResponse.json({ error: "PLAN_ALREADY_APPROVED" }, { status: 409 })
      } else {
        // Registro de aprobación actual, sin reescribir estado, total ni pagos del plan histórico.
        const stillActive = await tx.treatmentPlan.updateMany({
          where: { id, status: "ACTIVE", totalCost: plan.totalCost },
          data: { status: "ACTIVE" },
        })
        if (stillActive.count !== 1) return NextResponse.json({ error: "El presupuesto cambió. Actualiza la pantalla." }, { status: 409 })
      }
      const approval = await tx.treatmentApproval.create({ data: {
        treatmentPlanId: id, patientId: plan.patientId, approvedById: user.id,
        approvedAmount: amount, snapshotHash, snapshot, signatureBase64: signature,
        evidence: {
          confirmation: "Aceptación actual del presupuesto en pantalla",
          signatureSource: data.signatureBase64 ? "new" : "patient_profile",
          historicalPlanRegularization: historical,
          historicalApprovalDateClaimed: false,
          ipAddress, userAgent,
        },
      } })
      // La firma de perfil se modifica solo cuando el paciente dibuja una nueva firma.
      if (data.signatureBase64) await tx.patient.update({ where: { id: plan.patientId }, data: { signatureBase64: data.signatureBase64 } })
      await tx.auditLog.create({ data: {
        userId: user.id,
        action: historical ? "AUTHORIZE_ACTIVE_TREATMENT_B2" : "APPROVE_TREATMENT_PLAN",
        entity: "TreatmentPlan", entityId: id, patientId: plan.patientId,
        details: `Autorización ${approval.id}, total ${amount}`,
        newData: { approvalId: approval.id, snapshotHash, approvedAmount: amount, status: "ACTIVE", historical },
        ipAddress, userAgent,
      } })
      return { success: true, message: historical ? "Autorización B2 actual registrada para el plan activo" : "Presupuesto aprobado", approvalId: approval.id, approvedAmount: amount }
    }, { isolationLevel: "Serializable", timeout: 15000 })
  }
)
