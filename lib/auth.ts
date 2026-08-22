import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "@/lib/db";
import { Prisma, UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: {
    ...PrismaAdapter(prisma),

    async createUser(data: Prisma.UserCreateInput) {
      return prisma.user.create({
        data: {
          ...data,
          role: UserRole.DOCTOR,
          isActive: true,
          lastLogin: new Date(), 
        },
      });
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
          await prisma.user.update({
            where: { email: user.email },
            data: { lastLogin: new Date() },
          });
        } catch (error) {
          console.error("Error al actualizar lastLogin en evento signIn:", error);
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