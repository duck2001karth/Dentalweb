import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiHandler } from "@/lib/server/api-handler"
import { z } from "zod"

export const POST = createApiHandler({ roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: z.object({ confirmed: z.literal(true) }).strict() }, async (_req, { user, params }) => {
  const id = typeof params.id === "string" ? params.id.trim() : ""
  if (!id || id.length > 128) return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  const result = await prisma.$transaction(async tx => {
    const recipe = await tx.prescription.findFirst({ where: { id, patient: { is: { isDeleted: false } }, AND: [{ doctorSignature: { not: null } }, { doctorSignature: { not: "" } }] }, select: { id: true, patientId: true } })
    if (!recipe) return false
    await tx.auditLog.create({ data: { userId: user.id, action: "PRESCRIPTION_SHARE_REQUEST", entity: "PRESCRIPTION", entityId: recipe.id, patientId: recipe.patientId, details: "Usuario confirmó autorización y solicitó compartir receta por WhatsApp; entrega no verificada" } })
    return true
  })
  return result ? NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } }) : NextResponse.json({ error: "Receta firmada no disponible" }, { status: 404 })
})
