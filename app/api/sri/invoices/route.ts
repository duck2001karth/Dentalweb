import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { withProtection, ProtectedRouteContext } from "@/lib/api-wrapper"

export const GET = withProtection(["ADMIN", "RECEPTIONIST", "DOCTOR"], async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const patientId = searchParams.get("patientId")
  
  if (!patientId) {
    return NextResponse.json({ error: "El parámetro patientId es obligatorio" }, { status: 400 })
  }

  const documents = await prisma.taxDocument.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: { payment: { select: { id: true, amount: true, method: true, receiptNumber: true } } }
  })
  
  return NextResponse.json({ documents })
})

export const POST = withProtection(["ADMIN", "RECEPTIONIST"], async (req: Request, ctx: ProtectedRouteContext) => {
  const { user, audit } = ctx
  const body = await req.json()
  const { patientId, paymentId, docType = "FACTURA", secuencial, authorizationNum, identification, businessName, email, total = 0 } = body

  if (!patientId || !secuencial || !identification || !businessName) {
    return NextResponse.json({ error: "Faltan campos obligatorios para el documento fiscal." }, { status: 400 })
  }

  const numericTotal = parseFloat(String(total)) || 0
  const finalDocType = docType === "NOTA_CREDITO" ? "NOTA_CREDITO" : "FACTURA"
  const cleanSecuencial = secuencial.trim()
  const cleanAuthNum = authorizationNum ? authorizationNum.trim() : null
  const cleanId = identification.trim()
  const idType = cleanId.length === 13 ? "RUC" : "CEDULA"

  const result = await prisma.$transaction(async (tx) => {
    const taxDoc = await tx.taxDocument.create({
      data: {
        docType: finalDocType,
        secuencial: cleanSecuencial,
        accessKey: cleanAuthNum,
        authorizationNum: cleanAuthNum,
        authorizationDate: new Date(),
        status: "AUTHORIZED",
        environment: "PRODUCTION",
        idType,
        identification: cleanId,
        businessName: businessName.trim(),
        email: email ? email.trim() : "",
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
        newData: { id: taxDoc.id, secuencial: taxDoc.secuencial, total: taxDoc.total, paymentId: taxDoc.paymentId }
      }
    })
    return taxDoc
  })

  return NextResponse.json({ success: true, taxDocument: result }, { status: 201 })
})