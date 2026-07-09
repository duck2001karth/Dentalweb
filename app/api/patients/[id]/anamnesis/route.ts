import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const anamnesis = await prisma.anamnesis.findUnique({
      where: { patientId: params.id },
    });
    return NextResponse.json(anamnesis || { data: null });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener anamnesis" }, { status: 500 });
  }
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();

    const anamnesis = await prisma.anamnesis.upsert({
      where: { patientId: params.id },
      update: { data: body },
      create: {
        patientId: params.id,
        data: body,
      },
    });

    return NextResponse.json(anamnesis);
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar anamnesis" }, { status: 500 });
  }
}