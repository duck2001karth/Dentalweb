import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { headers } from "next/headers"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const currentUser = session?.user as any

    if (!currentUser?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userRole = String(currentUser?.role || "").toUpperCase().trim()
    if (userRole !== "ADMIN" && userRole !== "DOCTOR") {
      return NextResponse.json(
        { error: "Acceso denegado: solo personal médico o administrativo puede eliminar fases." },
        { status: 403 }
      )
    }

    const { id: planId, sectionId } = await params

    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const section = await tx.treatmentSection.findUnique({
        where: { id: sectionId },
        include: { plan: { select: { name: true, patientId: true } } }
      })

      if (!section) {
        throw new Error("NOT_FOUND")
      }

      // Desvincular prestaciones asociadas para que no se pierdan (pasan a ser generales)
      await tx.treatmentItem.updateMany({
        where: { sectionId },
        data: { sectionId: null }
      })

      // Eliminar la fase
      await tx.treatmentSection.delete({
        where: { id: sectionId }
      })

      // Auditoría
      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: "DELETE_TREATMENT_SECTION",
          entity: "TreatmentSection",
          entityId: sectionId,
          patientId: section.plan?.patientId,
          details: `Fase eliminada: "${section.name}" del plan "${section.plan?.name}"`,
          oldData: { sectionName: section.name, planId },
          ipAddress,
          userAgent
        }
      })
    })

    return NextResponse.json({ success: true, message: "Fase eliminada correctamente" })
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Fase no encontrada" }, { status: 404 })
    }
    console.error("Error al eliminar fase:", error)
    return NextResponse.json({ error: "Error al eliminar la fase" }, { status: 500 })
  }
}