import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  try {
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

    const taxDoc = await prisma.taxDocument.create({
      data: {
        docType: docType === "NOTA_CREDITO" ? "NOTA_CREDITO" : "FACTURA",
        secuencial: secuencial.trim(),
        accessKey: authorizationNum ? authorizationNum.trim() : null,
        authorizationNum: authorizationNum ? authorizationNum.trim() : null,
        authorizationDate: new Date(),
        status: "AUTHORIZED",
        environment: "PRODUCTION",
        idType: identification.trim().length === 13 ? "RUC" : "CEDULA",
        identification: identification.trim(),
        businessName: businessName.trim(),
        email: email ? email.trim() : "",
        subtotal0: numericTotal,
        total: numericTotal,
        patientId,
        paymentId: paymentId || null
      }
    })

    if (paymentId) {
      const existingPayment = await prisma.payment.findUnique({
        where: { id: paymentId }
      })

      if (existingPayment) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            receiptNumber: existingPayment.receiptNumber || secuencial.trim(),
            reference: existingPayment.reference 
              ? `${existingPayment.reference} | Factura: ${secuencial.trim()}`
              : `Factura: ${secuencial.trim()}`
          }
        })
      }
    }

    return NextResponse.json({ success: true, taxDocument: taxDoc })
  } catch (error: any) {
    console.error("Error al guardar factura:", error)
    return NextResponse.json(
      { error: error.message || "Error al procesar la factura en el servidor" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json(
        { error: "El parámetro patientId es obligatorio" },
        { status: 400 }
      )
    }

    const documents = await prisma.taxDocument.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ documents })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al consultar facturas" },
      { status: 500 }
    )
  }
}