import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Obtener recetas del paciente
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "Falta patientId" }, { status: 400 });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId },
      include: {
        author: {
          select: { id: true, name: true, specialty: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error("Error GET prescriptions:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Crear receta (Guarda observations explícitamente)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Soporta tanto body directo como body.input
    const data = body.input || body;
    const { patientId, medications, indications, observations, authorId } = data;

    if (!patientId) {
      return NextResponse.json({ error: "patientId es requerido" }, { status: 400 });
    }

    const newPrescription = await prisma.prescription.create({
      data: {
        patientId,
        medications: medications || "",
        indications: indications || "",
        observations: observations || null, // GUARDA LAS OBSERVACIONES
        authorId: authorId || null
      },
      include: {
        author: {
          select: { id: true, name: true, specialty: true }
        }
      }
    });

    return NextResponse.json(newPrescription, { status: 201 });
  } catch (error) {
    console.error("Error POST prescription:", error);
    return NextResponse.json({ error: "Error al guardar receta" }, { status: 500 });
  }
}