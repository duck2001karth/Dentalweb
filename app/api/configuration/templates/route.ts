import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { headers } from "next/headers"
import { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const onlyActive = searchParams.get("onlyActive") === "true"

    const whereClause: any = {}
    if (type && type !== "ALL") {
      whereClause.type = type
    }
    if (onlyActive) {
      whereClause.isActive = true
    }

    const templates = await prisma.documentTemplate.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, specialty: true },
        },
      },
      orderBy: [{ isDefault: "desc" }, { title: "asc" }],
    })

    return NextResponse.json(templates)
  } catch (error: any) {
    console.error("Error en GET /api/configuration/templates:", error)
    return NextResponse.json(
      { error: "Error al consultar plantillas de documentos" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const currentUser = session.user as any
    const userRole = String(currentUser?.role || "").toUpperCase().trim()

    const isAuthorized =
      userRole === "ADMIN" ||
      userRole === "ADMINISTRADOR" ||
      userRole === "DOCTOR"

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "No cuenta con permisos para crear formatos institucionales" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      type,
      category,
      content,
      requiresPatientSignature,
      requiresDoctorSignature,
      isActive,
      isDefault,
    } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "El título y el contenido son obligatorios" },
        { status: 400 }
      )
    }

    const newTemplate = await prisma.$transaction(async (tx) => {
      // Si se marca como predeterminada, retirar el flag de las otras del mismo tipo
      if (isDefault) {
        await tx.documentTemplate.updateMany({
          where: { type: type || "CONSENT" },
          data: { isDefault: false },
        })
      }

      const created = await tx.documentTemplate.create({
        data: {
          title: title.trim(),
          type: type || "CONSENT",
          category: category?.trim() || "General",
          content: content.trim(),
          requiresPatientSignature: Boolean(requiresPatientSignature),
          requiresDoctorSignature: Boolean(requiresDoctorSignature),
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          isDefault: Boolean(isDefault),
          createdById: currentUser.id || null,
        },
        include: {
          createdBy: { select: { id: true, name: true, specialty: true } },
        },
      })

      // Registro de trazabilidad
      try {
        const headersList = await headers()
        const forwardedFor = headersList.get("x-forwarded-for")
        const ipAddress = forwardedFor
          ? forwardedFor.split(",")[0].trim()
          : headersList.get("x-real-ip") || "127.0.0.1"
        const userAgent = headersList.get("user-agent") || "Desconocido"

        await tx.auditLog.create({
          data: {
            userId: currentUser.id,
            action: "CREATE",
            entity: "DOCUMENT_TEMPLATE",
            entityId: created.id,
            details: `Creación de plantilla clínica: "${created.title}" [${created.type}]`,
            newData: {
              title: created.title,
              type: created.type,
              category: created.category,
            },
            ipAddress,
            userAgent,
          },
        })
      } catch (auditErr) {
        console.error("Error en AuditLog DocumentTemplate:", auditErr)
      }

      return created
    })

    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error: any) {
    console.error("Error en POST /api/configuration/templates:", error)
    return NextResponse.json(
      { error: error?.message || "Error al crear la plantilla" },
      { status: 500 }
    )
  }
}