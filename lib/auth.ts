import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { isLoginBlocked, recordLoginFailure, resetLoginFailures } from "@/lib/security/login-rate-limit";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
const BAD_CREDENTIALS = "Credenciales inválidas o acceso temporalmente bloqueado.";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/auth", error: "/auth" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales incompletas.");
        }
        const userEmail = credentials.email.toLowerCase().trim();
        if (userEmail.length > 254 || !userEmail.includes("@")) {
          throw new Error(BAD_CREDENTIALS);
        }
        // Error de DB o ausencia de migración: no permitir saltar el límite.
        if (await isLoginBlocked(userEmail)) {
          await delay(800);
          throw new Error(BAD_CREDENTIALS);
        }

        const user = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!user || !user.password || !user.isActive) {
          await recordLoginFailure(userEmail);
          await delay(800);
          throw new Error(BAD_CREDENTIALS);
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          await recordLoginFailure(userEmail);
          await delay(800);
          throw new Error(BAD_CREDENTIALS);
        }
        await resetLoginFailures(userEmail);
        return user;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const userEmail = user.email?.toLowerCase().trim();
        if (!userEmail) return false;
        const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!existingUser) return "/auth?error=AccessDenied";
        if (!existingUser.isActive) return "/auth?error=AccountSuspended";
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
        token.phoneNumber = user.phoneNumber;
        token.specialty = user.specialty;
        token.calendarColor = user.calendarColor;
        token.language = (user as any).language || "es-EC";
      } else if (token?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isActive: true, role: true, phoneNumber: true,
              specialty: true, calendarColor: true, language: true }
          });
          if (!dbUser || !dbUser.isActive) {
            token.isActive = false;
          } else {
            token.isActive = dbUser.isActive;
            token.role = dbUser.role;
            token.phoneNumber = dbUser.phoneNumber;
            token.specialty = dbUser.specialty;
            token.calendarColor = dbUser.calendarColor;
            token.language = dbUser.language || "es-EC";
          }
        } catch (error) {
          console.error("Error verificando estado del usuario en JWT:", error);
          // Se conserva comportamiento existente; para alta seguridad migrar a sesiones revocables.
        }
      }
      if (trigger === "update" && session?.user) {
        token.name = session.user.name ?? token.name;
        token.picture = session.user.image ?? token.picture;
        token.phoneNumber = session.user.phoneNumber ?? token.phoneNumber;
        token.calendarColor = session.user.calendarColor ?? token.calendarColor;
        if (session.user.language) token.language = session.user.language;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.isActive = token.isActive as boolean;
        session.user.phoneNumber = token.phoneNumber as string | null;
        session.user.specialty = token.specialty as string | null;
        session.user.calendarColor = token.calendarColor as string | null;
        session.user.image = token.picture as string | null;
        (session.user as any).language = (token.language as string) || "es-EC";
      }
      return session;
    },
  },
};
