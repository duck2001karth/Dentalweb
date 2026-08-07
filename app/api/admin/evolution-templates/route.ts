import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const templates = await prisma.evolutionTemplate.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error al obtener plantillas:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, text, category } = body;

    if (!name || !text) {
      return NextResponse.json({ error: "Nombre y texto son requeridos" }, { status: 400 });
    }

    const newTemplate = await prisma.evolutionTemplate.create({
      data: {
        name,
        text,
        category: category || "General"
      }
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("Error al crear plantilla:", error);
    return NextResponse.json({ error: "Error al crear plantilla clínica" }, { status: 500 });
  }
}