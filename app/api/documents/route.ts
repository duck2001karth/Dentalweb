import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) return NextResponse.json({ error: "Falta el ID" }, { status: 400 });

    const docs = await prisma.patientDocument.findMany({
      where: { patientId },
      include: { author: { select: { name: true } } }, 
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener documentos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patientId, name, type, size, url, authorId } = body;

    const doc = await prisma.patientDocument.create({
      data: { patientId, name, type, size, url, authorId },
    });
    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar el documento" }, { status: 500 });
  }
}