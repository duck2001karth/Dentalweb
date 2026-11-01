import { createApiHandler } from "@/lib/server/api-handler";
import { prisma } from "@/lib/db";
import { z } from "zod";
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

const createAppointmentSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  startTime: z.string().min(1, "Hora de inicio obligatoria"),
  endTime: z.string().min(1, "Hora de fin obligatoria"),
  patientId: z.string().min(1, "ID de paciente obligatorio"),
  doctorId: z.string().optional().nullable(),
  box: z.string().optional(),
  reason: z.string().optional(),
  status: z.string().optional(),
});

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { user, searchParams }) => {
    const fechaStr = searchParams.get("fecha");
    const doctorIdParam = searchParams.get("doctorId");
    const patientIdParam = searchParams.get("patientId");

    const whereClause: any = {};

    if (patientIdParam) {
      whereClause.patientId = patientIdParam;
    } else {
      if (user.role === "DOCTOR") {
        whereClause.doctorId = user.id;
      } else if (["ADMIN", "RECEPTIONIST"].includes(user.role)) {
        if (doctorIdParam && doctorIdParam.toLowerCase() !== "all") {
          whereClause.doctorId = doctorIdParam;
        }
      }
    }

    if (fechaStr) {
      const { startOfDay, endOfDay } = getClinicDayUtcRange(fechaStr);
      whereClause.date = { gte: startOfDay, lte: endOfDay };
    }

    const citas = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, ci: true, phone: true } },
        doctor: { select: { id: true, name: true, specialty: true, calendarColor: true } },
      },
      orderBy: patientIdParam ? { date: "desc" } : { startTime: "asc" },
    });

    return { citas }; 
  }
);

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
    schema: createAppointmentSchema,
  },
  async (req, { user, data }) => {
    let finalDoctorId = data.doctorId;
    
    if (user.role === "DOCTOR") {
      finalDoctorId = user.id;
    }

    let doctorValido = finalDoctorId
      ? await prisma.user.findUnique({ where: { id: finalDoctorId } })
      : null;

    if (!doctorValido && user.id) {
      doctorValido = await prisma.user.findUnique({ where: { id: user.id, isActive: true } });
    }

    if (!doctorValido || !doctorValido.isActive) {
      throw new Error("Debe asignar un especialista clínico válido y activo para agendar la cita.");
    }

    finalDoctorId = doctorValido.id;

    const { startOfDay, endOfDay, cleanDate } = getClinicDayUtcRange(data.date);
    const newStart = timeToMinutes(data.startTime);
    const newEnd = timeToMinutes(data.endTime);
    const boxAsignado = data.box || "Box 1";

    if (newEnd <= newStart) throw new Error("La hora de fin debe ser posterior a la de inicio");

    const citasDelDia = await prisma.appointment.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CANCELLED"] },
      },
      include: { patient: { select: { firstName: true, lastName: true } } },
    });

    for (const cita of citasDelDia) {
      if (cita.patientId === data.patientId) {
        throw new Error(`El paciente ya cuenta con una cita activa el día de hoy (${cita.startTime} - ${cita.endTime}).`);
      }

      const citaStart = timeToMinutes(cita.startTime);
      const citaEnd = timeToMinutes(cita.endTime);
      const hasOverlap = Math.max(newStart, citaStart) < Math.min(newEnd, citaEnd);

      if (hasOverlap) {
        if (cita.doctorId === finalDoctorId) {
          const nombrePaciente = `${cita.patient?.firstName || ""} ${cita.patient?.lastName || ""}`.trim();
          throw new Error(`El especialista ya tiene una cita de ${cita.startTime} a ${cita.endTime} (${nombrePaciente || "Paciente agendado"}).`);
        }
        if (cita.box === boxAsignado) {
          throw new Error(`El sillón ${boxAsignado} ya está reservado de ${cita.startTime} a ${cita.endTime}.`);
        }
      }
    }

    const citaDateNormalized = new Date(`${cleanDate}T12:00:00.000Z`);
    
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Desconocido";

    const nuevaCita = await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: {
          date: citaDateNormalized,
          startTime: data.startTime,
          endTime: data.endTime,
          box: boxAsignado,
          reason: data.reason || "Consulta general",
          patient: { connect: { id: data.patientId } },
          doctor: { connect: { id: finalDoctorId } },
          status: (data.status as any) || "SCHEDULED",
          payment: "UP_TO_DATE",
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { id: true, name: true, calendarColor: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_APPOINTMENT",
          entity: "APPOINTMENT",
          entityId: created.id,
          patientId: data.patientId,
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
          userAgent,
        },
      });

      return created;
    });

    return { success: true, cita: nuevaCita };
  }
);