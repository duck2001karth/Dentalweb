import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getClinicDayUtcRange(fechaStr: string) {
  const cleanDate = fechaStr.slice(0, 10);
  const startOfDay = new Date(`${cleanDate}T05:00:00.000Z`);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { startOfDay, endOfDay, cleanDate };
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
        if (doctorIdParam && doctorIdParam !== "all" && doctorIdParam !== "ALL") {
          whereClause.doctorId = doctorIdParam;
        }
      }
    }

    if (fechaStr) {
      const { startOfDay, endOfDay } = getClinicDayUtcRange(fechaStr);
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
          select: { id: true, name: true, specialty: true, calendarColor: true },
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
      doctorValido = await prisma.user.findUnique({ where: { id: userId, isActive: true } });
    }

    if (!doctorValido || !doctorValido.isActive) {
      return NextResponse.json(
        { error: "Debe asignar un especialista clínico válido y activo para agendar la cita." },
        { status: 400 }
      );
    }

    finalDoctorId = doctorValido.id;
    const dateString = typeof input.date === "string" ? input.date : new Date(input.date).toISOString();
    const { startOfDay, endOfDay, cleanDate } = getClinicDayUtcRange(dateString);

    const newStart = timeToMinutes(input.startTime);
    const newEnd = timeToMinutes(input.endTime);
    const boxAsignado = input.box || "Box 1";

    if (newEnd <= newStart) {
      return NextResponse.json(
        { error: "La hora de fin debe ser posterior a la de inicio" },
        { status: 400 }
      );
    }
    const citasDelDia = await prisma.appointment.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CANCELLED"] },
      },
      include: {
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    for (const cita of citasDelDia) {
      if (cita.patientId === input.patientId) {
        return NextResponse.json(
          { error: `El paciente ya cuenta con una cita activa el día de hoy (${cita.startTime} - ${cita.endTime}).` },
          { status: 400 }
        );
      }

      const citaStart = timeToMinutes(cita.startTime);
      const citaEnd = timeToMinutes(cita.endTime);
      const hasOverlap = Math.max(newStart, citaStart) < Math.min(newEnd, citaEnd);

      if (hasOverlap) {
        if (cita.doctorId === finalDoctorId) {
          const nombrePaciente = `${cita.patient?.firstName || ""} ${cita.patient?.lastName || ""}`.trim();
          return NextResponse.json(
            { error: `El especialista ya tiene una cita de ${cita.startTime} a ${cita.endTime} (${nombrePaciente || "Paciente agendado"}).` },
            { status: 400 }
          );
        }
        if (cita.box === boxAsignado) {
          return NextResponse.json(
            { error: `El sillón ${boxAsignado} ya está reservado de ${cita.startTime} a ${cita.endTime}.` },
            { status: 400 }
          );
        }
      }
    }

    const citaDateNormalized = new Date(`${cleanDate}T12:00:00.000Z`);

    const nuevaCita = await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: {
          date: citaDateNormalized,
          startTime: input.startTime,
          endTime: input.endTime,
          box: boxAsignado,
          reason: input.reason || "Consulta general",
          patient: { connect: { id: input.patientId } },
          doctor: { connect: { id: finalDoctorId } },
          status: input.status || "SCHEDULED",
          payment: "UP_TO_DATE",
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { id: true, name: true, calendarColor: true } },
        },
      });

      const headersList = await headers();
      const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1";
      
      await tx.auditLog.create({
        data: {
          userId,
          action: "CREATE",
          entity: "APPOINTMENT",
          entityId: created.id,
          patientId: input.patientId,
          details: `Cita agendada para el ${cleanDate} (${created.startTime} - ${created.endTime}) con ${created.doctor?.name}`,
          newData: {
            date: cleanDate,
            startTime: created.startTime,
            endTime: created.endTime,
            box: created.box,
            doctorId: finalDoctorId,
            status: created.status,
          },
          ipAddress,
          userAgent: headersList.get("user-agent") || "Desconocido",
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