import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, 
  },
  pages: {
    signIn: "/auth", 
    error: "/auth",  
  },
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
        const user = await prisma.user.findUnique({
          where: { email: userEmail },
        });

        if (!user || !user.password) {
          throw new Error("Usuario no encontrado o debe ingresar por Google.");
        }

        if (!user.isActive) {
          throw new Error("Su cuenta ha sido suspendida. Contacte a administración.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("La contraseña es incorrecta.");
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const userEmail = user.email?.toLowerCase().trim();
        if (!userEmail) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email: userEmail },
        });

        if (!existingUser) {
          return "/auth?error=AccessDenied"; 
        }

        if (!existingUser.isActive) {
          return "/auth?error=AccountSuspended";
        }
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
      }

      if (trigger === "update" && session?.user) {
        token.name = session.user.name ?? token.name;
        token.picture = session.user.image ?? token.picture;
        token.phoneNumber = session.user.phoneNumber ?? token.phoneNumber;
        token.calendarColor = session.user.calendarColor ?? token.calendarColor;
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
      }
      return session;
    },
  },
  
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true, 
        sameSite: "lax", 
        path: "/",
        secure: process.env.NODE_ENV === "production", 
      },
    },
  },
};