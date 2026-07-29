import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Obtener todas las plantillas activas
export async function GET() {
  try {
    // Si tienes un modelo de Prisma 'EvolutionTemplate', lo consulta; 
    // de lo contrario, si usas una tabla genérica o catálogo, ajusta la llamada.
    const templates = await prisma.evolutionTemplate.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json(templates);
  } catch (error) {
    // Si aún no migraste el modelo en Prisma, manejamos una respuesta vacía o de fallback limpio
    console.error("Error al obtener plantillas:", error);
    return NextResponse.json([]);
  }
}

// POST: El Administrador crea una nueva plantilla
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