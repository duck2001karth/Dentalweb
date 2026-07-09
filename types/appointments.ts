import { z } from "zod"


export const AppointmentStatusEnum = z.enum(["SCHEDULED", "WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"])
export const PaymentStatusEnum = z.enum(["UP_TO_DATE", "DEBT", "EVALUATION"])

// --- 1. DEFINICIONES BÁSICAS ---

export const appointmentSchema = z.object({
  id: z.string(),
  date: z.date().or(z.string()),
  startTime: z.string(),
  endTime: z.string(),
  status: AppointmentStatusEnum.optional().default("SCHEDULED"),
  payment: PaymentStatusEnum.optional().default("UP_TO_DATE"),
  box: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  patientId: z.string(),
  doctorId: z.string(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
})
export type Appointment = z.infer<typeof appointmentSchema>

// Definición de Paciente Básico (Para anidarlo en la cita)
export const patientBasicSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  ci: z.string(),
  phone: z.string().nullable().optional(),
})

// Definición de Doctor Básico (Para anidarlo en la cita)
export const doctorBasicSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
})

// Cita Completa (Lo que enviamos a la Interfaz con los datos del paciente y doctor)
export const appointmentWithDetailsSchema = appointmentSchema.extend({
  patient: patientBasicSchema.optional(),
  doctor: doctorBasicSchema.optional(),
})
export type AppointmentWithDetails = z.infer<typeof appointmentWithDetailsSchema>


// --- 2. INPUTS PARA CREAR/EDITAR ---

export const appointmentInputSchema = z.object({
  date: z.string().or(z.date()), 
  startTime: z.string(),
  endTime: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  box: z.string().optional(),
  reason: z.string().optional(),
})
export type AppointmentInput = z.infer<typeof appointmentInputSchema>

export const updateAppointmentInputSchema = z.object({
  status: AppointmentStatusEnum.optional(),
  payment: PaymentStatusEnum.optional(),
  box: z.string().optional(),
  reason: z.string().optional(),
  date: z.date().or(z.string()).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentInputSchema>