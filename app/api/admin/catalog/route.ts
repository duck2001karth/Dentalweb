import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const items = await prisma.procedureCatalog.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener el catálogo" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const newItem = await prisma.procedureCatalog.create({
      data: {
        code: body.code || null,
        name: body.name,
        category: body.category,
        basePrice: parseFloat(body.basePrice),
        isActive: body.isActive ?? true
      }
    });
    
    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Error POST Catalog:", error);
    return NextResponse.json({ error: "Error al crear la prestación" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: "Falta el ID del procedimiento" }, { status: 400 });
    if (data.basePrice !== undefined) {
      data.basePrice = parseFloat(data.basePrice);
    }

    const updatedItem = await prisma.procedureCatalog.update({
      where: { id },
      data: data
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar la prestación" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Falta el ID" }, { status: 400 });

    await prisma.procedureCatalog.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Prestación eliminada" });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}