import { NextResponse } from "next/server"
import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"

// Máximo 500 KiB de representación Base64.
const MAX_SIGNATURE_LENGTH = 700_000
const signatureSchema = z.string()
  .max(MAX_SIGNATURE_LENGTH)
  .refine((value) => {
    if (!value) return true // permite limpiar la firma
    const base64 = value.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/i, "")
    return base64.length > 0 && base64.length % 4 === 0
      && /^[A-Za-z0-9+/]+={0,2}$/.test(base64)
  }, "Firma inválida: solo imágenes Base64 PNG/JPEG/WebP")

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { user }) => {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { signatureBase64: true, professionalCard: true, specialty: true },
    })
    if (!dbUser) return NextResponse.json({ error: "Recurso no encontrado" }, { status: 404 })
    return {
      signatureBase64: dbUser.signatureBase64 || null,
      professionalCard: dbUser.professionalCard ?? "",
      specialty: dbUser.specialty || "Ortodoncia",
    }
  }
)

export const PATCH = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
    schema: z.object({
      signatureBase64: signatureSchema.nullable().optional(),
      professionalCard: z.string().trim().max(100).optional(),
      specialty: z.string().trim().max(100).optional(),
    }).strip(),
  },
  async (_req, { user, data }) => {
    if (Object.values(data).every((value) => value === undefined)) {
      return NextResponse.json({ error: "No se proporcionaron cambios" }, { status: 400 })
    }

    const updateData: {
      signatureBase64?: string | null
      professionalCard?: string
      specialty?: string
    } = {}
    if (data.signatureBase64 !== undefined) updateData.signatureBase64 = data.signatureBase64
    if (data.professionalCard !== undefined) updateData.professionalCard = data.professionalCard
    if (data.specialty !== undefined) updateData.specialty = data.specialty

    // Solo actualiza al usuario autenticado. Nunca aceptar userId del cliente.
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true, signatureBase64: true,
          professionalCard: true, specialty: true,
        },
      })
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_OWN_SIGNATURE",
          entity: "USER",
          entityId: user.id,
          details: "Actualización de datos profesionales o firma guardada",
          // Nunca conservar Base64 en auditoría.
          newData: {
            signatureChanged: data.signatureBase64 !== undefined,
            professionalCardChanged: data.professionalCard !== undefined,
            specialtyChanged: data.specialty !== undefined,
          },
        },
      })
      return updated
    })

    return {
      success: true,
      signatureBase64: updatedUser.signatureBase64,
      professionalCard: updatedUser.professionalCard ?? "",
      specialty: updatedUser.specialty,
    }
  }
)
