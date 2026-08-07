import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = body.input || body;
    const { medications, indications, observations, doctorSignature } = data;

    const updated = await prisma.prescription.update({
      where: { id },
      data: {
        medications,
        indications,
        observations: observations ?? null, 
        ...(doctorSignature && { doctorSignature })
      },
      include: {
        author: {
          select: { id: true, name: true, specialty: true }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error PUT prescription:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// DELETE: Eliminar receta
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.prescription.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}