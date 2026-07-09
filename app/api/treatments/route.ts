import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const plans = await prisma.treatmentPlan.findMany({
      include: {
        patient: { 
          select: { 
            id: true,
            firstName: true, 
            lastName: true, 
            ci: true,
            clinicalDocument: true,
            clinicalNotes: true,
          } 
        },
        doctor: { 
          select: { name: true } 
        },
        items: true 
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error GET treatments:", error);
    return NextResponse.json({ error: "Error al obtener planes" }, { status: 500 });
  }
}

// 2. Crear un nuevo Plan 
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input } = body; 

    if (!input || !input.patientId || !input.name) {
      return NextResponse.json({ error: "Faltan datos obligatorios (Paciente o Nombre)" }, { status: 400 });
    }
    const newPlan = await prisma.treatmentPlan.create({
      data: {
        name: input.name,
        patientId: input.patientId,
        doctorId: input.doctorId,
        status: input.status || "DRAFT",
        totalCost: input.totalCost || 0,
        totalPaid: input.totalPaid || 0,
      }
    });

    return NextResponse.json({ 
      message: "Plan creado exitosamente", 
      plan: newPlan 
    }, { status: 201 });

  } catch (error) {
    console.error("Error POST treatments:", error);
    return NextResponse.json({ error: "Ocurrió un error al crear el plan de tratamiento" }, { status: 500 });
  }
}