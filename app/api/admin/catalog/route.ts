import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/log";

export async function GET(req: Request) {
  try {
    const items = await prisma.procedureCatalog.findMany({
      orderBy: [
        { category: "asc" },
        { name: "asc" }
      ]
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener el catálogo" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const ip = req.headers.get("x-forwarded-for") || "Local";
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

    await logAudit({
      action: "CREATE",
      target: "Catálogo",
      details: `Nueva prestación creada: "${newItem.name}" (${newItem.category}) - $${newItem.basePrice}`,
      userId: session?.user?.id,
      ipAddress: ip
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error POST Catalog:", error);
    return NextResponse.json({ error: "Error al crear la prestación" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const ip = req.headers.get("x-forwarded-for") || "Local";
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

    await logAudit({
      action: "UPDATE",
      target: "Catálogo",
      details: `Prestación modificada: "${updatedItem.name}" (${updatedItem.category})`,
      userId: session?.user?.id,
      ipAddress: ip
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar la prestación" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const ip = req.headers.get("x-forwarded-for") || "Local";
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Falta el ID" }, { status: 400 });

    const deletedProcedure = await prisma.procedureCatalog.findUnique({
      where: { id }
    });

    await prisma.procedureCatalog.delete({
      where: { id }
    });

    await logAudit({
      action: "DELETE",
      target: "Catálogo",
      details: `Prestación eliminada del catálogo: "${deletedProcedure?.name || id}"`,
      userId: session?.user?.id,
      ipAddress: ip
    });

    return NextResponse.json({ success: true, message: "Prestación eliminada" });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}