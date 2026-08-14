import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "El correo es requerido" },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      )
    }

    // Aquí puedes conectar tu servicio de email
    // (Resend, Nodemailer, etc.)

    return NextResponse.json({
      success: true,
      message: `Comprobante enviado a ${email}`,
    })
  } catch (error) {
    console.error(
      "Error al enviar comprobante por correo:",
      error
    )

    return NextResponse.json(
      { error: "Error al enviar correo" },
      { status: 500 }
    )
  }
}