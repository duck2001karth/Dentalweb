import { z } from "zod"

export const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const
export const documentTypes = ["Cédula De Ciudadanía", "Tarjeta de Identidad", "Pasaporte"] as const

export function validBirthDate(value: string | Date) {
  const raw = value instanceof Date ? (Number.isFinite(value.getTime()) ? value.toISOString().slice(0, 10) : "") : value
  const day = raw.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false
  // Accept the date-only form and existing ISO timestamps, but reject impossible dates.
  if (raw.length !== 10 && !/^\d{4}-\d{2}-\d{2}T/.test(raw)) return false
  const parsed = new Date(`${day}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day &&
    day >= "1900-01-01" && day <= new Date().toISOString().slice(0, 10) && Number.isFinite(new Date(raw).getTime())
}

export const optionalText = (maximum: number) => z.string().trim().max(maximum, `Máximo ${maximum} caracteres`).nullish()
export const requiredText = (maximum: number) => z.string().trim().min(1, "Este campo es obligatorio").max(maximum, `Máximo ${maximum} caracteres`)
export const identification = requiredText(60).refine(v => /^[A-Za-z0-9][A-Za-z0-9 .-]*$/.test(v) && v.replace(/[^A-Za-z0-9]/g, "").length >= 3, "Documento inválido; revise letras y números")
export const emailField = optionalText(254).refine(v => !v || z.string().email().safeParse(v).success, "Correo electrónico inválido")
export const phoneField = optionalText(60).refine(v => !v || (/^\+?[\d\s().-]+$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15), "Teléfono inválido (7 a 15 dígitos)")
export const birthDateField = z.union([z.string(), z.date(), z.null()]).optional().refine(v => v == null || validBirthDate(v), "Fecha de nacimiento inválida, futura o anterior a 1900")
export const bloodGroupField = optionalText(30).refine(v => !v || v === "DESCONOCIDO" || v === "No determinado" || (bloodGroups as readonly string[]).includes(v), "Grupo sanguíneo inválido").transform(v => v === "DESCONOCIDO" || v === "No determinado" || v === "" ? null : v)

export const patientFields = z.object({
  firstName: requiredText(120).optional(), lastName: requiredText(120).optional(),
  ci: identification.optional(), rut: identification.optional(), birthDate: birthDateField,
  email: emailField, phone: phoneField, address: optionalText(500),
  tipoRegistro: optionalText(100), cedulaAcudiente: optionalText(60), tipoIdentificacion: optionalText(100),
  nombreSocial: optionalText(150), sexo: optionalText(80), grupoSanguineo: bloodGroupField,
  genero: optionalText(80), pertenenciaEtnica: optionalText(100), estadoCivil: optionalText(80), nivelEducativo: optionalText(100),
  profesion: optionalText(150), tipoPaciente: optionalText(100), eps: optionalText(150),
  ciudad: optionalText(150), departamento: optionalText(150), zonaResidencia: optionalText(150),
  telefonoFijo: phoneField, nombreAcompanante: optionalText(150), telefonoAcompanante: phoneField,
  nombreResponsable: optionalText(150), telefonoResponsable: phoneField, parentescoResponsable: optionalText(100),
  convenio: optionalText(150), gestante: z.boolean().optional(),
  observaciones: optionalText(10000), medicalAlerts: optionalText(10000),
}).strict()

// Formato general por tipo, sin asumir nacionalidad ni aplicar un checksum local.
export function documentTypeError(type: string | null | undefined, value: string | null | undefined): string | undefined {
  if (!value) return undefined
  if (type === "Pasaporte" && !/^[A-Za-z0-9]{3,60}$/.test(value.trim())) return "El pasaporte debe contener letras o números, sin espacios ni separadores"
  if ((type === "Cédula De Ciudadanía" || type === "Tarjeta de Identidad") && !/\d/.test(value)) return "La identificación debe contener al menos un número"
  return undefined
}

export const createPatientFields = patientFields.superRefine((v, ctx) => {
  if (!v.firstName) ctx.addIssue({ code: "custom", path: ["firstName"], message: "Ingrese los nombres" })
  if (!v.lastName) ctx.addIssue({ code: "custom", path: ["lastName"], message: "Ingrese los apellidos" })
  if (!v.ci && !v.rut) ctx.addIssue({ code: "custom", path: ["ci"], message: "Ingrese la identificación" })
  if (!v.birthDate) ctx.addIssue({ code: "custom", path: ["birthDate"], message: "Ingrese la fecha de nacimiento" })
  const documentError = documentTypeError(v.tipoIdentificacion, v.ci || v.rut)
  if (documentError) ctx.addIssue({ code: "custom", path: [v.ci ? "ci" : "rut"], message: documentError })
})
