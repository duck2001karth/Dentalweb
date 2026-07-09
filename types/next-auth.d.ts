import NextAuth, { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;

    role: UserRole;

    phoneNumber?: string | null;

    emailNotifications?: boolean;

    whatsappNotifications?: boolean;

    createdAt?: Date | string;

    specialty?: string | null;
  }

  interface Session {
    user: {
      id: string;

      role: UserRole;

      phoneNumber?: string | null;

      emailNotifications?: boolean;

      whatsappNotifications?: boolean;

      createdAt?: Date | string;

      specialty?: string | null;

    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;

    role: UserRole;

    phoneNumber?: string | null;

    emailNotifications?: boolean;

    whatsappNotifications?: boolean;

    createdAt?: Date | string;

    specialty?: string | null;
  }
}