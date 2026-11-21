import { AppointmentStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import {
  clinicDate, conflictMessage, dateRange, lockAppointmentDay, minutes, storedDate, validInterval,
} from "@/lib/server/appointment-scheduling"

const schema = z.object({
  newDate: z.string().min(10).max(40),
  newTime: z.string(),
  endTime: z.string(),
  reason: z.string().trim().max(1000).optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  box: z.string().trim().min(1).max(100).optional(),
  sendWhatsapp: z.boolean().optional(), // Se acepta por compatibilidad; no envía mensajes.
}).strict()

const responseError = (message: string, status: number) => NextResponse.json({ error: message }, { status })

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema },
  async (_req, { user, params, data }) => {
    const id = params.id as string
    const day = clinicDate(data.newDate)
    if (!day) return responseError("Fecha inválida. Utilice AAAA-MM-DD.", 422)
    if (!validInterval(data.newTime, data.endTime)) {
      return responseError("Horario inválido: HH:mm, con hora de fin posterior al inicio.", 422)
    }
    if (minutes(data.endTime) - minutes(data.newTime) > 12 * 60) {
      return responseError("La duración máxima de una cita es de 12 horas.", 422)
    }

    const h = await headers()
    const ipAddress = (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "Desconocido").slice(0, 128)
    const userAgent = (h.get("user-agent") || "Desconocido").slice(0, 512)

    // Bloqueamos las fechas implicadas en orden fijo para evitar deadlocks entre
    // dos reprogramaciones cruzadas; la lectura ocurre DESPUÉS del bloqueo.
    const result = await prisma.$transaction(async (tx) => {
      const original = await tx.appointment.findUnique({ where: { id } })
      if (!original) return { error: "Cita no encontrada", code: 404 } as const
      if (user.role === "DOCTOR" && original.doctorId !== user.id) {
        return { error: "Solo puede reprogramar sus propias citas", code: 403 } as const
      }
      if (["COMPLETED", "CANCELLED"].includes(original.status)) {
        return { error: "No se pueden reprogramar citas finalizadas o canceladas", code: 409 } as const
      }
      if (data.status && data.status !== "SCHEDULED") {
        return { error: "El estado de una cita reprogramada debe ser SCHEDULED", code: 422 } as const
      }

      const oldDay = original.date.toISOString().slice(0, 10)
      for (const lockDay of [...new Set([oldDay, day])].sort()) {
        await lockAppointmentDay(tx, lockDay)
      }
      // Releer bajo el bloqueo por si otro proceso cambió la cita entretanto.
      const previous = await tx.appointment.findUnique({ where: { id } })
      if (!previous) return { error: "Cita no encontrada", code: 404 } as const
      if (previous.date.toISOString().slice(0, 10) !== oldDay) {
        return { error: "La cita fue modificada; actualice la agenda e intente otra vez", code: 409 } as const
      }
      if (user.role === "DOCTOR" && previous.doctorId !== user.id) {
        return { error: "Solo puede reprogramar sus propias citas", code: 403 } as const
      }
      if (["COMPLETED", "CANCELLED"].includes(previous.status)) {
        return { error: "No se pueden reprogramar citas finalizadas o canceladas", code: 409 } as const
      }

      const box = data.box ?? previous.box ?? "Box 1"
      const existing = await tx.appointment.findMany({
        where: { date: dateRange(day), status: { not: "CANCELLED" }, id: { not: id } },
        select: { id: true, patientId: true, doctorId: true, box: true, startTime: true, endTime: true },
      })
      const conflict = conflictMessage(existing, {
        patientId: previous.patientId, doctorId: previous.doctorId,
        box, startTime: data.newTime, endTime: data.endTime,
      }, id)
      if (conflict) return { error: conflict, code: 409 } as const

      const updated = await tx.appointment.update({
        where: { id },
        data: {
          date: storedDate(day), startTime: data.newTime, endTime: data.endTime,
          box, status: "SCHEDULED", isRescheduled: true,
          previousDate: previous.date,
          rescheduleReason: data.reason ?? previous.rescheduleReason,
          // El motivo original de consulta se mantiene en `reason`.
        },
        include: {
          doctor: { select: { id: true, name: true } },
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      })
      await tx.auditLog.create({
        data: {
          userId: user.id, action: "UPDATE_APPOINTMENT", entity: "APPOINTMENT",
          entityId: id, patientId: previous.patientId,
          details: `Reprogramación ${oldDay} ${previous.startTime}-${previous.endTime} -> ${day} ${data.newTime}-${data.endTime}`,
          oldData: { date: oldDay, startTime: previous.startTime, endTime: previous.endTime, box: previous.box, status: previous.status },
          newData: { date: day, startTime: updated.startTime, endTime: updated.endTime, box: updated.box, status: updated.status, rescheduleReason: updated.rescheduleReason },
          ipAddress, userAgent,
        },
      })
      return { cita: updated } as const
    })
    if ("error" in result) return responseError(result.error, result.code)
    return { success: true, message: "Cita reprogramada y auditada correctamente", cita: result.cita }
  },
)

// DELETE se mantiene compatible con el comportamiento original del proyecto.
export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { user, params }) => {
    const id = params.id as string
    const h = await headers()
    const ipAddress = (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "Desconocido").slice(0, 128)
    const userAgent = (h.get("user-agent") || "Desconocido").slice(0, 512)
    const result = await prisma.$transaction(async tx => {
      const original = await tx.appointment.findUnique({ where: { id } })
      if (!original) return { error: "Cita no encontrada", code: 404 } as const
      if (user.role === "DOCTOR" && original.doctorId !== user.id) {
        return { error: "Solo puede eliminar sus propias citas", code: 403 } as const
      }
      const day = original.date.toISOString().slice(0, 10)
      await lockAppointmentDay(tx, day)
      const previous = await tx.appointment.findUnique({ where: { id } })
      if (!previous) return { error: "Cita no encontrada", code: 404 } as const
      if (previous.date.toISOString().slice(0, 10) !== day) {
        return { error: "La cita cambió; actualice e intente nuevamente", code: 409 } as const
      }
      if (user.role === "DOCTOR" && previous.doctorId !== user.id) {
        return { error: "Solo puede eliminar sus propias citas", code: 403 } as const
      }
      await tx.appointment.delete({ where: { id } })
      await tx.auditLog.create({
        data: {
          userId: user.id, action: "DELETE_APPOINTMENT", entity: "APPOINTMENT",
          entityId: id, patientId: previous.patientId,
          details: `Cita eliminada ${day} ${previous.startTime}-${previous.endTime}`,
          oldData: { date: day, startTime: previous.startTime, endTime: previous.endTime, box: previous.box, reason: previous.reason, status: previous.status, doctorId: previous.doctorId },
          ipAddress, userAgent,
        },
      })
      return { success: true } as const
    })
    if ("error" in result) return responseError(result.error, result.code)
    return { success: true, message: "Cita cancelada y auditada correctamente" }
  },
)
