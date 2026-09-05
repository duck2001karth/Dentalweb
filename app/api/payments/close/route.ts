import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as any
    const userId = user?.id
    const userName = user?.name || "Usuario del Sistema"

    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado. Debe iniciar sesión." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { expectedCash, countedCash, difference, notes, breakdown } = body

    if (expectedCash === undefined || countedCash === undefined) {
      return NextResponse.json(
        { error: "Parámetros incompletos. Se requiere monto teórico y contado." },
        { status: 400 }
      )
    }

    const numExpected = Number(expectedCash)
    const numCounted = Number(countedCash)
    const numDifference = Number(difference ?? (numCounted - numExpected))

    let closeStatus: "BALANCED" | "SURPLUS" | "DEFICIT" = "BALANCED"
    if (Math.abs(numDifference) >= 0.01) {
      closeStatus = numDifference > 0 ? "SURPLUS" : "DEFICIT"
    }

    const result = await prisma.$transaction(async (tx) => {
      const cashClose = await tx.cashRegisterClose.create({
        data: {
          userId,
          expectedCash: numExpected,
          countedCash: numCounted,
          difference: numDifference,
          status: closeStatus,
          notes: notes?.trim() || null,
          breakdown: breakdown || null,
        },
      })

      await tx.auditLog.create({
        data: {
          userId,
          action: "CASH_REGISTER_CLOSE",
          entity: "CashRegisterClose",
          entityId: cashClose.id,
          details: `Arqueo de caja ejecutado por ${userName}. Estado: ${closeStatus}. Diferencia: $${numDifference.toFixed(2)}`,
          newData: {
            expectedCash: numExpected,
            countedCash: numCounted,
            difference: numDifference,
            status: closeStatus,
            hasNotes: Boolean(notes?.trim()),
          },
        },
      })

      return cashClose
    })

    return NextResponse.json({
      success: true,
      message: "Cierre de caja y auditoría guardados correctamente.",
      data: result,
    })
  } catch (error: any) {
    console.error("Error en POST /api/payments/close:", error)
    return NextResponse.json(
      { error: "Error interno al procesar el cierre de caja." },
      { status: 500 }
    )
  }
}