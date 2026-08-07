import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next" 
import { prisma } from "@/lib/db"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, input } = body

    if (action === "RESTORE") {
      const restoredPlan = await prisma.treatmentPlan.update({
        where: { id },
        data: { status: "DRAFT" } 
      })
      return NextResponse.json({ plan: restoredPlan, message: "Plan restaurado con éxito" })
    }

    const updatedPlan = await prisma.treatmentPlan.update({
      where: { id },
      data: { ...input }
    })

    return NextResponse.json({ plan: updatedPlan })
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar el plan" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get("force") === "true"

    // SI ES FORCE DELETE (Borrado Físico Definitivo)
    if (forceDelete) {
      await prisma.treatmentItem.deleteMany({ where: { treatmentPlanId: id } })
      await prisma.odontogramRecord.deleteMany({ where: { planId: id } })
      await prisma.treatmentPlan.delete({ where: { id } })

      return NextResponse.json({ success: true, message: "Plan destruido permanentemente de la base de datos" })
    }
    await prisma.treatmentPlan.update({
      where: { id },
      data: { status: "CANCELLED" }
    })

    return NextResponse.json({ success: true, message: "Plan movido a la papelera (Anulado)" })
  } catch (error) {
    console.error("Error en DELETE:", error)
    return NextResponse.json({ error: "Error al procesar la eliminación" }, { status: 500 })
  }
}