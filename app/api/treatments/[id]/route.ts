import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"

// Mantener el contrato { plan } de la ficha y la lectura por los tres roles.
// Nunca incluir firmas del paciente o del profesional en respuestas genéricas.
const safeInclude = {
  doctor: { select: { id: true, name: true, email: true, specialty: true } },
  patient: { select: { id: true, firstName: true, lastName: true, ci: true, convenio: true } },
  items: true,
  sections: { orderBy: { createdAt: "asc" } },
  agreement: true,
} as const

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status })

const getId = (params: Record<string, any>): string =>
  typeof params?.id === "string" ? params.id.trim() : ""

function readablePlan(plan: any, isReception: boolean) {
  const agreementDiscount = plan.agreement ? Number(plan.agreement.discountValue || 0) : 0
  const commercialDiscount = Number(plan.commercialDiscount || 0)
  const discount = commercialDiscount > 0 ? commercialDiscount : agreementDiscount

  // A Recepción no se le deben entregar notas clínicas, ficheros ni incidentes.
  const items = isReception
    ? (plan.items || []).map((item: any) => ({
        id: item.id,
        treatmentPlanId: item.treatmentPlanId,
        sectionId: item.sectionId,
        procedureName: item.procedureName,
        tooth: item.tooth,
        cost: item.cost,
        discount: item.discount,
        paidAmount: item.paidAmount,
        isPaid: item.isPaid,
        isCompleted: item.isCompleted,
      }))
    : plan.items

  const payments = plan.payments === undefined
    ? undefined
    : isReception
      ? plan.payments.map((payment: any) => ({
          id: payment.id,
          patientId: payment.patientId,
          treatmentPlanId: payment.treatmentPlanId,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          receiptNumber: payment.receiptNumber,
          createdAt: payment.createdAt,
          processedById: payment.processedById,
        }))
      : plan.payments

  return {
    ...plan,
    items,
    ...(payments !== undefined ? { payments } : {}),
    discount,
    convenio: plan.agreement?.name || plan.patient?.convenio || null,
  }
}

// Solo imágenes pequeñas PNG/JPEG/WEBP, no HTML/SVG ni URLs remotas.
function validPatientSignature(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 1_100_000) return false
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match) return false
  const bytes = Buffer.from(match[2], "base64")
  if (bytes.length === 0 || bytes.length > 800 * 1024) return false
  const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const jpg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  const webp = bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
  return (match[1] === "png" && png) || (match[1] === "jpeg" && jpg) || (match[1] === "webp" && webp)
}

function parseCollaborators(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > 30) return null
  const parsed: string[] = []
  for (const entry of value) {
    const candidate = typeof entry === "string"
      ? entry
      : entry && typeof entry === "object"
        ? (entry as { id?: unknown; name?: unknown }).id ?? (entry as { name?: unknown }).name
        : undefined
    if (typeof candidate !== "string" || !candidate.trim() || candidate.length > 120) return null
    parsed.push(candidate.trim())
  }
  return [...new Set(parsed)]
}

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { user, params }) => {
    const id = getId(params)
    if (!id || id.length > 128) return errorResponse("ID de plan inválido", 400)

    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        ...safeInclude,
        // Administración y profesionales conservan el contrato histórico de pagos.
        // La respuesta de Recepción elimina las referencias y comprobantes sensibles.
        payments: true,
      },
    })
    if (!plan) return errorResponse("Plan no encontrado", 404)
    const patientActive = await prisma.patient.count({
      where: { id: plan.patientId, isDeleted: false },
    })
    if (!patientActive) return errorResponse("Plan no encontrado", 404)
    return { plan: readablePlan(plan, user.role === "RECEPTIONIST") }
  }
)

