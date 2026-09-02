import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { headers } from "next/headers"

async function createAuditEntry(
  tx: any,
  data: {
    userId: string
    action: "CREATE" | "UPDATE" | "DELETE"
    entityId: string
    details?: string
    oldData?: any
    newData?: any
  }
) {
  try {
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await tx.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: "AGREEMENT",
        entityId: data.entityId,
        details: data.details || null,
        oldData: data.oldData || null,
        newData: data.newData || null,
        ipAddress,
        userAgent,
      },
    })
  } catch (err) {
    console.error("Error al registrar auditoría en Convenio:", err)
  }
}

export async function GET() {
  try {
    const agreements = await prisma.agreement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { treatmentPlans: true, patients: true },
        },
      },
    })
    return NextResponse.json(agreements)
  } catch (error) {
    console.error("Error GET /api/agreements:", error)
    return NextResponse.json({ error: "Error al obtener convenios" }, { status: 500 })
  }
}

export async function POST(req: Request) {
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
      userRole === "ADMINISTRATION"

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Solo administradores pueden crear convenios comerciales" },
        { status: 403 }
      )
    }

    const body = await req.json()

    if (!body.name || !body.institutionName || body.discountValue === undefined) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (nombre, institución o valor de descuento)" },
        { status: 400 }
      )
    }

    const agreement = await prisma.$transaction(async (tx) => {
      const created = await tx.agreement.create({
        data: {
          name: body.name,
          institutionName: body.institutionName,
          contactPerson: body.contactPerson || null,
          contactPhone: body.contactPhone || null,
          contactEmail: body.contactEmail || null,
          discountType: body.discountType || "PERCENTAGE",
          discountValue: Number(body.discountValue),
          isActive: body.isActive ?? true,
          startDate: body.startDate ? new Date(body.startDate) : new Date(),
          endDate: body.endDate ? new Date(body.endDate) : null,
          notes: body.notes || "",
        },
      })

      await createAuditEntry(tx, {
        userId: currentUser.id,
        action: "CREATE",
        entityId: created.id,
        details: `Alta de convenio institucional: "${created.name}" (${created.institutionName})`,
        newData: {
          name: created.name,
          institutionName: created.institutionName,
          discountType: created.discountType,
          discountValue: Number(created.discountValue),
          isActive: created.isActive,
          startDate: created.startDate,
          endDate: created.endDate,
        },
      })

      return created
    })

    return NextResponse.json(agreement, { status: 201 })
  } catch (error) {
    console.error("Error POST /api/agreements:", error)
    return NextResponse.json({ error: "Error al crear convenio" }, { status: 500 })
  }
}