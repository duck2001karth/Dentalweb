import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { withProtection, ProtectedRouteContext } from "@/lib/api-wrapper"

export const POST = withProtection(
  ["ADMIN", "RECEPTIONIST"], 
  async (req: Request, ctx: ProtectedRouteContext) => {
    const { user } = ctx 

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
          userId: user.id,
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
          userId: user.id,
          action: "CASH_REGISTER_CLOSE",
          entity: "CashRegisterClose",
          entityId: cashClose.id,
          details: `Arqueo de caja ejecutado por ${user.name}. Estado: ${closeStatus}. Diferencia: $${numDifference.toFixed(2)}`,
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
  }
)