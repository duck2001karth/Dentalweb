import { z } from "zod"

// --- 1. ESQUEMA PRINCIPAL DE PACIENTE ---
export const patientSchema = z.object({
  id: z.string(),
  ci: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  birthDate: z.string().or(z.date()).nullable().optional(),
  address: z.string().nullable().optional(),
  
  // Datos Demográficos y Administrativos
  tipoRegistro: z.string().nullable().optional(),
  cedulaAcudiente: z.string().nullable().optional(),
  tipoIdentificacion: z.string().nullable().optional(),
  nombreSocial: z.string().nullable().optional(),
  sexo: z.string().nullable().optional(),
  grupoSanguineo: z.string().nullable().optional(),
  pertenenciaEtnica: z.string().nullable().optional(),
  estadoCivil: z.string().nullable().optional(),
  nivelEducativo: z.string().nullable().optional(),
  profesion: z.string().nullable().optional(),
  tipoPaciente: z.string().nullable().optional(),
  eps: z.string().nullable().optional(),
  ciudad: z.string().nullable().optional(),
  departamento: z.string().nullable().optional(),
  zonaResidencia: z.string().nullable().optional(),
  telefonoFijo: z.string().nullable().optional(),

  // Acompañantes y Clínico
  nombreAcompanante: z.string().nullable().optional(),
  telefonoAcompanante: z.string().nullable().optional(),
  nombreResponsable: z.string().nullable().optional(),
  telefonoResponsable: z.string().nullable().optional(),
  parentescoResponsable: z.string().nullable().optional(),
  convenio: z.string().nullable().optional(),
  gestante: z.boolean().optional().default(false),
  observaciones: z.string().nullable().optional(),
  medicalAlerts: z.string().nullable().optional(),
  
  signatureBase64: z.string().nullable().optional(),

  isDeleted: z.boolean().optional().default(false),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
})

export type Patient = z.infer<typeof patientSchema>


// --- 2. INPUTS PARA CREAR/EDITAR PACIENTE ---

export const patientInputSchema = patientSchema.omit({
  id: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
})
export type PatientInput = z.infer<typeof patientInputSchema>

export const updatePatientInputSchema = patientInputSchema.partial()
export type UpdatePatientInput = z.infer<typeof updatePatientInputSchema>


// --- 3. ESQUEMA DE PRESCRIPCIÓN / RECETA MÉDICA (NUEVO) ---

export const prescriptionSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  medications: z.string(),
  indications: z.string(),
  observations: z.string().nullable().optional(), // <-- CAMPO OBSERVACIONES AGREGADO
  authorId: z.string().nullable().optional(),
  author: z
    .object({
      id: z.string(),
      name: z.string().nullable().optional(),
      specialty: z.string().nullable().optional(),
    })
    .optional(),
  doctorSignature: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
})

export type Prescription = z.infer<typeof prescriptionSchema>

export const prescriptionInputSchema = prescriptionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export type PrescriptionInput = z.infer<typeof prescriptionInputSchema>

export const updatePrescriptionInputSchema = prescriptionInputSchema.partial().extend({
  id: z.string(),
})
export type UpdatePrescriptionInput = z.infer<typeof updatePrescriptionInputSchema>