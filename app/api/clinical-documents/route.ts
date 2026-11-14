import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { sanitizeRichHTML, escapeHTML } from "@/lib/sanitize"

const identifier = z.string().trim().min(1).max(128)

const createDocumentSchema = z.object({
  patientId: identifier,
  treatmentPlanId: identifier.nullish(),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(100_000),
  specialistName: z.string().trim().max(200).nullish(),
  specialistIdDoc: z.string().trim().max(100).nullish(),
  doctorSignature: z.string().nullish(),
  patientSignature: z.string().max(3_000_000).nullish(),
  authorId: identifier.optional(),
  isVoided: z.boolean().optional(),
}).passthrough()

function validPatientSignature(value: string): boolean {
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(value)
  if (!match) return false
  const encoded = match[2]
  if (encoded.length % 4 !== 0) return false
  const bytes = Buffer.from(encoded, "base64")
  if (bytes.length < 12 || bytes.length > 2_000_000) return false
  const mime = match[1].toLowerCase()
  if (mime === "png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (mime === "jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
}

async function requestMetadata() {
  const h = await headers()
  return {
    ipAddress: (h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "Desconocido").slice(0, 128),
    userAgent: (h.get("user-agent") || "Desconocido").slice(0, 512),
  }
}

const documentSelect = {
  id: true,
  patientId: true,
  treatmentPlanId: true,
  title: true,
  content: true,
  specialistName: true,
  specialistIdDoc: true,
  doctorSignature: true,
  patientSignature: true,
  isVoided: true,
  createdAt: true,
  authorId: true,
  author: { select: { id: true, name: true, image: true } },
} as const

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { user, searchParams }) => {
    const patientId = searchParams.get("patientId")?.trim() || ""
    const treatmentPlanId = searchParams.get("treatmentPlanId")?.trim() || null

    if (!identifier.safeParse(patientId).success ||
        (treatmentPlanId !== null && !identifier.safeParse(treatmentPlanId).success)) {
      return NextResponse.json({ error: "Identificador inválido" }, { status: 400 })
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, isDeleted: false },
      select: { id: true },
    })
    if (!patient) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

    if (treatmentPlanId) {
      const plan = await prisma.treatmentPlan.findFirst({
        where: { id: treatmentPlanId, patientId },
        select: { id: true },
      })
      if (!plan) return NextResponse.json({ error: "El plan no corresponde al paciente" }, { status: 404 })
    }

    const docs = await prisma.clinicalDocument.findMany({
      where: {
        patientId,
        ...(treatmentPlanId ? { treatmentPlanId } : {}),
      },
      select: documentSelect,
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    if (user.role === "RECEPTIONIST") {
      return docs.map(({ content, doctorSignature, patientSignature, specialistIdDoc, ...doc }) => doc)
    }

    return docs
  }
)

export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"], schema: createDocumentSchema },
  async (_req, { user, data }) => {
    const input = createDocumentSchema.parse(data)
    if (input.authorId && input.authorId !== user.id) {
      return NextResponse.json({ error: "No puede atribuir el documento a otro usuario" }, { status: 403 })
    }
    if (input.isVoided === true) {
      return NextResponse.json({ error: "Un documento nuevo no puede nacer anulado" }, { status: 400 })
    }

    const cleanTitle = escapeHTML(input.title)
    const cleanContent = sanitizeRichHTML(input.content)
    if (!cleanTitle.trim() || !cleanContent.trim()) {
      return NextResponse.json({ error: "Título o contenido inválidos" }, { status: 400 })
    }

    if (input.patientSignature && !validPatientSignature(input.patientSignature)) {
      return NextResponse.json({ error: "Formato de firma del paciente no permitido" }, { status: 400 })
    }

    const metadata = await requestMetadata()

    const result = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findFirst({
        where: { id: input.patientId, isDeleted: false },
        select: { id: true },
      })
      if (!patient) return { kind: "patient-not-found" as const }

      if (input.treatmentPlanId) {
        const plan = await tx.treatmentPlan.findFirst({
          where: { id: input.treatmentPlanId, patientId: patient.id },
          select: { id: true },
        })
        if (!plan) return { kind: "plan-not-found" as const }
      }

      const currentAuthor = await tx.user.findFirst({
        where: { id: user.id, isActive: true },
        select: { id: true, name: true, signatureBase64: true, professionalCard: true },
      })
      if (!currentAuthor) return { kind: "forbidden" as const }
      if (input.doctorSignature && input.doctorSignature !== currentAuthor.signatureBase64) {
        return { kind: "invalid-doctor-signature" as const }
      }

      const created = await tx.clinicalDocument.create({
        data: {
          patientId: patient.id,
          treatmentPlanId: input.treatmentPlanId || null,
          title: cleanTitle,
          content: cleanContent,
          specialistName: currentAuthor.name || null,
          specialistIdDoc: currentAuthor.professionalCard || null,
          doctorSignature: input.doctorSignature ? currentAuthor.signatureBase64 : null,
          patientSignature: input.patientSignature || null,
          isVoided: false,
          authorId: user.id,
        },
        select: documentSelect,
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_CLINICAL_DOCUMENT",
          entity: "CLINICAL_DOCUMENT",
          entityId: created.id,
          patientId: patient.id,
          details: "Creación de documento clínico",
          newData: {
            treatmentPlanId: created.treatmentPlanId,
            hasDoctorSignature: Boolean(created.doctorSignature),
            hasPatientSignature: Boolean(created.patientSignature),
            isVoided: false,
          },
          ...metadata,
        },
      })

      return { kind: "ok" as const, document: created }
    })

    if (result.kind === "patient-not-found") {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
    }
    if (result.kind === "plan-not-found") {
      return NextResponse.json({ error: "El plan no corresponde al paciente" }, { status: 400 })
    }
    if (result.kind === "forbidden") {
      return NextResponse.json({ error: "Usuario desactivado o no disponible" }, { status: 403 })
    }
    if (result.kind === "invalid-doctor-signature") {
      return NextResponse.json({ error: "La firma profesional no coincide con la firma guardada" }, { status: 400 })
    }

    return result.document
  }
)
