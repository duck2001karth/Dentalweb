import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"
import { withProtection, ProtectedRouteContext } from "@/lib/api-wrapper"

export const POST = withProtection(["ADMIN", "RECEPTIONIST"], async (req: Request, ctx: ProtectedRouteContext) => {
  const { user } = ctx 

  const body = await req.json()
  const { taxDocumentId, reasonCategory = "GENERAL", comments } = body

  if (!taxDocumentId || !comments) {
    return NextResponse.json({ error: "ID de comprobante y justificación son requeridos." }, { status: 400 })
  }

  const headersList = await headers()
  const forwardedFor = headersList.get("x-forwarded-for")
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headersList.get("x-real-ip") || "127.0.0.1"
  const userAgent = headersList.get("user-agent") || "Desconocido"

  const result = await prisma.$transaction(async (tx) => {
    const doc = await tx.taxDocument.findUnique({ where: { id: taxDocumentId } })
    
    if (!doc) throw new Error("DOCUMENT_NOT_FOUND")
    if (doc.status === "VOIDED") throw new Error("ALREADY_VOIDED")

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
        userId: user.id, // Usamos el ID seguro del contexto
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

  return NextResponse.json({ success: true, taxDocument: result })
})