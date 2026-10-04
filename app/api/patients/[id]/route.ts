import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logAuditEvent } from "@/lib/audit"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const input = body.input || body

    if (!input || Object.keys(input).length === 0) {
      return NextResponse.json({ error: "No se proporcionaron datos para actualizar" }, { status: 400 })
    }

    const { id } = await params

    const safeData: any = {
      ...(input.firstName !== undefined && { firstName: input.firstName }),
      ...(input.lastName !== undefined && { lastName: input.lastName }),
      ...(input.ci !== undefined && { ci: input.ci }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.birthDate !== undefined && { birthDate: input.birthDate ? new Date(input.birthDate) : null }),
      ...(input.convenio !== undefined && { convenio: input.convenio }),
      ...(input.medicalAlerts !== undefined && { medicalAlerts: input.medicalAlerts }),
      // Añade aquí los demás campos específicos (sexo, profesion, eps, etc.)
    }

    const previousPatient = await prisma.patient.findUnique({ where: { id } })

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: safeData,
    })

    await logAuditEvent({
      userId: (session.user as any).id,
      action: "UPDATE",
      entity: "PATIENT",
      entityId: id,
      patientId: id,
      details: `Modificación de datos demográficos del paciente: ${updatedPatient.firstName} ${updatedPatient.lastName}`,
      oldData: previousPatient,
      newData: updatedPatient
    })

    return NextResponse.json({ patient: updatedPatient }, { status: 200 })
  } catch (error) {
    console.error("[PATIENT_PATCH_ERROR]", error)
    return NextResponse.json({ error: "Error al actualizar el paciente" }, { status: 500 })
  }
}
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    
    // RBAC: Solo Administradores pueden borrar pacientes
    const userRole = String((session.user as any).role || "").toUpperCase()
    if (userRole !== "ADMIN" && userRole !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Solo administradores pueden eliminar pacientes." }, { status: 403 })
    }

    const { id } = await params
    
    const deletedPatient = await prisma.patient.update({
      where: { id },
      data: { isDeleted: true }, 
    })

    await logAuditEvent({
      userId: (session.user as any).id,
      action: "DELETE",
      entity: "PATIENT",
      entityId: id,
      patientId: id,
      details: `Eliminación lógica de paciente: ${deletedPatient.firstName} ${deletedPatient.lastName}`,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[PATIENT_DELETE_ERROR]", error)
    return NextResponse.json({ error: "Error al eliminar el paciente" }, { status: 500 })
  }
}