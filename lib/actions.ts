"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function updateUserSettings(data: {
  phoneNumber?: string;
  emailNotifications?: boolean;
  whatsappNotifications?: boolean;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) return { error: "No autorizado" };

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        phoneNumber: data.phoneNumber,
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    return { error: "No se pudo actualizar el perfil" };
  }
}