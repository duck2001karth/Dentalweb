import { prisma } from "@/lib/db"

interface LogAuditParams {
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN"
  target?: string
  details: string
  userId?: string | null
  ipAddress?: string | null
}

export async function logAudit({
  action,
  target,
  details,
  userId = null,
  ipAddress = "Local"
}: LogAuditParams) {
  try {
    const formattedDetails = target ? `[${target}] ${details}` : details

    await prisma.auditLog.create({
      data: {
        action,
        details: formattedDetails,
        userId: userId || undefined,
        ipAddress: ipAddress || "127.0.0.1"
      } as any 
    })
  } catch (error) {
    console.error("Error al registrar auditoría:", error)
  }
}