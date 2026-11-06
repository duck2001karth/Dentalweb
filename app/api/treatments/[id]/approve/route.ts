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

// Este verificador reproduce las restricciones que aplica Caja a una aprobación B2.
// Nunca se infiere aprobación a partir de status ACTIVE o de una firma del perfil.
function approvalMatches(plan: any, approval: any): boolean {
  if (!approval) return false
  const snapshot = approval.snapshot as any
  if (!snapshot || !Array.isArray(snapshot.items) || snapshot.items.length === 0) return false
  const hash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex")
  if (hash !== approval.snapshotHash) return false
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
  return total === cents(Number(approval.approvedAmount)) &&
    total === cents(Number(plan.totalCost))
}

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { params }) => {
    const id = String(params.id || "")
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
    const id = String(params.id || "")
    const h = await headers()
    const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null
    const userAgent = h.get("user-agent") || null

    return prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.findUnique({
        where: { id },
        include: {
          patient: { select: { id: true, signatureBase64: true } },
          items: true, agreement: true,
          approvals: { orderBy: { approvedAt: "desc" }, take: 1 },
        },
      })
      if (!plan) return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 404 })
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

      // Regularización: una firma NUEVA en pantalla y aceptación ACTUAL del paciente.
      // No se copia la firma del perfil para presupuestos históricos.
      const signature = historical ? data.signatureBase64 : (data.signatureBase64 || plan.patient.signatureBase64)
      if (!signature || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(signature)) {
        return NextResponse.json({ error: historical ? "Se requiere una nueva firma y autorización actual del paciente." : "PATIENT_SIGNATURE_REQUIRED" }, { status: 400 })
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
      if (historical && plan.items.some(i => Number(i.paidAmount || 0) < 0)) {
        return NextResponse.json({ error: "Existen abonos inconsistentes que requieren revisión." }, { status: 409 })
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