// Se conserva { input: ... } y el cuerpo directo; no se habilita edición masiva.
export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: z.any() },
  async (_req, { user, params, data }) => {
    const id = getId(params)
    if (!id || id.length > 128) return errorResponse("ID de plan inválido", 400)
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorResponse("Solicitud inválida", 400)

    const outer = data as Record<string, unknown>
    const nested = outer.input
    if (nested !== undefined && (!nested || typeof nested !== "object" || Array.isArray(nested))) {
      return errorResponse("Datos de tratamiento inválidos", 400)
    }
    const body = (nested ? nested : outer) as Record<string, unknown>
    const action = outer.action
    const collaborators = outer.collaborators
    const agreementId = outer.agreementId
    const agreementName = outer.agreementName
    const discount = outer.discount
    const isReception = user.role === "RECEPTIONIST"

    if (action !== undefined && action !== "RESTORE") return errorResponse("Acción no permitida", 400)
    if (body.status !== undefined && body.status !== "DRAFT") {
      return errorResponse("El estado del plan no se modifica desde esta ruta", 409)
    }
    if (outer.status !== undefined && outer.status !== "DRAFT") {
      return errorResponse("Para aprobar un presupuesto utilice el proceso de firma", 409)
    }
    if (isReception && action === "RESTORE") return errorResponse("Permisos insuficientes", 403)
    if (isReception && collaborators !== undefined) return errorResponse("Permisos insuficientes", 403)

    // La recepción puede guardar una firma de paciente en un borrador, pero
    // no modificar condiciones comerciales ni asignación médica del tratamiento.
    const financialChange = [
      discount, agreementId, agreementName, body.commercialDiscount,
      body.convenio, body.comments, body.commentsToPatient, body.doctorId,
    ].some(v => v !== undefined)
    if (isReception && financialChange) return errorResponse("Permisos insuficientes", 403)

    const signature = body.signatureBase64
    if (signature !== undefined && !validPatientSignature(signature)) {
      return errorResponse("La firma debe ser una imagen PNG, JPG o WEBP válida y menor de 800 KB", 400)
    }
    if (body.comments !== undefined && (typeof body.comments !== "string" || body.comments.length > 10000)) {
      return errorResponse("Comentarios inválidos", 400)
    }
    if (body.commentsToPatient !== undefined && (typeof body.commentsToPatient !== "string" || body.commentsToPatient.length > 10000)) {
      return errorResponse("Comentarios inválidos", 400)
    }
    if (body.doctorId !== undefined && body.doctorId !== null && (typeof body.doctorId !== "string" || body.doctorId.length > 128)) {
      return errorResponse("Profesional inválido", 400)
    }
    if (body.convenio !== undefined && (typeof body.convenio !== "string" || body.convenio.length > 150)) {
      return errorResponse("Convenio inválido", 400)
    }
    if (agreementName !== undefined && (typeof agreementName !== "string" || agreementName.length > 150)) {
      return errorResponse("Convenio inválido", 400)
    }
    if (agreementId !== undefined && agreementId !== null && (typeof agreementId !== "string" || agreementId.length > 128)) {
      return errorResponse("ID de convenio inválido", 400)
    }

    const parsedCollaborators = collaborators === undefined ? undefined : parseCollaborators(collaborators)
    if (parsedCollaborators === null) return errorResponse("Colaboradores inválidos", 400)

    return prisma.$transaction(async tx => {
      const previous = await tx.treatmentPlan.findUnique({
        where: { id },
        include: {
          agreement: true, items: true,
          patient: { select: { isDeleted: true } },
          approvals: { select: { id: true }, take: 1 },
          payments: { select: { id: true }, take: 1 },
        },
      })
      if (!previous || previous.patient.isDeleted) return errorResponse("Plan no encontrado", 404)
      if (user.role === "DOCTOR" && previous.doctorId !== user.id) {
        return errorResponse("No tiene permisos para editar un plan asignado a otro profesional", 403)
      }

      const hasHistory = previous.approvals.length > 0 || previous.payments.length > 0 || Number(previous.totalPaid) !== 0

      if (action === "RESTORE") {
        if (user.role !== "ADMIN") return errorResponse("Solo Administración puede restaurar planes", 403)
        if (previous.status !== "CANCELLED" || hasHistory) {
          return errorResponse("Solo se pueden restaurar planes cancelados sin aprobación ni cobros", 409)
        }
        const changed = await tx.treatmentPlan.updateMany({ where: { id, status: "CANCELLED", totalPaid: 0 }, data: { status: "DRAFT" } })
        if (changed.count !== 1) return errorResponse("El plan cambió; inténtalo nuevamente", 409)
        const restored = await tx.treatmentPlan.findUniqueOrThrow({ where: { id }, include: safeInclude })
        await tx.auditLog.create({ data: {
          userId: user.id, action: "RESTORE_PLAN", entity: "TreatmentPlan", entityId: id, patientId: previous.patientId,
          details: "Restauración de presupuesto cancelado sin aprobación ni cobros",
          oldData: { status: previous.status }, newData: { status: "DRAFT" },
        } })
        return { plan: readablePlan(restored, false) }
      }

      // B2: una aprobación existente o un cobro impiden cualquier edición
      // del presupuesto, incluso si su estado fue alterado externamente.
      if (previous.status !== "DRAFT" || hasHistory) {
        return errorResponse("Presupuesto aprobado, cobrado o no editable. No se permiten cambios", 409)
      }

      if (parsedCollaborators !== undefined) {
        const matched = await tx.user.findMany({
          where: { id: { in: parsedCollaborators }, isActive: true },
          select: { id: true, name: true },
        })
        const names = parsedCollaborators.map(value => matched.find(u => u.id === value)?.name || value)
        const changed = await tx.treatmentPlan.updateMany({ where: { id, status: "DRAFT", totalPaid: 0 }, data: { collaborators: names } })
        if (changed.count !== 1) return errorResponse("El plan cambió; inténtalo nuevamente", 409)
        const updated = await tx.treatmentPlan.findUniqueOrThrow({ where: { id }, include: safeInclude })
        await tx.auditLog.create({ data: {
          userId: user.id, action: "UPDATE_COLLABORATORS", entity: "TreatmentPlan", entityId: id, patientId: previous.patientId,
          details: "Actualización de colaboradores de presupuesto en borrador",
          oldData: { collaborators: previous.collaborators }, newData: { collaborators: names },
        } })
        return { plan: readablePlan(updated, isReception), message: "Colaboradores actualizados con éxito" }
      }

      const newValues: Prisma.TreatmentPlanUncheckedUpdateManyInput = {}
      const selectedAgreementId = agreementId !== undefined ? (agreementId || null) : previous.agreementId
      let selectedAgreement = previous.agreement
      if (agreementId !== undefined) {
        selectedAgreement = selectedAgreementId
          ? await tx.agreement.findUnique({ where: { id: selectedAgreementId as string } })
          : null
        if (selectedAgreementId && !selectedAgreement) return errorResponse("Convenio no encontrado", 400)
        newValues.agreementId = selectedAgreementId as string | null
      }

      const convenio = body.convenio !== undefined ? body.convenio : agreementName
      if (convenio !== undefined && agreementId === undefined && typeof convenio === "string" && convenio.trim()) {
        const matched = await tx.agreement.findFirst({ where: { name: { equals: convenio, mode: "insensitive" } } })
        if (matched) {
          selectedAgreement = matched
          newValues.agreementId = matched.id
        }
      }

      const proposedDiscount = discount !== undefined ? discount : body.commercialDiscount
      const normalizedDiscount = proposedDiscount !== undefined ? Number(proposedDiscount) : Number(previous.commercialDiscount || 0)
      if (!Number.isFinite(normalizedDiscount) || normalizedDiscount < 0 || normalizedDiscount > 100) {
        return errorResponse("Descuento fuera de rango (0-100)", 400)
      }
      if (proposedDiscount !== undefined) newValues.commercialDiscount = normalizedDiscount
      if (body.commentsToPatient !== undefined || body.comments !== undefined) {
        newValues.commentsToPatient = (body.commentsToPatient ?? body.comments) as string
      }
      if (body.doctorId !== undefined) {
        if (body.doctorId) {
          const doctor = await tx.user.findFirst({ where: { id: body.doctorId as string, isActive: true, role: { in: ["DOCTOR", "ADMIN"] } }, select: { id: true } })
          if (!doctor) return errorResponse("El profesional no existe o no está habilitado", 400)
        }
        newValues.doctorId = body.doctorId as string | null
      }

      // Mantener exactamente la fórmula histórica en borradores; no recalcular
      // totales cuando el plan ya fue firmado o cobrado.
      const globalDiscount = normalizedDiscount > 0 ? normalizedDiscount : Number(selectedAgreement?.discountValue || 0)
      const totalCost = previous.items.reduce((sum, item) => {
        const base = Number(item.cost || 0)
        const itemDiscount = Number(item.discount || 0)
        const effective = itemDiscount > 0 ? itemDiscount : globalDiscount
        return sum + Math.max(0, base - base * effective / 100)
      }, 0)
      newValues.totalCost = totalCost

      const changed = await tx.treatmentPlan.updateMany({
        where: { id, status: "DRAFT", totalPaid: 0 },
        data: newValues,
      })
      if (changed.count !== 1) return errorResponse("El plan cambió; inténtalo nuevamente", 409)

      // La firma y el convenio del paciente se guardan exclusivamente en
      // borradores; el hash B2 no se genera aquí.
      const patientUpdate: Prisma.PatientUpdateInput = {}
      if (signature !== undefined) patientUpdate.signatureBase64 = signature
      if (convenio !== undefined && typeof convenio === "string") patientUpdate.convenio = convenio.trim()
      if (Object.keys(patientUpdate).length > 0) {
        await tx.patient.update({ where: { id: previous.patientId }, data: patientUpdate })
      }

      const updated = await tx.treatmentPlan.findUniqueOrThrow({ where: { id }, include: safeInclude })
      await tx.auditLog.create({ data: {
        userId: user.id, action: "UPDATE_PLAN_DATA", entity: "TreatmentPlan", entityId: id, patientId: previous.patientId,
        details: "Actualización de presupuesto en borrador",
        oldData: { status: previous.status, totalCost: previous.totalCost, doctorId: previous.doctorId, agreementId: previous.agreementId, commercialDiscount: previous.commercialDiscount },
        newData: { status: updated.status, totalCost: updated.totalCost, doctorId: updated.doctorId, agreementId: updated.agreementId, commercialDiscount: updated.commercialDiscount, patientSignatureChanged: signature !== undefined },
      } })
      return { plan: readablePlan(updated, isReception) }
    }, { isolationLevel: "Serializable", timeout: 15000 })
  }
)

