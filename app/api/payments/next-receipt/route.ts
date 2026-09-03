import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const totalPayments = await prisma.payment.count()
    const nextNumber = totalPayments + 1
    const nextReceipt = `REC-${nextNumber.toString().padStart(5, "0")}`

    return NextResponse.json({ nextReceipt })
  } catch (error) {
    console.error("Error al generar next-receipt:", error)
    return NextResponse.json({ nextReceipt: `REC-${Date.now().toString().slice(-5)}` })
  }
}