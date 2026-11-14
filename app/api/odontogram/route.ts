import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"


const createRecordSchema = z.object({
  patientId: z.string().trim().min(1).max(128),
  planId: z.string().trim().max(128).nullable().optional(),
  toothNumber: z.union([z.string(), z.number()]),
  surfaces: z.union([z.string(), z.array(z.string())]),
  status: z.string().trim().min(1).max(100),
  isEvolution: z.boolean().optional(),
  authorId: z.string().optional(), 
  notes: z.string().max(10000).nullable().optional(),
  comments: z.string().max(10000).nullable().optional(),
})

const updateRecordSchema = z.object({
  id: z.string().trim().min(1).max(128),
  notes: z.string().max(10000).nullable(),
})

function parseToothNumber(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null
  const text = String(value).trim()
  if (!/^\d{1,2}$/.test(text)) return null
  const result = Number(text)
  return Number.isSafeInteger(result) && result >= 1 && result <= 99 ? result : null
}

function normalizeSurfaces(value: string | string[]): string[] | null {
  const arr = Array.isArray(value) ? value : [value]
  if (arr.length === 0 || arr.length > 10) return null
  const normalized = arr.map((s) => s.trim())
  if (normalized.some((s) => s.length === 0 || s.length > 80)) return null
  return normalized
}

async function getAuditMetadata() {
  const h = await headers()
  return {
    ipAddress: (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "Desconocido").slice(0, 128),
    userAgent: (h.get("user-agent") || "Desconocido").slice(0, 512),
  }
}

