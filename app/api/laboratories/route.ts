import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const labs = await prisma.laboratory.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(labs, { status: 200 });
  } catch (error) {
    console.error("Error al cargar laboratorios:", error);
    return NextResponse.json(
      { error: "Error al cargar laboratorios" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, details, balance, contactPerson, phone, email, address, notes, isActive } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre del laboratorio es requerido" },
        { status: 400 }
      );
    }

    const newLab = await prisma.laboratory.create({
      data: {
        name,
        details,
        balance: Number(balance) || 0,
        contactPerson,
        phone,
        email,
        address,
        notes,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(newLab, { status: 201 });
  } catch (error) {
    console.error("Error al crear laboratorio:", error);
    return NextResponse.json(
      { error: "Error al crear laboratorio" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, balance, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "El ID del laboratorio es obligatorio" },
        { status: 400 }
      );
    }

    const updatedLab = await prisma.laboratory.update({
      where: { id },
      data: {
        ...data,
        ...(balance !== undefined && { balance: Number(balance) || 0 }),
      },
    });

    return NextResponse.json(updatedLab, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar laboratorio:", error);
    return NextResponse.json(
      { error: "Error al actualizar" },
      { status: 500 }
    );
  }
}