export { patientFields, createPatientFields } from "@/lib/patient-registration"

export function readPatientInput(raw: unknown) {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "input" in raw) return (raw as { input: unknown }).input
  return raw
}

export function dateOrNull(value: string | Date | null | undefined) {
  if (value == null || value === "") return null
  const day = typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10)
  return new Date(`${day}T00:00:00.000Z`)
}
