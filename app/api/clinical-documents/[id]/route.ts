import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { sanitizeRichHTML, escapeHTML } from "@/lib/sanitize"

export const PUT = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: z.any(),
  },
  async (req, { user, params, data }) => {
    const id = params.id as string
    if (!id) throw new Error("Falta el ID del documento")

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updatedDoc = await prisma.$transaction(async (tx) => {
      const previous = await tx.clinicalDocument.findUnique({ where: { id } })

      if (!previous) throw new Error("NOT_FOUND")
      if (previous.isVoided) return NextResponse.json({ error: "El documento está anulado" }, { status: 409 })
      if (previous.patientSignature || previous.doctorSignature) {
        return NextResponse.json({ error: "Un documento firmado es inmutable; cree una nueva versión" }, { status: 409 })
      }

      const cleanTitle = data.title !== undefined ? escapeHTML(data.title) : previous.title
      const cleanContent = data.content !== undefined ? sanitizeRichHTML(data.content) : previous.content
      const cleanSpecialistName =
        data.specialistName !== undefined ? escapeHTML(data.specialistName) : previous.specialistName

      const doc = await tx.clinicalDocument.update({
        where: { id },
        data: {
          title: cleanTitle,
          content: cleanContent,
          specialistName: cleanSpecialistName,
          specialistIdDoc: data.specialistIdDoc !== undefined ? data.specialistIdDoc : previous.specialistIdDoc,
          doctorSignature: data.doctorSignature !== undefined ? data.doctorSignature : previous.doctorSignature,
          patientSignature: data.patientSignature !== undefined ? data.patientSignature : previous.patientSignature,
        },
        include: {
          author: { select: { id: true, name: true } },
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_CLINICAL_DOCUMENT",
          entity: "CLINICAL_DOCUMENT",
          entityId: id,
          patientId: previous.patientId,
          details: `Actualización de documento clínico: "${doc.title}"`,
          oldData: {
            title: previous.title,
            hasDoctorSignature: Boolean(previous.doctorSignature),
            hasPatientSignature: Boolean(previous.patientSignature),
          },
          newData: {
            title: doc.title,
            hasDoctorSignature: Boolean(doc.doctorSignature),
            hasPatientSignature: Boolean(doc.patientSignature),
          },
          ipAddress,
          userAgent,
        },
      })

      return doc
    })

    return updatedDoc
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (req, { user, params }) => {
    const id = params.id as string
    if (!id) throw new Error("Falta el ID del documento")

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const previous = await tx.clinicalDocument.findUnique({ where: { id } })
      if (!previous) throw new Error("NOT_FOUND")
      if (previous.isVoided) return NextResponse.json({ error: "Documento ya anulado" }, { status: 409 })

      await tx.clinicalDocument.update({
        where: { id },
        data: { isVoided: true },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "VOID_CLINICAL_DOCUMENT",
          entity: "CLINICAL_DOCUMENT",
          entityId: id,
          patientId: previous.patientId,
          details: `Anulación médico-legal del documento: "${previous.title}"`,
          oldData: {
            isVoided: false,
            title: previous.title,
            specialistName: previous.specialistName,
          },
          newData: { isVoided: true },
          ipAddress,
          userAgent,
        },
      })
    })

    return { success: true, message: "Documento clínico anulado y auditado con éxito" }
  }
)