const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 })
const notFound = () => NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
const forbidden = () => NextResponse.json({ error: "No tiene permisos para modificar este registro" }, { status: 403 })
const protectedPlan = () => NextResponse.json(
  { error: "No se pueden eliminar registros del odontograma vinculados a un plan aprobado o finalizado." },
  { status: 409 }
)

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { user, searchParams }) => {
    const patientId = searchParams.get("patientId")?.trim() || ""
    if (!patientId || patientId.length > 128) return badRequest("ID de paciente inválido")

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, isDeleted: false },
      select: { id: true },
    })
    if (!patient) return notFound()

    const isReception = user.role === "RECEPTIONIST"
    const records = await prisma.odontogramRecord.findMany({
      where: { patientId },
      select: {
        id: true,
        patientId: true,
        planId: true,
        toothNumber: true,
        surfaces: true,
        status: true,
        isEvolution: true,
        createdAt: true,
        ...(!isReception ? { notes: true } : {}),
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    if (isReception) return records.map((record) => ({ ...record, notes: null }))
    return records
  }
)

export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"], schema: createRecordSchema },
  async (_req, { user, data }) => {
    const toothNumber = parseToothNumber(data.toothNumber)
    const surfaces = normalizeSurfaces(data.surfaces)
    if (toothNumber === null) return badRequest("Número de pieza dental inválido")
    if (!surfaces) return badRequest("Superficies dentales inválidas")
    if (data.authorId && data.authorId !== user.id) {
      return forbidden()
    }

    const metadata = await getAuditMetadata()
    const result = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findFirst({
        where: { id: data.patientId, isDeleted: false }, select: { id: true },
      })
      if (!patient) return { kind: "not-found" as const }

      if (data.planId) {
        const plan = await tx.treatmentPlan.findFirst({
          where: { id: data.planId, patientId: data.patientId },
          select: { id: true },
        })
        if (!plan) return { kind: "bad-plan" as const }
      }

      const record = await tx.odontogramRecord.create({
        data: {
          patientId: data.patientId,
          planId: data.planId || null,
          toothNumber,
          surfaces,
          status: data.status,
          notes: data.notes ?? data.comments ?? null,
          isEvolution: data.isEvolution ?? false,
          authorId: user.id,
        },
        include: { author: { select: { id: true, name: true, image: true } } },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_ODONTOGRAM_RECORD",
          entity: "ODONTOGRAM",
          entityId: record.id,
          patientId: data.patientId,
          details: `Registro odontológico en pieza #${record.toothNumber}`,
          newData: {
            toothNumber: record.toothNumber,
            surfaces: record.surfaces,
            status: record.status,
            isEvolution: record.isEvolution,
            hasNotes: Boolean(record.notes),
            planId: record.planId,
          },
          ...metadata,
        },
      })
      return { kind: "ok" as const, record }
    })

    if (result.kind === "not-found") return notFound()
    if (result.kind === "bad-plan") return badRequest("El plan no corresponde al paciente")
    return result.record
  }
)

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"], schema: updateRecordSchema },
  async (_req, { user, data }) => {
    const metadata = await getAuditMetadata()
    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.odontogramRecord.findUnique({
        where: { id: data.id },
        include: { patient: { select: { isDeleted: true } } },
      })
      if (!previous || previous.patient.isDeleted) return { kind: "not-found" as const }
      if (user.role !== "ADMIN" && previous.authorId !== user.id) {
        return { kind: "forbidden" as const }
      }

      const updated = await tx.odontogramRecord.update({
        where: { id: data.id },
        data: { notes: data.notes },
        include: { author: { select: { id: true, name: true, image: true } } },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_ODONTOGRAM_RECORD",
          entity: "ODONTOGRAM",
          entityId: data.id,
          patientId: previous.patientId,
          details: `Actualización de observación en pieza #${previous.toothNumber}`,
          oldData: { hasNotes: Boolean(previous.notes) },
          newData: { hasNotes: Boolean(updated.notes) },
          ...metadata,
        },
      })
      return { kind: "ok" as const, record: updated }
    })

    if (result.kind === "not-found") return notFound()
    if (result.kind === "forbidden") return forbidden()
    return { success: true, record: result.record }
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (_req, { user, searchParams }) => {
    const id = searchParams.get("id")?.trim() || ""
    const patientId = searchParams.get("patientId")?.trim() || ""
    const toothText = searchParams.get("toothNumber")
    if (id.length > 128 || patientId.length > 128) return badRequest("Identificador inválido")
    if (!id && (!patientId || toothText === null)) {
      return badRequest("Faltan parámetros de eliminación")
    }
    const toothNumber = id ? null : parseToothNumber(toothText)
    if (!id && toothNumber === null) return badRequest("Número de pieza dental inválido")

    const metadata = await getAuditMetadata()
    const result = await prisma.$transaction(async (tx) => {
      const records = id
        ? await tx.odontogramRecord.findMany({
            where: { id }, include: { patient: { select: { isDeleted: true } } },
          })
        : await tx.odontogramRecord.findMany({
            where: { patientId, toothNumber: toothNumber! },
            include: { patient: { select: { isDeleted: true } } },
          })

      if (!records.length || records.some((r) => r.patient.isDeleted)) {
        return { kind: "not-found" as const }
      }
      if (user.role !== "ADMIN" && records.some((r) => r.authorId !== user.id)) {
        return { kind: "forbidden" as const }
      }

      const planIds = [...new Set(records.map((r) => r.planId).filter((x): x is string => Boolean(x)))]
      if (planIds.length > 0) {
        const lockedPlans = await tx.treatmentPlan.count({
          where: {
            id: { in: planIds },
            OR: [
              { status: { in: ["ACTIVE", "COMPLETED"] } },
              { approvals: { some: {} } },
            ],
          },
        })
        if (lockedPlans > 0) return { kind: "locked" as const }
      }

      const ids = records.map((r) => r.id)
      await tx.odontogramRecord.deleteMany({ where: { id: { in: ids } } })
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: id ? "DELETE_ODONTOGRAM_RECORD" : "CLEAR_ODONTOGRAM_TOOTH",
          entity: "ODONTOGRAM",
          entityId: id || `TOOTH-${toothNumber}`,
          patientId: records[0].patientId,
          details: id
            ? `Eliminación de registro odontológico en pieza #${records[0].toothNumber}`
            : `Saneamiento de pieza #${toothNumber} (${records.length} registros)`,
          oldData: {
            recordIds: ids,
            toothNumber: records[0].toothNumber,
            recordCount: records.length,
          },
          ...metadata,
        },
      })
      return { kind: "ok" as const }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    if (result.kind === "not-found") return notFound()
    if (result.kind === "forbidden") return forbidden()
    if (result.kind === "locked") return protectedPlan()
    return { success: true, message: id ? "Registro eliminado y auditado" : "Pieza saneada" }
  }
)
