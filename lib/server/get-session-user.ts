import { getServerSession } from "next-auth"
import { User } from "@prisma/client" 

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function getSessionUser(): Promise<User> { 
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    throw new Error("No se encontró una sesión activa")
  }
  const instance = await prisma.user.findUnique({ 
    where: {
      email: session.user.email,
    },
  })

  if (!instance) {
    throw new Error("Usuario no encontrado en la base de datos")
  }

  return instance
}