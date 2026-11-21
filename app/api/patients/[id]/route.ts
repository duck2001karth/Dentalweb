import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { patientAdministrativeSelect } from "@/app/api/patients/patient-select"
import { patientFields, readPatientInput, dateOrNull } from "@/lib/server/patient-validation"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { params, user }) => {
    const patient = await prisma.patient.findFirst({
      where: { id: params.id as string, isDeleted: false },
      ...(user.role === "RECEPTIONIST" ? { select: patientAdministrativeSelect } : {}),
    })
    if (!patient) throw new Error("NOT_FOUND")
    return { patient }
  },
)

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: z.unknown() },
  async (_req, { params, user, data }) => {
    const id = params.id as string
    const result = patientFields.partial().safeParse(readPatientInput(data))
    if (!result.success) return NextResponse.json({ error: "Datos inválidos", fields: result.error.flatten().fieldErrors }, { status: 422 })
    const { rut, birthDate, ...fields } = result.data
    if (rut !== undefined) return NextResponse.json({ error: "Utilice ci para modificar identificación" }, { status: 422 })
    if (user.role === "RECEPTIONIST" && (fields.medicalAlerts !== undefined || fields.observaciones !== undefined)) {
      return NextResponse.json({ error: "Recepción no puede modificar datos clínicos" }, { status: 403 })
    }
    const changes = { ...fields, ...(birthDate !== undefined ? { birthDate: dateOrNull(birthDate) } : {}) }
    if (!Object.keys(changes).length) return NextResponse.json({ error: "No hay cambios" }, { status: 422 })
    const h = await headers()
    const resultTx = await prisma.$transaction(async tx => {
      const previous = await tx.patient.findFirst({ where: { id, isDeleted: false } })
      if (!previous) return null
      const updated = await tx.patient.update({ where: { id }, data: changes })
      const changedFields = Object.keys(changes).filter(k => JSON.stringify((previous as any)[k]) !== JSON.stringify((updated as any)[k]))
      await tx.auditLog.create({ data: {
        userId: user.id, action: "UPDATE_PATIENT", entity: "PATIENT", entityId: id, patientId: id,
        details: `Cambios en paciente: ${changedFields.join(", ")}`,
        oldData: { changedFields }, newData: { changedFields },
        ipAddress: (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "Desconocido").slice(0,128),
        userAgent: (h.get("user-agent") || "Desconocido").slice(0,512),
      } })
      return updated
    })
    if (!resultTx) throw new Error("NOT_FOUND")
    if (user.role === "RECEPTIONIST") {
      // La selección de datos de recepción debe ser igual que en GET, sin filtrado manual incompleto.
      const safe = await prisma.patient.findUnique({ where: { id }, select: patientAdministrativeSelect })
      return { patient: safe }
    }
    return { patient: resultTx }
  },
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN"] },
  async (_req, { params, user }) => {
    const id = params.id as string
    await prisma.$transaction(async tx => {
      const patient = await tx.patient.findFirst({ where: { id, isDeleted: false } })
      if (!patient) throw new Error("NOT_FOUND")
      await tx.patient.update({ where: { id }, data: { isDeleted: true } })
      await tx.auditLog.create({ data: { userId: user.id, action: "DELETE_PATIENT", entity: "PATIENT", entityId: id,
        patientId: id, details: "Paciente desactivado (eliminación lógica)", oldData: { isDeleted: false }, newData: { isDeleted: true } } })
    })
    return { success: true }
  },
)
