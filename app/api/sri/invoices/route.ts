import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

export const GET = createApiHandler(
  { roles: ["ADMIN", "RECEPTIONIST", "DOCTOR"] },
  async (req, { searchParams }) => {
    const patientId = searchParams.get("patientId")
    if (!patientId) {
      throw new Error("El parámetro patientId es obligatorio")
    }

    const documents = await prisma.taxDocument.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      include: { payment: { select: { id: true, amount: true, method: true, receiptNumber: true } } }
    })

    return { documents }
  }
)

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "RECEPTIONIST"],
    schema: z.any()
  },
  async (req, { user, data }) => {
    const { patientId, paymentId, docType = "FACTURA", secuencial, authorizationNum, identification, businessName, email, total = 0 } = data

    if (!patientId || !secuencial || !identification || !businessName) {
      throw new Error("Faltan campos obligatorios para el documento fiscal.")
    }

    const numericTotal = parseFloat(String(total)) || 0
    const finalDocType = docType === "NOTA_CREDITO" ? "NOTA_CREDITO" : "FACTURA"
    const cleanSecuencial = String(secuencial).trim()
    const cleanAuthNum = authorizationNum ? String(authorizationNum).trim() : null
    const cleanId = String(identification).trim()
    const idType = cleanId.length === 13 ? "RUC" : "CEDULA"

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const result = await prisma.$transaction(async (tx) => {
      const taxDoc = await tx.taxDocument.create({
        data: {
          docType: finalDocType as any,
          secuencial: cleanSecuencial,
          accessKey: cleanAuthNum,
          authorizationNum: cleanAuthNum,
          authorizationDate: new Date(),
          status: "AUTHORIZED",
          environment: "PRODUCTION",
          idType,
          identification: cleanId,
          businessName: String(businessName).trim(),
          email: email ? String(email).trim() : "",
          subtotal0: numericTotal,
          total: numericTotal,
          patientId,
          paymentId: paymentId || null
        }
      })

      let previousPaymentState: any = null
      if (paymentId) {
        const existingPayment = await tx.payment.findUnique({ where: { id: paymentId } })
        if (existingPayment) {
          previousPaymentState = { receiptNumber: existingPayment.receiptNumber, reference: existingPayment.reference }
          
          await tx.payment.update({
            where: { id: paymentId },
            data: {
              receiptNumber: existingPayment.receiptNumber || cleanSecuencial,
              reference: existingPayment.reference ? `${existingPayment.reference} | Factura: ${cleanSecuencial}` : `Factura: ${cleanSecuencial}`
            }
          })
        }
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: finalDocType === "NOTA_CREDITO" ? "EMIT_CREDIT_NOTE" : "EMIT_TAX_INVOICE",
          entity: "TaxDocument",
          entityId: taxDoc.id,
          patientId,
          details: `Emisión de ${finalDocType} #${cleanSecuencial} a favor de "${taxDoc.businessName}" por $${numericTotal.toFixed(2)}`,
          oldData: previousPaymentState ? { paymentId, ...previousPaymentState } : undefined,
          newData: { id: taxDoc.id, secuencial: taxDoc.secuencial, total: taxDoc.total, paymentId: taxDoc.paymentId },
          ipAddress,
          userAgent,
        }
      })

      return taxDoc
    })

    return { success: true, taxDocument: result }
  }
)