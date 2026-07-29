import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "Falta el ID del paciente" }, { status: 400 });
    }

    const records = await prisma.odontogramRecord.findMany({
      where: { patientId },
      include: {
        author: {
          select: { name: true, image: true } 
        }
      },
      orderBy: { createdAt: "desc" }, 
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error al obtener registros del odontograma:", error);
    return NextResponse.json({ error: "Error al obtener registros" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const { 
      patientId, 
      planId, 
      toothNumber, 
      surfaces, 
      status, 
      isEvolution, 
      authorId,
      notes,
      comments 
    } = body;

    if (!patientId) {
      return NextResponse.json({ error: "Falta el ID del paciente." }, { status: 400 });
    }

    const currentAuthorId = authorId || (session?.user as any)?.id;

    if (!currentAuthorId) {
      return NextResponse.json({ error: "No se identificó al autor del registro." }, { status: 400 });
    }

    const record = await prisma.odontogramRecord.create({
      data: {
        patientId, 
        planId: planId || null, 
        toothNumber: Number(toothNumber),
        surfaces: Array.isArray(surfaces) ? surfaces : [surfaces],
        status,
        notes: notes || comments || null, 
        isEvolution: isEvolution || false,
        authorId: currentAuthorId,
      },
      include: {
        author: {
          select: { name: true }
        }
      }
    });

    console.log("Guardado correctamente:", record.id);
    return NextResponse.json(record, { status: 201 });

  } catch (error) {
    console.error("Error en Prisma Odontogram POST:", error);
    return NextResponse.json({ error: "Error interno en la base de datos." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const id = searchParams.get("id");
    const patientId = searchParams.get("patientId");
    const toothNumber = searchParams.get("toothNumber");

    if (id) {
      await prisma.odontogramRecord.delete({
        where: { id: id }
      });
      return NextResponse.json({ success: true, message: "Registro anulado" });
    }

    if (patientId && toothNumber) {
      await prisma.odontogramRecord.deleteMany({
        where: {
          patientId: patientId,
          toothNumber: parseInt(toothNumber, 10)
        }
      });
      return NextResponse.json({ success: true, message: "Pieza saneada" });
    }

    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });

  } catch (error) {
    console.error("Error eliminando registro del odontograma:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}