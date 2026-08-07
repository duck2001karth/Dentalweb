import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const anamnesis = await prisma.anamnesis.findFirst({
      where: { patientId: id },
    });

    if (!anamnesis) {
      return NextResponse.json(
        {
          reasons: [],
          medications: [],
          allergies: [],
          observations: "",
          patientId: id,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(anamnesis, { status: 200 });
  } catch (error) {
    console.error("Error al obtener anamnesis:", error);
    return NextResponse.json(
      { error: "Error al cargar la ficha médica" },
      { status: 500 }
    );
  }
}