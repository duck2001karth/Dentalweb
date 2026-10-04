import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth" 

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "No autorizado. Sesión requerida para registrar comprobantes fiscales y auditoría." },
        { status: 401 }
      )
    }

    const currentUserId = (session.user as any).id

    // Metadatos de red
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const body = await req.json()
    const { 
      patientId, 
      paymentId, 
      docType = "FACTURA", 
      secuencial, 
      authorizationNum,
      identification, 
      businessName, 
      email, 
      total = 0 
    } = body

    if (!patientId || !secuencial || !identification || !businessName) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para el documento fiscal." },
        { status: 400 }
      )
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
        const existingPayment = await tx.payment.findUnique({
          where: { id: paymentId }
        })

        if (existingPayment) {
          previousPaymentState = {
            receiptNumber: existingPayment.receiptNumber,
            reference: existingPayment.reference
          }

          await tx.payment.update({
            where: { id: paymentId },
            data: {
              receiptNumber: existingPayment.receiptNumber || cleanSecuencial,
              reference: existingPayment.reference 
                ? `${existingPayment.reference} | Factura: ${cleanSecuencial}`
                : `Factura: ${cleanSecuencial}`
            }
          })
        }
      }
      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: finalDocType === "NOTA_CREDITO" ? "EMIT_CREDIT_NOTE" : "EMIT_TAX_INVOICE",
          entity: "TaxDocument",
          entityId: taxDoc.id,
          patientId,
          details: `Emisión de ${finalDocType} #${cleanSecuencial} a favor de "${taxDoc.businessName}" (${idType}: ${cleanId}) por $${numericTotal.toFixed(2)}${paymentId ? ` asociado al pago ${paymentId}` : ""}`,
          oldData: previousPaymentState ? { paymentId, ...previousPaymentState } : undefined,
          newData: {
            id: taxDoc.id,
            docType: taxDoc.docType,
            secuencial: taxDoc.secuencial,
            authorizationNum: taxDoc.authorizationNum,
            total: taxDoc.total,
            businessName: taxDoc.businessName,
            identification: taxDoc.identification,
            paymentId: taxDoc.paymentId
          },
          ipAddress,
          userAgent
        }
      })

      return taxDoc
    })

    return NextResponse.json({ success: true, taxDocument: result }, { status: 201 })
  } catch (error: any) {
    console.error("Error al guardar documento fiscal:", error)
    return NextResponse.json(
      { error: error.message || "Error al procesar la factura en el servidor" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    if (!patientId) {
      return NextResponse.json(
        { error: "El parámetro patientId es obligatorio" },
        { status: 400 }
      );
    }

    const documents = await prisma.taxDocument.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            receiptNumber: true
          }
        }
      }
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al consultar facturas" },
      { status: 500 }
    );
  }
}