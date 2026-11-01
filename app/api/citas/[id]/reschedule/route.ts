import { createApiHandler } from "@/lib/server/api-handler";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { headers } from "next/headers";

const rescheduleSchema = z.object({
  newDate: z.string().min(1, "La fecha es obligatoria"),
  newTime: z.string().min(1, "La hora es obligatoria"),
  endTime: z.string().optional(),
  reason: z.string().optional(),
  status: z.string().optional(),
  box: z.string().optional(),
});

// PATCH: Reprogramar Cita
export const PATCH = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
    schema: rescheduleSchema,
  },
  async (req, { user, params, data }) => {
    const id = params.id as string;

    const cleanDateStr = data.newDate.includes("T") ? data.newDate.split("T")[0] : data.newDate;
    const combinedDateTime = new Date(`${cleanDateStr}T${data.newTime}:00`);

    if (isNaN(combinedDateTime.getTime())) throw new Error("La fecha enviada es inválida");

    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Desconocido";

    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.appointment.findUnique({
        where: { id },
        include: {
          doctor: { select: { id: true, name: true } },
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (!previous) throw new Error("NOT_FOUND");

      const prevDateStr = previous.date.toISOString().split("T")[0];

      const updated = await tx.appointment.update({
        where: { id },
        data: {
          date: combinedDateTime,
          startTime: data.newTime,
          endTime: data.endTime || data.newTime,
          reason: data.reason !== undefined ? data.reason : previous.reason,
          status: (data.status as any) || "SCHEDULED",
          ...(data.box && { box: data.box }),
        },
        include: {
          doctor: { select: { id: true, name: true } },
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_APPOINTMENT",
          entity: "APPOINTMENT",
          entityId: id,
          patientId: previous.patientId,
          details: `Cita reprogramada del ${prevDateStr} (${previous.startTime}) al ${cleanDateStr} (${data.newTime})`,
          oldData: {
            date: prevDateStr,
            startTime: previous.startTime,
            endTime: previous.endTime,
            reason: previous.reason,
            status: previous.status,
            box: previous.box,
          },
          newData: {
            date: cleanDateStr,
            startTime: updated.startTime,
            endTime: updated.endTime,
            reason: updated.reason,
            status: updated.status,
            box: updated.box,
          },
          ipAddress,
          userAgent
        },
      });

      return updated;
    });

    return { success: true, message: "Cita reprogramada y auditada correctamente", cita: result };
  }
);

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { user, params }) => {
    const id = params.id as string;

    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Desconocido";

    await prisma.$transaction(async (tx) => {
      const previous = await tx.appointment.findUnique({
        where: { id },
        include: {
          doctor: { select: { id: true, name: true } },
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (!previous) throw new Error("NOT_FOUND");

      const citaDateStr = previous.date.toISOString().split("T")[0];

      await tx.appointment.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_APPOINTMENT",
          entity: "APPOINTMENT",
          entityId: id,
          patientId: previous.patientId,
          details: `Cancelación/eliminación de cita del ${citaDateStr} (${previous.startTime} - ${previous.endTime})`,
          oldData: {
            date: citaDateStr,
            startTime: previous.startTime,
            endTime: previous.endTime,
            box: previous.box,
            reason: previous.reason,
            status: previous.status,
            doctorId: previous.doctorId,
            doctorName: previous.doctor?.name,
          },
          ipAddress,
          userAgent
        },
      });
    });

    return { success: true, message: "Cita cancelada y auditada correctamente" };
  }
);