import { prisma } from "@/lib/db"
import { headers } from "next/headers"

interface CreateAuditLogParams {
  userId: string
  action: "CREATE" | "UPDATE" | "DELETE"
  entity: "ODONTOGRAM" | "PERIODONTOGRAM" | "CLINICAL_NOTE" | "PATIENT_DOCUMENT" | "TREATMENT_PLAN"
  entityId: string
  patientId?: string
  details?: string
  oldData?: Record<string, any> | null
  newData?: Record<string, any> | null
}

export async function logAuditEvent({
  userId,
  action,
  entity,
  entityId,
  patientId,
  details,
  oldData = null,
  newData = null,
}: CreateAuditLogParams) {
  try {
    const headersList = await headers()
    
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        patientId,
        details,
        oldData: oldData ?? undefined,
        newData: newData ?? undefined,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error("Error al registrar auditoría:", error)
  }
}