import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const agreements = await prisma.agreement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { treatmentPlans: true, patients: true }
        }
      }
    })
    return NextResponse.json(agreements)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener convenios" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const agreement = await prisma.agreement.create({
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
        notes: body.notes || ""
      }
    })
    return NextResponse.json(agreement, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Error al crear convenio" }, { status: 500 })
  }
}