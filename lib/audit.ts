import { prisma } from "@/lib/db"
import { headers } from "next/headers"

interface CreateAuditLogParams {
  userId: string
  action: string 
  entity: string
  entityId: string
  patientId?: string | null
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
    console.error("[AUDIT_LOG_ERROR] Fallo al registrar auditoría:", error)
  }
}