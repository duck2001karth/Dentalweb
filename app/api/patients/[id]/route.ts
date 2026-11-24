import { createApiHandler, ApiError } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { patientAdministrativeSelect } from "@/app/api/patients/patient-select"
import { patientFields, readPatientInput, dateOrNull } from "@/lib/server/patient-validation"
import { documentTypeError } from "@/lib/patient-registration"

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
    if (!result.success) return NextResponse.json({ error: "Revise los datos del paciente", fields: result.error.flatten().fieldErrors }, { status: 422 })
    const { rut, birthDate, ...fields } = result.data
    if (rut !== undefined) return NextResponse.json({ error: "Utilice ci para modificar identificación" }, { status: 422 })
    if (user.role === "RECEPTIONIST" && (fields.medicalAlerts !== undefined || fields.observaciones !== undefined)) {
      return NextResponse.json({ error: "Las alertas existentes y observaciones clínicas requieren autorización del equipo clínico" }, { status: 403 })
    }
    const changes = { ...fields, ...(birthDate !== undefined ? { birthDate: dateOrNull(birthDate) } : {}) }
    if (!Object.keys(changes).length) return NextResponse.json({ error: "No hay cambios" }, { status: 422 })
    const h = await headers()
    try {
      const resultTx = await prisma.$transaction(async tx => {
        const previous = await tx.patient.findFirst({ where: { id, isDeleted: false } })
        if (!previous) return null
        if (fields.ci !== undefined || fields.tipoIdentificacion !== undefined) {
          const type = fields.tipoIdentificacion === undefined ? previous.tipoIdentificacion : fields.tipoIdentificacion
          const documentError = documentTypeError(type, fields.ci ?? previous.ci)
          if (documentError) throw new ApiError(documentError, 422)
        }
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
        const safe = await prisma.patient.findUnique({ where: { id }, select: patientAdministrativeSelect })
        return { patient: safe }
      }
      return { patient: resultTx }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return NextResponse.json({ error: "Ya existe un paciente registrado con esa identificación", fields: { ci: ["Documento duplicado"] } }, { status: 409 })
      }
      throw error
    }
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
