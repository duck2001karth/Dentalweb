import { z } from "zod"

const optionalText = (maximum: number) => z.string().trim().max(maximum).nullish()
const requiredText = (maximum: number) => z.string().trim().min(1).max(maximum)
const birthDate = z.union([z.string(), z.date(), z.null()]).optional().refine(
  value => value == null || (Number.isFinite(new Date(value).getTime()) && new Date(value).getTime() <= Date.now()),
  "Fecha de nacimiento inválida o futura",
)

export const patientFields = z.object({
  firstName: requiredText(120).optional(), lastName: requiredText(120).optional(),
  ci: requiredText(60).optional(), rut: requiredText(60).optional(),
  birthDate,
  email: optionalText(254).refine(v => !v || z.string().email().safeParse(v).success, "Correo inválido"),
  phone: optionalText(60), address: optionalText(500),
  tipoRegistro: optionalText(100), cedulaAcudiente: optionalText(60), tipoIdentificacion: optionalText(100),
  nombreSocial: optionalText(150), sexo: optionalText(80), grupoSanguineo: optionalText(30),
  pertenenciaEtnica: optionalText(100), estadoCivil: optionalText(80), nivelEducativo: optionalText(100),
  profesion: optionalText(150), tipoPaciente: optionalText(100), eps: optionalText(150),
  ciudad: optionalText(150), departamento: optionalText(150), zonaResidencia: optionalText(150),
  telefonoFijo: optionalText(60), nombreAcompanante: optionalText(150), telefonoAcompanante: optionalText(60),
  nombreResponsable: optionalText(150), convenio: optionalText(150), gestante: z.boolean().optional(),
  observaciones: optionalText(10000), medicalAlerts: optionalText(10000),
}).strict()

export function readPatientInput(raw: unknown) {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "input" in raw) return (raw as {input: unknown}).input
  return raw
}

export function dateOrNull(value: string | Date | null | undefined) {
  return value == null || value === "" ? null : new Date(value)
}
