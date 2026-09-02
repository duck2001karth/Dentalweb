import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
async function createAuditEntry(
  tx: any,
  data: {
    userId: string;
    action: "CREATE" | "UPDATE" | "DELETE";
    entityId: string;
    patientId?: string | null;
    details?: string;
    oldData?: any;
    newData?: any;
  }
) {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Desconocido";

    await tx.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: "APPOINTMENT",
        entityId: data.entityId,
        patientId: data.patientId || null,
        details: data.details || null,
        oldData: data.oldData || null,
        newData: data.newData || null,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error("Error al registrar auditoría en Citas:", err);
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userId = session.user.id as string;

    const { searchParams } = new URL(request.url);
    const fechaStr = searchParams.get("fecha");
    const doctorIdParam = searchParams.get("doctorId");
    const patientIdParam = searchParams.get("patientId");

    const whereClause: any = {};

    if (patientIdParam) {
      whereClause.patientId = patientIdParam;
    } else {
      if (userRole === "DOCTOR") {
        whereClause.doctorId = userId;
      } else if (
        userRole === "ADMIN" ||
        userRole === "ADMINISTRADOR" ||
        userRole === "RECEPTIONIST" ||
        userRole === "RECEPCIONISTA"
      ) {
        if (doctorIdParam && doctorIdParam !== "all") {
          whereClause.doctorId = doctorIdParam;
        }
      }
    }

    if (fechaStr) {
      const startOfDay = new Date(`${fechaStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${fechaStr}T23:59:59.999Z`);
      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const citas = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            ci: true,
            phone: true,
          },
        },
        doctor: {
          select: { id: true, name: true, specialty: true },
        },
      },
      orderBy: patientIdParam ? { date: "desc" } : { startTime: "asc" },
    });

    return NextResponse.json({ citas });
  } catch (error) {
    console.error("[CITAS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Error interno al obtener citas" },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const input = body.input || body;

    if (!input || !input.date || !input.startTime || !input.endTime || !input.patientId) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios para agendar la cita" },
        { status: 400 }
      );
    }

    const citaDate = new Date(input.date);
    const userRole = session.user.role as string;
    const userId = session.user.id as string;

    let finalDoctorId = input.doctorId;

    if (userRole === "DOCTOR") {
      finalDoctorId = userId;
    }

    let doctorValido = finalDoctorId
      ? await prisma.user.findUnique({ where: { id: finalDoctorId } })
      : null;

    if (!doctorValido && userId) {
      doctorValido = await prisma.user.findUnique({ where: { id: userId } });
    }

    if (!doctorValido) {
      doctorValido = await prisma.user.findFirst({ where: { role: "DOCTOR" } });
    }

    if (!doctorValido) {
      doctorValido = await prisma.user.create({
        data: {
          id: userId ? userId : undefined,
          name: session.user.name || "Dr. Asignado (Sistema)",
          email: session.user.email || `doctor_${Date.now()}@carmodental.com`,
          role: "DOCTOR",
          isActive: true,
        },
      });
    }

    finalDoctorId = doctorValido.id;

    const nuevaCita = await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: {
          date: citaDate,
          startTime: input.startTime,
          endTime: input.endTime,
          box: input.box || "Box 1",
          reason: input.reason || "Consulta general",
          patient: { connect: { id: input.patientId } },
          doctor: { connect: { id: finalDoctorId } },
          status: "SCHEDULED",
          payment: "UP_TO_DATE",
        },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          doctor: {
            select: { id: true, name: true },
          },
        },
      });

      const formattedDate = citaDate.toISOString().split("T")[0];

      await createAuditEntry(tx, {
        userId,
        action: "CREATE",
        entityId: created.id,
        patientId: input.patientId,
        details: `Cita agendada para el ${formattedDate} (${created.startTime} - ${created.endTime}) con ${created.doctor?.name || "Dr. Asignado"}`,
        newData: {
          date: formattedDate,
          startTime: created.startTime,
          endTime: created.endTime,
          box: created.box,
          reason: created.reason,
          doctorId: finalDoctorId,
          doctorName: created.doctor?.name,
          status: created.status,
          payment: created.payment,
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, cita: nuevaCita }, { status: 201 });
  } catch (error: any) {
    console.error("[CITAS_POST_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Error al crear la cita en la base de datos" },
      { status: 500 }
    );
  }
}