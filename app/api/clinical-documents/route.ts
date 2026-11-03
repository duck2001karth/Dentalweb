import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"
import { sanitizeRichHTML, escapeHTML } from "@/lib/sanitize"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { searchParams }) => {
    const patientId = searchParams.get("patientId")
    if (!patientId) throw new Error("Falta el ID del paciente")

    const treatmentPlanId = searchParams.get("treatmentPlanId")
    if (treatmentPlanId) {
      const plan = await prisma.treatmentPlan.findFirst({
        where: { id: treatmentPlanId, patientId },
        select: { id: true },
      })
      if (!plan) throw new Error("El plan no corresponde al paciente")
    }

    const docs = await prisma.clinicalDocument.findMany({
      where: { patientId, ...(treatmentPlanId ? { treatmentPlanId } : {}) },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return docs
  }
)

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: z.any(),
  },
  async (req, { user, data }) => {
    const {
      patientId,
      treatmentPlanId,
      title,
      content,
      specialistName,
      specialistIdDoc,
      doctorSignature,
      patientSignature,
      isVoided,
      authorId,
    } = data

    if (!patientId || !title || !content) {
      throw new Error("Faltan datos obligatorios (paciente, título o contenido)")
    }

    const cleanTitle = escapeHTML(title)
    const cleanContent = sanitizeRichHTML(content)
    const cleanSpecialistName = specialistName ? escapeHTML(specialistName) : null

    const currentAuthorId = authorId || user.id

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const document = await prisma.$transaction(async (tx) => {
      if (treatmentPlanId) {
        const plan = await tx.treatmentPlan.findFirst({
          where: { id: treatmentPlanId, patientId },
          select: { id: true },
        })
        if (!plan) throw new Error("El plan no corresponde al paciente")
      }
      const created = await tx.clinicalDocument.create({
        data: {
          patientId,
          treatmentPlanId: treatmentPlanId || null,
          title: cleanTitle,
          content: cleanContent,
          specialistName: cleanSpecialistName,
          specialistIdDoc: specialistIdDoc || null,
          doctorSignature: doctorSignature || null,
          patientSignature: patientSignature || null,
          isVoided: Boolean(isVoided),
          authorId: currentAuthorId,
        },
        include: {
          author: { select: { id: true, name: true } },
        },
      })

      await tx.auditLog.create({
        data: {
          userId: currentAuthorId,
          action: "CREATE_CLINICAL_DOCUMENT",
          entity: "CLINICAL_DOCUMENT",
          entityId: created.id,
          patientId,
          details: `Creación de documento legal/clínico: "${created.title}"`,
          newData: {
            title: created.title,
            treatmentPlanId: created.treatmentPlanId,
            specialistName: created.specialistName,
            hasDoctorSignature: Boolean(created.doctorSignature),
            hasPatientSignature: Boolean(created.patientSignature),
            isVoided: created.isVoided,
          },
          ipAddress,
          userAgent,
        },
      })

      return created
    })

    return document
  }
)