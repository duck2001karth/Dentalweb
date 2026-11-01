import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "RECEPTIONIST"],
    schema: z.any()
  },
  async (req, { user, data }) => {
    const { taxDocumentId, reasonCategory = "GENERAL", comments } = data

    if (!taxDocumentId || !comments) {
      throw new Error("ID de comprobante y justificación son requeridos.")
    }

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const result = await prisma.$transaction(async (tx) => {
      const doc = await tx.taxDocument.findUnique({ where: { id: taxDocumentId } })
      
      if (!doc) throw new Error("DOCUMENT_NOT_FOUND")
      if (doc.status === "VOIDED") throw new Error("El documento ya se encuentra anulado")

      const voidDetails = `[ANULADO] Motivo: ${reasonCategory} | Detalle: ${comments} | Fecha: ${new Date().toISOString()}`
      
      const updatedDoc = await tx.taxDocument.update({
        where: { id: taxDocumentId },
        data: {
          status: "VOIDED",
          sriResponse: doc.sriResponse ? `${doc.sriResponse}\n${voidDetails}` : voidDetails,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "VOID_TAX_DOCUMENT",
          entity: "TaxDocument",
          entityId: doc.id,
          patientId: doc.patientId,
          details: `Anulación de ${doc.docType} #${doc.secuencial}. Motivo: "${reasonCategory}" - Justificación: ${comments}`,
          oldData: {
            status: doc.status,
            sriResponse: doc.sriResponse,
            total: doc.total,
            secuencial: doc.secuencial,
          },
          newData: { status: "VOIDED", reasonCategory, comments },
          ipAddress,
          userAgent,
        },
      })

      return updatedDoc
    })

    return { success: true, taxDocument: result }
  }
)