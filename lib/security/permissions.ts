/** Política central para operaciones nuevas; NO sustituye las verificaciones de propiedad de cada recurso. */
export type Role = "ADMIN" | "DOCTOR" | "RECEPTIONIST"
export type Permission =
  | "patients.read" | "patients.write" | "appointments.read" | "appointments.write"
  | "clinical.read" | "clinical.write" | "documents.read" | "documents.write"
  | "billing.read" | "billing.write" | "inventory.read" | "inventory.write"
  | "admin.users" | "admin.audit" | "admin.backup" | "security.alerts"

const permissions: Record<Role, readonly Permission[]> = {
  ADMIN: ["patients.read", "patients.write", "appointments.read", "appointments.write",
    "clinical.read", "clinical.write", "documents.read", "documents.write",
    "billing.read", "billing.write", "inventory.read", "inventory.write",
    "admin.users", "admin.audit", "admin.backup", "security.alerts"],
  DOCTOR: ["patients.read", "patients.write", "appointments.read", "appointments.write",
    "clinical.read", "clinical.write", "documents.read", "documents.write", "inventory.read"],
  RECEPTIONIST: ["patients.read", "patients.write", "appointments.read", "appointments.write",
    "billing.read", "billing.write", "inventory.read", "inventory.write"],
}

export function can(role: string | undefined | null, permission: Permission): boolean {
  if (role !== "ADMIN" && role !== "DOCTOR" && role !== "RECEPTIONIST") return false
  return permissions[role].includes(permission)
}

export function assertPermission(role: string | undefined | null, permission: Permission): void {
  if (!can(role, permission)) throw new Error("FORBIDDEN")
}
