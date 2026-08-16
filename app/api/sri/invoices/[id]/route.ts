import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth" 

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role

    if (userRole !== "ADMIN" && userRole !== "RECEPTIONIST") {
      return NextResponse.json({ error: "No autorizado para anular comprobantes." }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const updated = await (prisma as any).taxDocument.update({
      where: { id },
      data: {
        status: body.status || "ANULADO",
      },
    })

    return NextResponse.json({ success: true, document: updated })
  } catch (error) {
    console.error("Error al anular factura SRI:", error)
    return NextResponse.json({ error: "Error interno al anular la factura" }, { status: 500 })
  }
}

// 📍 DELETE: Purgado Físico (Solo ADMIN)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Permiso denegado. Solo administradores pueden purgar comprobantes." }, { status: 403 })
    }

    const { id } = await params
    await (prisma as any).taxDocument.deleteMany({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Factura eliminada definitivamente" })
  } catch (error) {
    console.error("Error al eliminar factura SRI:", error)
    return NextResponse.json({ error: "Error interno al eliminar la factura" }, { status: 500 })
  }
}