// ADMIN: anulación lógica de presupuestos sin movimientos financieros;
// eliminación física SOLO de borradores sin evidencia ni historia clínica.
export const DELETE = createApiHandler(
  { roles: ["ADMIN"] },
  async (req, { user, params, searchParams }) => {
    const id = getId(params)
    if (!id || id.length > 128) return errorResponse("ID de plan inválido", 400)
    const permanent = searchParams.get("force") === "true"

    // Motivo obligatorio: imprescindible para la auditoría administrativa.
    const body: unknown = await req.json().catch(() => null)
    const reason = body && typeof body === "object" && "reason" in body &&
      typeof (body as { reason?: unknown }).reason === "string"
      ? (body as { reason: string }).reason.trim()
      : ""
    if (reason.length < 10 || reason.length > 500) {
      return errorResponse("Indica un motivo de entre 10 y 500 caracteres", 400)
    }

    try {
      return await prisma.$transaction(async tx => {
        const plan = await tx.treatmentPlan.findUnique({
          where: { id },
          include: {
            items: { select: { id: true, paidAmount: true, isPaid: true } },
            sections: { select: { id: true } },
            approvals: { select: { id: true }, take: 1 },
            payments: { select: { id: true }, take: 1 },
            clinicalDocuments: { select: { id: true }, take: 1 },
            odontogramRecords: { select: { id: true }, take: 1 },
          },
        })
        if (!plan) return errorResponse("Plan no encontrado", 404)

        // Cualquier movimiento financiero, incluso uno anulado, requiere revisión contable.
        const hasFinancialHistory = plan.payments.length > 0 || Number(plan.totalPaid) !== 0 ||
          plan.items.some(item => Number(item.paidAmount) !== 0 || item.isPaid)
        if (hasFinancialHistory) {
          return errorResponse("El plan tiene cobros o movimientos financieros. Solicita revisión administrativa antes de anularlo.", 409)
        }

        if (permanent) {
          if (plan.status !== "DRAFT" && plan.status !== "CANCELLED") {
            return errorResponse("Solo pueden eliminarse definitivamente borradores sin historial", 409)
          }
          if (plan.approvals.length > 0 || plan.clinicalDocuments.length > 0 || plan.odontogramRecords.length > 0) {
            return errorResponse("Este plan conserva aprobaciones o registros clínicos y no puede eliminarse definitivamente", 409)
          }
          await tx.treatmentItem.deleteMany({ where: { treatmentPlanId: id } })
          await tx.treatmentSection.deleteMany({ where: { treatmentPlanId: id } })
          await tx.treatmentPlan.delete({ where: { id } })
          await tx.auditLog.create({ data: {
            userId: user.id,
            action: "PERMANENT_DELETE_PLAN",
            entity: "TreatmentPlan",
            entityId: id,
            patientId: plan.patientId,
            details: `Borrador eliminado por Administración. Motivo: ${reason}`,
            oldData: { status: plan.status, itemsCount: plan.items.length, sectionsCount: plan.sections.length },
          } })
          return { success: true, message: "Borrador eliminado definitivamente" }
        }

        if (plan.status === "CANCELLED") return errorResponse("Este plan ya está en la papelera", 409)
        // No se borra ni modifica ninguna aprobación, prestación ni documento.
        // Un presupuesto ACTIVE sin pagos se archiva conservando la firma original.
        if (plan.status !== "DRAFT" && plan.status !== "ACTIVE") {
          return errorResponse("Este plan no puede enviarse a la papelera desde su estado actual", 409)
        }
        const updated = await tx.treatmentPlan.updateMany({
          where: { id, status: plan.status, totalPaid: 0 },
          data: { status: "CANCELLED" },
        })
        if (updated.count !== 1) return errorResponse("El plan cambió. Actualiza la pantalla y vuelve a intentarlo", 409)
        await tx.auditLog.create({ data: {
          userId: user.id,
          action: "MOVE_TO_TRASH_PLAN",
          entity: "TreatmentPlan",
          entityId: id,
          patientId: plan.patientId,
          details: `Plan enviado a la papelera por Administración. Motivo: ${reason}`,
          oldData: { status: plan.status },
          newData: { status: "CANCELLED", approvalPreserved: plan.approvals.length > 0 },
        } })
        return { success: true, message: "Plan movido a la papelera (Anulado)" }
      }, { isolationLevel: "Serializable", timeout: 15000 })
    } catch (error: any) {
      if (error?.code === "P2034") return errorResponse("Otra operación modificó el plan. Actualiza y vuelve a intentar", 409)
      throw error
    }
  }
)
