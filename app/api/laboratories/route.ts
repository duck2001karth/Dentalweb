import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const labs = await prisma.laboratory.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(labs, { status: 200 });
  } catch (error) {
    console.error("Error al cargar laboratorios:", error);
    return NextResponse.json({ error: "Error al cargar laboratorios" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = String((session?.user as any)?.role || "").toUpperCase();

    // RBAC: Solo Administradores
    if (userRole !== "ADMIN" && userRole !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Solo administradores pueden crear laboratorios." }, { status: 403 });
    }

    const body = await request.json();
    const { name, details, balance, contactPerson, phone, email, address, notes, isActive } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "El nombre del laboratorio es requerido" }, { status: 400 });
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

    await logAuditEvent({
      userId: (session!.user as any).id,
      action: "CREATE",
      entity: "LABORATORY",
      entityId: newLab.id,
      details: `Creación de laboratorio externo: "${newLab.name}"`,
    });

    return NextResponse.json(newLab, { status: 201 });
  } catch (error) {
    console.error("Error al crear laboratorio:", error);
    return NextResponse.json({ error: "Error al crear laboratorio" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = String((session?.user as any)?.role || "").toUpperCase();

    if (userRole !== "ADMIN" && userRole !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado para modificar laboratorios." }, { status: 403 });
    }

    const body = await request.json();
    const { id, balance, name, details, contactPerson, phone, email, address, notes, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "El ID del laboratorio es obligatorio" }, { status: 400 });
    }

    const previousLab = await prisma.laboratory.findUnique({ where: { id } });
    if (!previousLab) return NextResponse.json({ error: "Laboratorio no encontrado" }, { status: 404 });

    const safeData: any = {
      ...(name !== undefined && { name }),
      ...(details !== undefined && { details }),
      ...(contactPerson !== undefined && { contactPerson }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address }),
      ...(notes !== undefined && { notes }),
      ...(isActive !== undefined && { isActive }),
      ...(balance !== undefined && { balance: Number(balance) || 0 }),
    };

    const updatedLab = await prisma.laboratory.update({
      where: { id },
      data: safeData,
    });

    await logAuditEvent({
      userId: (session!.user as any).id,
      action: "UPDATE",
      entity: "LABORATORY",
      entityId: id,
      details: `Actualización de laboratorio: "${updatedLab.name}"`,
      oldData: previousLab,
      newData: updatedLab,
    });

    return NextResponse.json(updatedLab, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar laboratorio:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}