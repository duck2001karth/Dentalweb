import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { headers } from "next/headers"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
        { error: "Acceso denegado: solo personal médico o administrativo puede estructurar fases." },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre de la fase o sección es obligatorio." },
        { status: 400 }
      )
    }

    const cleanName = name.trim()

    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const result = await prisma.$transaction(async (tx) => {
      const existingPlan = await tx.treatmentPlan.findUnique({
        where: { id },
        select: { id: true, name: true, patientId: true }
      })

      if (!existingPlan) {
        throw new Error("NOT_FOUND")
      }

      const currentSectionsCount = await tx.treatmentSection.count({
        where: { treatmentPlanId: id }
      })

      const newSection = await tx.treatmentSection.create({
        data: {
          name: cleanName,
          treatmentPlanId: id,
          order: currentSectionsCount
        }
      })

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: "CREATE_TREATMENT_SECTION",
          entity: "TreatmentSection",
          entityId: newSection.id,
          patientId: existingPlan.patientId,
          details: `Nueva fase/sección agregada: "${cleanName}" en el plan "${existingPlan.name}"`,
          newData: {
            sectionId: newSection.id,
            sectionName: cleanName,
            order: newSection.order
          },
          ipAddress,
          userAgent
        }
      })

      return newSection
    })

    return NextResponse.json(
      {
        success: true,
        message: "Fase/sección creada exitosamente.",
        section: result
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }
    console.error("Error en POST /api/treatments/[id]/sections:", error)
    return NextResponse.json(
      { error: error?.message || "Error interno al guardar la sección." },
      { status: 500 }
    )
  }
}