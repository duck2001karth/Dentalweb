import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { taxDocumentId, reasonCategory, comments } = body

    if (!taxDocumentId || !comments) {
      return NextResponse.json(
        { error: "ID de comprobante y justificación son requeridos." },
        { status: 400 }
      )
    }

    const doc = await prisma.taxDocument.findUnique({
      where: { id: taxDocumentId },
    })

    if (!doc) {
      return NextResponse.json(
        { error: "Comprobante no encontrado." },
        { status: 404 }
      )
    }

    const updatedDoc = await prisma.taxDocument.update({
      where: { id: taxDocumentId },
      data: {
        status: "VOIDED",
        sriResponse: `[ANULADO] Motivo: ${reasonCategory} | Detalle: ${comments} | Fecha: ${new Date().toISOString()}`,
      },
    })

    return NextResponse.json({ success: true, taxDocument: updatedDoc })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al procesar anulación." },
      { status: 500 }
    )
  }
}