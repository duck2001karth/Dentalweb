import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"
import { withProtection, ProtectedRouteContext } from "@/lib/api-wrapper"

export const PATCH = withProtection(["ADMIN", "RECEPTIONIST"], async (req: Request, ctx: ProtectedRouteContext) => {
  const { user, params } = ctx
  const id = params.id as string
  const body = await req.json()
  const requestedStatus = body.status === "ANULADO" ? "VOIDED" : body.status || "VOIDED"

  const result = await prisma.$transaction(async (tx) => {
    const previousDoc = await tx.taxDocument.findUnique({
      where: { id },
    })

    if (!previousDoc) {
      throw new Error("DOCUMENT_NOT_FOUND")
    }

    const updated = await tx.taxDocument.update({
      where: { id },
      data: {
        status: requestedStatus,
        ...(body.sriResponse && { sriResponse: String(body.sriResponse) }),
      },
    })

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE_TAX_DOC_STATUS",
        entity: "TaxDocument",
        entityId: id,
        patientId: previousDoc.patientId,
        details: `Cambio de estado en ${previousDoc.docType} #${previousDoc.secuencial}: ${previousDoc.status} -> ${requestedStatus}`,
        oldData: {
          status: previousDoc.status,
          sriResponse: previousDoc.sriResponse,
          secuencial: previousDoc.secuencial,
          total: previousDoc.total,
        },
        newData: {
          status: requestedStatus,
          sriResponse: updated.sriResponse,
        },
        ipAddress,
        userAgent
      }
    })

    return updated
  })

  return NextResponse.json({ success: true, document: result })
})

export const DELETE = withProtection(["ADMIN"], async (req: Request, ctx: ProtectedRouteContext) => {
  const { user, params } = ctx
  const id = params.id as string

  await prisma.$transaction(async (tx) => {
    const docToDelete = await tx.taxDocument.findUnique({
      where: { id },
    })

    if (!docToDelete) {
      throw new Error("DOCUMENT_NOT_FOUND")
    }

    if (docToDelete.status === "AUTHORIZED") {
      throw new Error("CANNOT_DELETE_AUTHORIZED")
    }

    if (docToDelete.paymentId) {
      const linkedPayment = await tx.payment.findUnique({
        where: { id: docToDelete.paymentId },
        select: { reference: true, receiptNumber: true },
      })

      if (linkedPayment) {
        let cleanRef = linkedPayment.reference || null
        if (cleanRef) {
          const escapedSecuencial = docToDelete.secuencial.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          const regexWithPipe = new RegExp(`\\s*\\|\\s*Factura:\\s*${escapedSecuencial}`, "gi")
          const regexDirect = new RegExp(`Factura:\\s*${escapedSecuencial}\\s*\\|?\\s*`, "gi")
          
          cleanRef = cleanRef.replace(regexWithPipe, "").replace(regexDirect, "").trim()
          if (!cleanRef) cleanRef = null
        }

        await tx.payment.update({
          where: { id: docToDelete.paymentId },
          data: {
            reference: cleanRef,
            ...(linkedPayment.receiptNumber === docToDelete.secuencial && { receiptNumber: null }),
          },
        }).catch(() => null)
      }
    }

    await tx.taxDocument.delete({
      where: { id },
    })

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "PURGE_TAX_DOCUMENT",
        entity: "TaxDocument",
        entityId: id,
        patientId: docToDelete.patientId,
        details: `PURGADO FÍSICO de comprobante fiscal ${docToDelete.docType} #${docToDelete.secuencial} emitido a "${docToDelete.businessName}" por $${Number(docToDelete.total).toFixed(2)}`,
        oldData: {
          id: docToDelete.id,
          docType: docToDelete.docType,
          secuencial: docToDelete.secuencial,
          accessKey: docToDelete.accessKey,
          authorizationNum: docToDelete.authorizationNum,
          total: docToDelete.total,
          identification: docToDelete.identification,
          businessName: docToDelete.businessName,
          status: docToDelete.status,
          paymentId: docToDelete.paymentId,
        },
        ipAddress,
        userAgent
      }
    })
  })

  return NextResponse.json({ success: true, message: "Factura eliminada definitivamente del sistema" })
})