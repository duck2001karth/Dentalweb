import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Obtener un plan por ID (GET)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params 
    
    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        doctor: true,
        patient: true,
        items: true
      }
    })

    if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })

    return NextResponse.json({ plan })
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener el plan" }, { status: 500 })
  }
}

// Actualizar un plan (PATCH)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { input } = body

    const updatedPlan = await prisma.treatmentPlan.update({
      where: { id },
      data: { ...input }
    })

    return NextResponse.json({ plan: updatedPlan })
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar el plan" }, { status: 500 })
  }
}

// Enviar a papelera (DELETE) - En vez de eliminar, actualizamos el status a "CANCELLED"
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.treatmentPlan.update({
      where: { id },
      data: { 
        status: "CANCELLED" 
      }
    })

    return NextResponse.json({ success: true, message: "Plan enviado a la papelera (Anulado)" })
  } catch (error) {
    console.error("Error al enviar a la papelera:", error)
    return NextResponse.json({ error: "Error al anular el plan" }, { status: 500 })
  }
}