import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params

    const anamnesis = await prisma.anamnesis.findUnique({
      where: { patientId },
    })

    if (!anamnesis || !anamnesis.data) {
      return NextResponse.json({ data: null }, { status: 200 })
    }
    const content: any = typeof anamnesis.data === "string" 
      ? JSON.parse(anamnesis.data) 
      : anamnesis.data

    return NextResponse.json({ data: content }, { status: 200 })
  } catch (error: any) {
    console.error("Error al obtener anamnesis:", error)
    return NextResponse.json(
      { error: error?.message || "Error al cargar la ficha médica" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const body = await request.json()
    const anamnesisPayload = {
      motivo: body.motivo || { tags: [], notes: "" },
      enfermedadActual: body.enfermedadActual || { tags: [], notes: "" },
      alertasMedicas: body.alertasMedicas || { tags: [], notes: "" },
      enfermedades: body.enfermedades || { tags: [], notes: "" },
      medicamentos: body.medicamentos || { tags: [], notes: "" },
      habitos: body.habitos || { tags: [], notes: "" },
      antecedentesOdonto: body.antecedentesOdonto || { tags: [], notes: "" },
      antecedentesFamiliares: body.antecedentesFamiliares || { tags: [], notes: "" },
    }
    const saved = await prisma.anamnesis.upsert({
      where: { patientId },
      update: {
        data: anamnesisPayload,
      },
      create: {
        patientId,
        data: anamnesisPayload,
      },
    })

    const alertTags = body.alertasMedicas?.tags || []
    if (alertTags.length > 0) {
      await prisma.patient.update({
        where: { id: patientId },
        data: {
          medicalAlerts: alertTags.join(", "),
        },
      }).catch((err) => console.warn("No se pudo actualizar medicalAlerts en Patient:", err.message))
    }

    return NextResponse.json({ success: true, data: saved }, { status: 200 })
  } catch (error: any) {
    console.error("Error al guardar anamnesis:", error)
    return NextResponse.json(
      { error: error?.message || "Error interno al guardar en la base de datos" },
      { status: 500 }
    )
  }
}