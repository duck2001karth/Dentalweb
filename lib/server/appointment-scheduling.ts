import type { Prisma } from "@prisma/client"

export const clinicDateSchemaPattern = /^\d{4}-\d{2}-\d{2}$/
export const clinicTimeSchemaPattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/

export function clinicDate(value: string): string | null {
  const date = value.slice(0, 10)
  if (!clinicDateSchemaPattern.test(date)) return null
  const parsed = new Date(`${date}T12:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date ? null : date
}

export function minutes(value: string): number {
  if (!clinicTimeSchemaPattern.test(value)) return NaN
  const [hours, mins] = value.split(":").map(Number)
  return hours * 60 + mins
}

export function validInterval(start: string, end: string): boolean {
  return Number.isFinite(minutes(start)) && Number.isFinite(minutes(end)) && minutes(end) > minutes(start)
}

export function intervalsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return Math.max(minutes(aStart), minutes(bStart)) < Math.min(minutes(aEnd), minutes(bEnd))
}

export function dateRange(date: string) {
  return {
    gte: new Date(`${date}T00:00:00.000Z`),
    lt: new Date(new Date(`${date}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000),
  }
}

export function storedDate(date: string): Date {
  return new Date(`${date}T12:00:00.000Z`)
}

export async function lockAppointmentDay(tx: Prisma.TransactionClient, date: string) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`dentalweb:appointments:${date}`})) IS NULL AS acquired`
}

export type ScheduledSlot = {
  id: string
  patientId: string
  doctorId: string
  box: string | null
  startTime: string
  endTime: string
}

export function conflictMessage(
  existing: ScheduledSlot[],
  proposed: { patientId: string; doctorId: string; box: string; startTime: string; endTime: string },
  excludedId?: string,
): string | null {
  for (const slot of existing) {
    if (slot.id === excludedId) continue
    if (slot.patientId === proposed.patientId) {
      return `El paciente ya tiene una cita activa ese día (${slot.startTime} - ${slot.endTime}).`
    }
    if (!validInterval(slot.startTime, slot.endTime)) continue
    if (!intervalsOverlap(proposed.startTime, proposed.endTime, slot.startTime, slot.endTime)) continue
    if (slot.doctorId === proposed.doctorId) {
      return `El especialista ya tiene una cita de ${slot.startTime} a ${slot.endTime}.`
    }
    if ((slot.box || "Box 1") === proposed.box) {
      return `El sillón ${proposed.box} ya está reservado de ${slot.startTime} a ${slot.endTime}.`
    }
  }
  return null
}
