import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

// Se acepta tanto el cuerpo directo como { input: ... } para conservar
// la compatibilidad con los formularios actuales.
const prescriptionFields = z.object({
  patientId: z.string().trim().min(1).max(128),
  medications: z.string().trim().min(1).max(10000),
  indications: z.string().trim().min(1).max(10000),
  observations: z.string().max(10000).nullish(),
  // Campos heredados: se aceptan, pero NO se usan para atribuir
  // una receta ni para escoger una firma digital.
  authorId: z.string().optional(),
  doctorSignature: z.string().nullable().optional(),
})

const prescriptionSchema = z.union([
  prescriptionFields,
  z.object({ input: prescriptionFields }),
])

function boundedInt(value: string | null, fallback: number, max: number): number | null {
  if (value === null) return fallback
  if (!/^[1-9]\d*$/.test(value)) return null
  const n = Number(value)
  return Number.isSafeInteger(n) && n <= max ? n : null
}

// El listado clínico completo solo se entrega a personal clínico autorizado.
export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { user, searchParams }) => {
    const patientId = searchParams.get("patientId")?.trim()
    const page = boundedInt(searchParams.get("page"), 1, 10000)
    const limit = boundedInt(searchParams.get("limit"), 100, 200)

    if (!patientId || patientId.length > 128 || page === null || limit === null) {
      return NextResponse.json({ error: "Parámetros de consulta inválidos" }, { status: 400 })
    }

    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId,
        ...(user.role === "RECEPTIONIST" ? { AND: [{ doctorSignature: { not: null } }, { doctorSignature: { not: "" } }] } : {}),
        patient: { is: { isDeleted: false } },
      },
      select: {
        id: true,
        patientId: true,
        authorId: true,
        medications: true,
        indications: true,
        observations: true,
        doctorSignature: true, // Firma conservada en el documento al crearlo.
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            specialty: true,
            professionalCard: true,
            // Nunca incluir la firma actual del perfil del profesional.
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    })

    // No se añade una firma de perfil a recetas antiguas sin firma:
    // hacerlo presentaría retrospectivamente un documento como firmado.
    return prescriptions.map((prescription) => ({
      ...prescription,
      doctorLicense: prescription.author?.professionalCard || "",
    }))
  }
)

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: prescriptionSchema,
  },
  async (_req, { user, data }) => {
    const input = "input" in data ? data.input : data
    const { patientId, medications, indications, observations } = input

    const h = await headers()
    // IP de apoyo a la auditoría, no como identidad/autorización.
    const ipAddress =
      h.get("x-forwarded-for")?.split(",")[0].trim().slice(0, 128) ||
      h.get("x-real-ip")?.slice(0, 128) ||
      "Desconocido"
    const userAgent = (h.get("user-agent") || "Desconocido").slice(0, 512)

    const created = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findFirst({
        where: { id: patientId, isDeleted: false },
        select: { id: true },
      })
      if (!patient) {
        return { error: "Paciente no encontrado o inactivo", status: 404 } as const
      }

      const author = await tx.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          isActive: true,
          role: true,
          name: true,
          specialty: true,
          professionalCard: true,
          signatureBase64: true,
        },
      })

      if (!author?.isActive || !["ADMIN", "DOCTOR"].includes(author.role)) {
        return { error: "Usuario sin autorización para emitir recetas", status: 403 } as const
      }

      // Firma solo de la cuenta autenticada, nunca del cuerpo enviado.
      const prescription = await tx.prescription.create({
        data: {
          patientId,
          medications,
          indications,
          observations: observations ?? null,
          authorId: author.id,
          doctorSignature: author.signatureBase64 || null,
        },
        select: {
          id: true,
          patientId: true,
          authorId: true,
          medications: true,
          indications: true,
          observations: true,
          doctorSignature: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      // La auditoría registra el evento, pero no duplica la receta clínica.
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_PRESCRIPTION",
          entity: "PRESCRIPTION",
          entityId: prescription.id,
          patientId,
          details: "Emisión de receta médica/odontológica",
          newData: {
            authorId: author.id,
            hasDoctorSignature: Boolean(prescription.doctorSignature),
          },
          ipAddress,
          userAgent,
        },
      })

      return {
        ...prescription,
        author: {
          id: author.id,
          name: author.name,
          specialty: author.specialty,
          professionalCard: author.professionalCard,
        },
        doctorLicense: author.professionalCard || "",
      }
    })

    if ("error" in created) {
      return NextResponse.json({ error: created.error }, { status: created.status })
    }

    return created
  }
)
