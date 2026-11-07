import { prisma } from "@/lib/db"
import { headers } from "next/headers"
import { Prisma } from "@prisma/client"

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

const SENSITIVE_KEYS = new Set([
  "password", "passwordhash", "token", "sessiontoken", "accesstoken",
  "refreshtoken", "idtoken", "secret", "apikey", "authorization",
  "cookie", "signaturebase64", "professionalsignature", "patientsignature",
  "doctorsignature", "sealstampurl", "medicalalerts", "observaciones",
  "anamnesis", "medications", "indications", "clinicalcontent",
  "receiptimage", "fileurl", "xmlurl", "ridepdfurl",
])

const REDACTED = "[DATO PROTEGIDO]"

function sanitize(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value ?? null
  if (depth >= 8) return "[ESTRUCTURA OMITIDA]"
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) {
    return value.slice(0, 100).map((item) => sanitize(item, depth + 1))
  }
  if (typeof value === "object") {
    const output: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value).slice(0, 150)) {
      const normalized = key.replace(/[^a-z0-9]/gi, "").toLowerCase()
      output[key] = SENSITIVE_KEYS.has(normalized) ? REDACTED : sanitize(entry, depth + 1)
    }
    return output
  }
  if (typeof value === "string" && value.length > 4000) {
    return `${value.slice(0, 4000)}[TRUNCADO]`
  }
  return value
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
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = (headersList.get("user-agent") || "Desconocido").slice(0, 512)

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        patientId,
        details: details?.slice(0, 2000),
        oldData: oldData == null ? undefined
            : (sanitize(oldData) as Prisma.InputJsonValue),

        newData: newData == null ? undefined : (sanitize(newData) as Prisma.InputJsonValue),
        ipAddress: ipAddress.slice(0, 128),
        userAgent,
      },
    })
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR] Fallo al registrar auditoría:", error)
  }
}
