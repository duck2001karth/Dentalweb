//import { auth } from "@/auth" 
import { headers } from "next/headers" 
import { prisma } from "@/lib/db"

export enum ACTION {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  ERROR = "ERROR"
}

interface Props {
  action: string // Ej: "CREATE_PROJECT"
  details: string // Ej: "Creó el proyecto 'Tesis'"
}

export const createAuditLog = async ({ action, details }: Props) => {
  try {
    // Obtener IP (Opcional)
    const headersList = headers()
    const ip = (await headersList).get("x-forwarded-for") || "::1"

    // 2. Crear el registro
    // IMPORTANTE: Necesitas pasar el userId real. 
    // Si tu función de crear proyecto ya tiene el userId, pásalo aquí.
    
  } catch (error) {
    console.log("[AUDIT_LOG_ERROR]", error)
  }
}

// Versión simplificada para usar dentro de tus Server Actions existentes
export const logAction = async (userId: string, action: string, details: string) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress: "::1", // Simplificado
      }
    })
  } catch (e) {
    console.error("Error creando log:", e)
  }
}