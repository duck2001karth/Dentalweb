import NextAuth, { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    isActive: boolean;
    phoneNumber?: string | null;
    specialty?: string | null;
    createdAt?: Date | string;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      isActive: boolean;
      phoneNumber?: string | null;
      specialty?: string | null;
      createdAt?: Date | string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    isActive: boolean;
    phoneNumber?: string | null;
    specialty?: string | null;
    createdAt?: Date | string;
  }
}