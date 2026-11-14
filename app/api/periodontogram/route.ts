import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import {
  auditMetadata, createSchema, deletePeriodontogram, jsonError,
  toPrismaJson, updateByIdSchema, updatePeriodontogram, validId,
} from "./_shared"

// GET /api/periodontogram?patientId=...
export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (_req, { searchParams }) => {
    const patientId = searchParams.get("patientId")?.trim()
    if (!validId(patientId)) return jsonError("Falta un ID de paciente válido", 400)

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, isDeleted: false },
      select: { id: true },
    })
    if (!patient) return jsonError("Paciente no encontrado", 404)

    const records = await prisma.periodontogram.findMany({
      where: { patientId },
      include: { author: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    })
    // Se conserva el arreglo original para no romper el frontend.
    return records
  },
)

// POST /api/periodontogram. Compatible con {patientId,data,authorId}.
export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"], schema: createSchema },
  async (_req, { user, data }) => {
    const input = createSchema.parse(data)
    const patient = await prisma.patient.findFirst({
      where: { id: input.patientId, isDeleted: false }, select: { id: true },
    })
    if (!patient) return jsonError("Paciente no encontrado", 404)

    const metadata = await auditMetadata()
    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.periodontogram.create({
        data: {
          patientId: input.patientId,
          data: toPrismaJson(input.data),
          authorId: user.id, // La identidad nunca procede del navegador.
        },
        include: { author: { select: { id: true, name: true, image: true } } },
      })
      await tx.auditLog.create({ data: {
        userId: user.id,
        action: "CREATE_PERIODONTOGRAM",
        entity: "PERIODONTOGRAM",
        entityId: created.id,
        patientId: input.patientId,
        details: "Registro inicial de evaluación periodontal",
        newData: { authorId: user.id, hasData: true },
        ...metadata,
      } })
      return created
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    return NextResponse.json(record, { status: 201 })
  },
)

// Compatibilidad con clientes antiguos: PUT /api/periodontogram {id,data}
export const PUT = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"], schema: updateByIdSchema },
  async (_req, { user, data }) => {
    const input = updateByIdSchema.parse(data)
    return updatePeriodontogram(input.id, input.data, user)
  },
)

// Compatibilidad con clientes antiguos: DELETE /api/periodontogram?id=...
export const DELETE = createApiHandler(
  { roles: ["ADMIN"] },
  async (_req, { user, searchParams }) => {
    const id = searchParams.get("id")
    if (!validId(id)) return jsonError("ID de evaluación requerido", 400)
    return deletePeriodontogram(id, user)
  },
)
