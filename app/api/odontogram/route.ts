import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "Falta el ID del paciente" }, { status: 400 });
    }

    const records = await prisma.odontogramRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" }, 
    });
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener registros" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { patientId, planId, toothNumber, surfaces, status, isEvolution, authorId } = body;

    if (!patientId) {
      return NextResponse.json({ error: "Falta el ID del paciente." }, { status: 400 });
    }
    const record = await prisma.odontogramRecord.create({
      data: {
        patientId, 
        planId: planId || null, 
        toothNumber: Number(toothNumber),
        surfaces,
        status,
        isEvolution: isEvolution || false,
        authorId: authorId || null,
      }
    });

    console.log("Guardado correctamente:", record.id);
    return NextResponse.json(record);

  } catch (error) {
    console.error("Error en el prisma:", error);
    return NextResponse.json({ error: "Error interno en la base de datos." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    // 1. Verificamos la sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Falta el ID del registro" }, { status: 400 });
    }

    // 2. Buscamos el registro en la base de datos
    const record = await prisma.odontogramRecord.findUnique({
      where: { id }
    });

    if (!record) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }

    // 3. REGLA DE SEGURIDAD (RBAC)
    // Permitimos borrar SI el usuario es ADMIN, O SI el usuario es el autor original del registro
    const isAdmin = session.user.role === "ADMIN";
    const isAuthor = record.authorId === session.user.id;

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: "No tienes permisos para borrar este registro" }, { status: 403 });
    }

    // 4. Procedemos a eliminar
    await prisma.odontogramRecord.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Registro anulado correctamente" });

  } catch (error) {
    console.error("Error DELETE Odontogram:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}