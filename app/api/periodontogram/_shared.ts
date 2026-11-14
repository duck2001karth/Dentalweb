import { Prisma, UserRole } from "@prisma/client"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"

const MAX_JSON_BYTES = 1024 * 1024
const recordDataSchema = z.unknown().refine((value) => {
  if (!value || typeof value !== "object") return false
  try {
    const serialized = JSON.stringify(value)
    return typeof serialized === "string" &&
      serialized.length > 2 &&
      Buffer.byteLength(serialized, "utf8") <= MAX_JSON_BYTES
  } catch {
    return false
  }
}, "Los datos periodontales deben ser JSON válido de hasta 1 MB")

export const createSchema = z.object({
  patientId: z.string().trim().min(1).max(128),
  data: recordDataSchema,
  authorId: z.string().optional(),
}).strip()

export const updateSchema = z.object({
  data: recordDataSchema,
}).strip()

export const updateByIdSchema = updateSchema.extend({
  id: z.string().trim().min(1).max(128),
}).strip()

export function validId(id: unknown): id is string {
  return typeof id === "string" && id.trim().length > 0 && id.length <= 128
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

export async function auditMetadata() {
  const h = await headers()
  return {
    ipAddress: (h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") || "Desconocido").slice(0, 128),
    userAgent: (h.get("user-agent") || "Desconocido").slice(0, 512),
  }
}

export async function updatePeriodontogram(
  id: string,
  value: unknown,
  user: { id: string; role: UserRole },
) {
  if (!validId(id)) return jsonError("ID de evaluación inválido", 400)
  const parsed = updateSchema.safeParse({ data: value })
  if (!parsed.success) return jsonError("Datos periodontales inválidos o demasiado grandes", 422)
  const metadata = await auditMetadata()

  const result = await prisma.$transaction(async (tx) => {
    const previous = await tx.periodontogram.findUnique({
      where: { id },
      select: { id: true, patientId: true, authorId: true, patient: { select: { isDeleted: true } } },
    })
    if (!previous || previous.patient.isDeleted) return { kind: "missing" as const }
    if (user.role !== "ADMIN" && previous.authorId !== user.id) {
      return { kind: "forbidden" as const }
    }

    const update = await tx.periodontogram.updateMany({
      where: { id, ...(user.role === "ADMIN" ? {} : { authorId: user.id }) },
      data: { data: toPrismaJson(parsed.data) },
    })
    if (update.count !== 1) return { kind: "conflict" as const }

    const record = await tx.periodontogram.findUniqueOrThrow({
      where: { id },
      include: { author: { select: { id: true, name: true, image: true } } },
    })
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE_PERIODONTOGRAM",
        entity: "PERIODONTOGRAM",
        entityId: id,
        patientId: previous.patientId,
        details: "Actualización de índices periodontales",
        oldData: { authorId: previous.authorId, hasData: true },
        newData: { updated: true },
        ...metadata,
      },
    })
    return { kind: "ok" as const, record }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

  if (result.kind === "missing") return jsonError("Evaluación no encontrada", 404)
  if (result.kind === "forbidden") return jsonError("No tiene permisos para modificar esta evaluación", 403)
  if (result.kind === "conflict") return jsonError("No fue posible actualizar la evaluación", 409)
  return NextResponse.json(result.record)
}

export async function deletePeriodontogram(id: string, user: { id: string; role: UserRole }) {
  if (!validId(id)) return jsonError("ID de evaluación inválido", 400)
  if (user.role !== "ADMIN") return jsonError("Solo Administración puede eliminar evaluaciones", 403)
  const metadata = await auditMetadata()

  const result = await prisma.$transaction(async (tx) => {
    const previous = await tx.periodontogram.findUnique({
      where: { id },
      select: {
        id: true, patientId: true, authorId: true, createdAt: true,
        patient: { select: { isDeleted: true } },
      },
    })
    if (!previous || previous.patient.isDeleted) return { kind: "missing" as const }

    const deleted = await tx.periodontogram.deleteMany({ where: { id } })
    if (deleted.count !== 1) return { kind: "missing" as const }
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE_PERIODONTOGRAM",
        entity: "PERIODONTOGRAM",
        entityId: id,
        patientId: previous.patientId,
        details: "Eliminación administrativa de evaluación periodontal",
        oldData: {
          authorId: previous.authorId,
          createdAt: previous.createdAt.toISOString(),
          hasData: true,
        },
        ...metadata,
      },
    })
    return { kind: "ok" as const }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

  if (result.kind === "missing") return jsonError("Evaluación no encontrada", 404)
  return NextResponse.json({ success: true, message: "Evaluación periodontal eliminada correctamente" })
}
