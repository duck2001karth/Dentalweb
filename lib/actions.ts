"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import {
  AppError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from "@/backend/app-errors";

export interface UpdateUserSettingsInput {
  phoneNumber?: string;
  image?: string;
  calendarColor?: string;
  currentPassword?: string;
  newPassword?: string;
}

export type ActionResponse<T = undefined> = {
  success?: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
};

export async function updateUserSettings(
  data: UpdateUserSettingsInput
): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      throw new AuthenticationError("Debes iniciar sesión para actualizar tu cuenta.");
    }

    const userEmail = session.user.email.toLowerCase().trim();

    const currentUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!currentUser) {
      throw new NotFoundError("El usuario actual no existe en el sistema.");
    }

    if (!currentUser.isActive) {
      throw new AuthenticationError("Tu cuenta ha sido desactivada. Contacta al administrador.");
    }

    const updateData: {
      phoneNumber?: string;
      image?: string;
      calendarColor?: string;
      password?: string;
    } = {};
    if (data.phoneNumber !== undefined) {
      updateData.phoneNumber = data.phoneNumber.trim();
    }
    if (data.image !== undefined) {
      if (
        data.image && 
        !data.image.startsWith("https://") && 
        !data.image.startsWith("data:image/")
      ) {
        throw new ValidationError("La imagen proporcionada no tiene un formato o URL segura.");
      }
      updateData.image = data.image;
    }
    if (data.calendarColor !== undefined) {
      if (data.calendarColor && !/^#[0-9A-Fa-f]{6}$/i.test(data.calendarColor)) {
        throw new ValidationError("El color del calendario debe ser un código hexadecimal válido (ej. #008bcd).");
      }
      updateData.calendarColor = data.calendarColor;
    }
    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new ValidationError("Debes ingresar tu contraseña actual para establecer una nueva.");
      }

      if (currentUser.password) {
        const isPasswordCorrect = await bcrypt.compare(
          data.currentPassword,
          currentUser.password
        );

        if (!isPasswordCorrect) {
          throw new ValidationError("La contraseña actual proporcionada es incorrecta.");
        }
      }

      if (data.newPassword.length < 6) {
        throw new ValidationError("La nueva contraseña debe contener al menos 6 caracteres.");
      }

      updateData.password = await bcrypt.hash(data.newPassword, 10);
    }
    await prisma.user.update({
      where: { email: userEmail },
      data: updateData,
    });
    revalidatePath("/");

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return {
        error: error.message,
        statusCode: error.statusCode,
      };
    }

    console.error("[ACTIONS] Error crítico en updateUserSettings:", error);
    
    return {
      error: "Ocurrió un error inesperado al intentar actualizar tu cuenta.",
      statusCode: 500,
    };
  }
}