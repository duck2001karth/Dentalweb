import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { patientAdministrativeSelect } from "./patient-select"
import { createPatientFields, readPatientInput, dateOrNull } from "@/lib/server/patient-validation"
import { NextResponse } from "next/server"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { searchParams, user }) => {
    const search = (searchParams.get("search") || "").trim().slice(0, 120)
    const terms = search.split(/\s+/).filter(Boolean)
    const ci = searchParams.get("ci")?.trim()
    const whereClause = {
      isDeleted: false,
      ...(ci ? { ci } : {}),
      ...(terms.length ? { AND: terms.map(term => ({ OR: [
        { firstName: { contains: term, mode: "insensitive" as const } },
        { lastName: { contains: term, mode: "insensitive" as const } },
        { ci: { contains: term, mode: "insensitive" as const } },
      ] })) } : {}),
    }
    const parsedPage = Number(searchParams.get("page") ?? 1)
    const limit = Number(searchParams.get("limit") ?? (search ? 20 : 50))
    if (!Number.isSafeInteger(parsedPage) || parsedPage < 1 || parsedPage > 100000 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: "Paginación inválida" }, { status: 400 })
    }
    const skip = (parsedPage - 1) * limit
    const canViewMedicalAlerts = user.role === "ADMIN" || user.role === "DOCTOR"
    const [rows, total, totalPatients] = await prisma.$transaction([
      prisma.patient.findMany({ where: whereClause, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip, take: limit, select: { ...patientAdministrativeSelect, medicalAlerts: true } }),
      prisma.patient.count({ where: whereClause }),
      prisma.patient.count({ where: { isDeleted: false } }),
    ])
    const patients = rows.map(({ medicalAlerts, ...patient }) => ({
      ...patient,
      ...(canViewMedicalAlerts ? { hasMedicalAlerts: Boolean(medicalAlerts?.trim()) } : {}),
    }))
    return { patients, total, totalPatients, canViewMedicalAlerts, pagination: { page: parsedPage, limit, totalPages: Math.ceil(total/limit), hasNextPage: skip + patients.length < total } }
  },
)

export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: z.unknown() },
  async (_req, { user, data }) => {
    const result = createPatientFields.safeParse(readPatientInput(data))
    if (!result.success) return NextResponse.json({ error: "Revise los datos del paciente", fields: result.error.flatten().fieldErrors }, { status: 422 })
    const input = result.data
    const { rut, birthDate, ...fields } = input
    if (user.role === "RECEPTIONIST" && fields.observaciones != null && fields.observaciones !== "") {
      return NextResponse.json({ error: "Recepción no puede registrar observaciones clínicas profesionales" }, { status: 403 })
    }
    try {
      const patient = await prisma.$transaction(async tx => {
        const created = await tx.patient.create({ data: {
          ...fields,
          ...(user.role === "RECEPTIONIST" ? { observaciones: null } : {}),
          firstName: input.firstName!, lastName: input.lastName!, ci: (input.ci || rut)!,
          birthDate: dateOrNull(birthDate),
        }, select: patientAdministrativeSelect })
        await tx.auditLog.create({ data: { userId: user.id, action: "CREATE_PATIENT", entity: "PATIENT", entityId: created.id,
          patientId: created.id, details: "Paciente registrado", newData: { id: created.id } } })
        return created
      })
      return NextResponse.json({ patient }, { status: 201 })
    } catch (error: unknown) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return NextResponse.json({ error: "Ya existe un paciente registrado con esa identificación", fields: { ci: ["Documento duplicado"] } }, { status: 409 })
      }
      throw error
    }
  },
)
