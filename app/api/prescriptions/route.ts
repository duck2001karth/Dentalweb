import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { searchParams }) => {
    const patientId = searchParams.get("patientId")
    if (!patientId) {
      throw new Error("Falta patientId")
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            specialty: true,
            signatureBase64: true,
            professionalCard: true, 
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedPrescriptions = prescriptions.map((p: any) => {
      const authorCard = p.author?.professionalCard || ""
      const authorSig = p.author?.signatureBase64 || null
      return {
        ...p,
        doctorSignature: p.doctorSignature || authorSig,
        doctorLicense: p.doctorLicense || authorCard,
      }
    })

    return formattedPrescriptions
  }
)

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: z.any(),
  },
  async (req, { user, data }) => {
    const inputData = data.input || data
    const { patientId, medications, indications, observations, authorId, doctorSignature } = inputData

    if (!patientId) {
      throw new Error("patientId es requerido")
    }

    const patientExists = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    })

    if (!patientExists) {
      throw new Error("El paciente especificado no existe en la base de datos.")
    }

    let resolvedAuthorId = authorId || user.id

    let validUser = resolvedAuthorId
      ? await prisma.user.findUnique({
          where: { id: resolvedAuthorId },
          select: {
            id: true,
            signatureBase64: true,
            professionalCard: true,
          },
        })
      : null

    if (!validUser) {
      if (user.email) {
        validUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            signatureBase64: true,
            professionalCard: true,
          },
        })
      }
      if (!validUser) {
        validUser = await prisma.user.findFirst({
          where: { role: { in: ["DOCTOR", "ADMIN"] } },
          select: {
            id: true,
            signatureBase64: true,
            professionalCard: true,
          },
        })
      }
    }

    resolvedAuthorId = validUser ? validUser.id : null
    const finalDoctorSignature = doctorSignature || validUser?.signatureBase64 || null

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const newPrescription = await prisma.$transaction(async (tx) => {
      const created = await tx.prescription.create({
        data: {
          patientId,
          medications: medications || "",
          indications: indications || "",
          observations: observations || null,
          authorId: resolvedAuthorId,
          doctorSignature: finalDoctorSignature,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              specialty: true,
              signatureBase64: true,
              professionalCard: true,
            },
          },
        },
      })

      if (resolvedAuthorId) {
        await tx.auditLog.create({
          data: {
            userId: resolvedAuthorId,
            action: "CREATE_PRESCRIPTION",
            entity: "PRESCRIPTION",
            entityId: created.id,
            patientId,
            details: "Emisión de receta médica/odontológica",
            newData: {
              medications: created.medications,
              indications: created.indications,
              observations: created.observations,
              hasDoctorSignature: Boolean(created.doctorSignature),
            },
            ipAddress,
            userAgent,
          },
        })
      }

      return created
    })

    const authorCard = newPrescription.author?.professionalCard || ""

    return {
      ...newPrescription,
      doctorSignature: newPrescription.doctorSignature || newPrescription.author?.signatureBase64 || null,
      doctorLicense: authorCard,
    }
  }
)