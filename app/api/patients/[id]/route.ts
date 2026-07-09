import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// OBTENER UN PACIENTE (GET)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // <-- Actualizado a Promise
) {
  try {
    // Extraemos el id esperando la promesa (Requisito de Next.js 15)
    const { id } = await params;

    const patient = await prisma.patient.findUnique({
      where: { id },
    })

    if (!patient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ patient })
  } catch (error) {
    console.error("[PATIENT_GET_ERROR]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// ACTUALIZAR UN PACIENTE (PATCH)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // <-- Actualizado a Promise
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { input } = body

    // Extraemos el id esperando la promesa
    const { id } = await params;

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: input,
    })

    return NextResponse.json({ patient: updatedPatient })
  } catch (error) {
    console.error("[PATIENT_PATCH_ERROR]", error)
    return NextResponse.json({ error: "Error al actualizar el paciente" }, { status: 500 })
  }
}

// ELIMINAR UN PACIENTE (DELETE - Soft Delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // <-- Actualizado a Promise
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Extraemos el id esperando la promesa
    const { id } = await params;

    // Usamos Soft Delete (solo lo marcamos como eliminado para no romper historiales médicos)
    await prisma.patient.update({
      where: { id },
      data: { isDeleted: true }, 
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PATIENT_DELETE_ERROR]", error)
    return NextResponse.json({ error: "Error al eliminar el paciente" }, { status: 500 })
  }
}