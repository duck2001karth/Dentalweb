import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { headers } from "next/headers";

import { prisma } from "@/lib/db";
import { Prisma, UserRole } from "@prisma/client";

// Helper para capturar cabeceras de red
async function getRequestMetadata() {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Desconocido";
    return { ipAddress, userAgent };
  } catch {
    return { ipAddress: "127.0.0.1", userAgent: "Desconocido" };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: {
    ...PrismaAdapter(prisma),

    async createUser(data: Prisma.UserCreateInput) {
      const newUser = await prisma.user.create({
        data: {
          ...data,
          role: UserRole.DOCTOR,
          isActive: true,
          lastLogin: new Date(),
        },
      });
      try {
        const { ipAddress, userAgent } = await getRequestMetadata();
        await prisma.auditLog.create({
          data: {
            userId: newUser.id,
            action: "CREATE",
            entity: "USER",
            entityId: newUser.id,
            details: `Registro inicial de usuario con Google: ${newUser.email}`,
            newData: {
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
            },
            ipAddress,
            userAgent,
          },
        });
      } catch (error) {
        console.error("Error al auditar createUser en NextAuth:", error);
      }

      return newUser;
    },
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  events: {
    async signIn({ user }) {
      if (user?.email) {
        try {
          const updatedUser = await prisma.user.update({
            where: { email: user.email },
            data: { lastLogin: new Date() },
          });
          const { ipAddress, userAgent } = await getRequestMetadata();
          await prisma.auditLog.create({
            data: {
              userId: updatedUser.id,
              action: "LOGIN",
              entity: "AUTH",
              entityId: updatedUser.id,
              details: `Inicio de sesión vía Google OAuth: ${user.email}`,
              ipAddress,
              userAgent,
            },
          });
        } catch (error) {
          console.error("Error en evento signIn / AuditLog:", error);
        }
      }
    },

    async signOut({ token }) {
      if (token?.id) {
        try {
          const { ipAddress, userAgent } = await getRequestMetadata();
          await prisma.auditLog.create({
            data: {
              userId: token.id as string,
              action: "LOGOUT",
              entity: "AUTH",
              entityId: token.id as string,
              details: `Cierre de sesión de usuario: ${token.email || token.name || token.id}`,
              ipAddress,
              userAgent,
            },
          });
        } catch (error) {
          console.error("Error en evento signOut / AuditLog:", error);
        }
      }
    },
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      if (token.id && (user || trigger === "update")) {
        const dbUser = await prisma.user.findUnique({
          where: {
            id: token.id as string,
          },
          select: {
            id: true,
            role: true,
            isActive: true,
            phoneNumber: true,
            specialty: true,
            image: true,
            email: true,
            name: true,
            lastLogin: true,
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.isActive = dbUser.isActive;
          token.phoneNumber = dbUser.phoneNumber ?? "";
          token.specialty = dbUser.specialty ?? "";
          token.picture = dbUser.image ?? "";
          token.email = dbUser.email ?? "";
          token.name = dbUser.name ?? "";
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.isActive = token.isActive as boolean;
        session.user.phoneNumber = token.phoneNumber as string;
        session.user.specialty = token.specialty as string;
        session.user.image = token.picture as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }

      return session;
    },
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};