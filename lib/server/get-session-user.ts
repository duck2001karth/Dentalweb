import { getServerSession } from "next-auth"
import { User } from "@prisma/client"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
export async function getSessionUser(): Promise<User> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.isActive !== true) throw new Error("No se encontró una sesión activa")
  const instance = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!instance) throw new Error("Usuario no encontrado en la base de datos")
  if (!instance.isActive || !["ADMIN","DOCTOR","RECEPTIONIST"].includes(instance.role)) throw new Error("Cuenta de usuario desactivada")
  return instance
}
