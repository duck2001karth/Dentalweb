import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const currentUser = session?.user as any
    const userRole = String(currentUser?.role || "").toUpperCase().trim()

    if (userRole !== "ADMIN" && userRole !== "RECEPTIONIST") {
      return NextResponse.json(
        { error: "No autorizado para modificar el estado de comprobantes." },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

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

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
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
          userAgent,
        },
      })

      return updated
    })

    return NextResponse.json({ success: true, document: result })
  } catch (error: any) {
    if (error?.message === "DOCUMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Comprobante tributario no encontrado" }, { status: 404 })
    }
    console.error("Error al actualizar estado del documento SRI:", error)
    return NextResponse.json({ error: "Error interno al actualizar la factura" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const currentUser = session?.user as any
    const userRole = String(currentUser?.role || "").toUpperCase().trim()

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Permiso denegado. Solo administradores pueden purgar comprobantes." },
        { status: 403 }
      )
    }

    const { id } = await params

    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const docToDelete = await tx.taxDocument.findUnique({
        where: { id },
      })

      if (!docToDelete) {
        throw new Error("DOCUMENT_NOT_FOUND")
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

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
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
            subtotal0: docToDelete.subtotal0,
            subtotal15: docToDelete.subtotal15,
            identification: docToDelete.identification,
            businessName: docToDelete.businessName,
            status: docToDelete.status,
            paymentId: docToDelete.paymentId,
          },
          newData: undefined,
          ipAddress,
          userAgent,
        },
      })
    })

    return NextResponse.json({ success: true, message: "Factura eliminada definitivamente del sistema" })
  } catch (error: any) {
    if (error?.message === "DOCUMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Comprobante tributario no encontrado" }, { status: 404 })
    }
    console.error("Error al eliminar factura SRI:", error)
    return NextResponse.json({ error: "Error interno al eliminar la factura" }, { status: 500 })
  }
}