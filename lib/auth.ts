import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { claimLoginAttempt, resetLoginFailures } from "@/lib/security/login-rate-limit"
import { logAuditEvent } from "@/lib/audit"

const allowed = (role: unknown) => ["ADMIN", "DOCTOR", "RECEPTIONIST"].includes(String(role))
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const adapter = PrismaAdapter(prisma)
export const authOptions: NextAuthOptions = {
  adapter: { ...adapter, async createUser() { throw new Error("AccessDenied") } } as NextAuthOptions["adapter"],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/auth", error: "/auth" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: "select_account" } },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: { label: "Correo", type: "email" }, password: { label: "Contraseña", type: "password" } },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase()
        const password = credentials?.password
        if (!email || !password || email.length > 254 || password.length > 200 || !email.includes("@")) return null
        try {
          if (!(await claimLoginAttempt(email))) { await delay(800); return null }
          const user = await prisma.user.findUnique({ where: { email } })
          if (!user?.password || !user.isActive || !allowed(user.role) || !(await bcrypt.compare(password, user.password))) {
            await delay(800); return null
          }
          await resetLoginFailures(email)
          return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, isActive: user.isActive, phoneNumber: user.phoneNumber, specialty: user.specialty, calendarColor: user.calendarColor }
        } catch {
          console.error("[AUTH] Fallo interno de autenticación por credenciales")
          throw new Error("AuthUnavailable")
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const google = profile as { email?: string; email_verified?: boolean; hd?: string } | undefined
        const email = google?.email?.trim().toLowerCase()
        if (!email || google?.email_verified !== true) return false
        try {
          const existing = await prisma.user.findUnique({ where: { email } })
          if (!existing?.isActive || !allowed(existing.role)) return false
          const where = { provider_providerAccountId: { provider: "google", providerAccountId: account.providerAccountId } }
          const linked = await prisma.account.findUnique({ where })
          if (linked) return linked.userId === existing.id
          if (!email.endsWith("@gmail.com") && !google.hd) return false
          const result = await prisma.account.upsert({ where, update: {}, create: {
            userId: existing.id, provider: "google", providerAccountId: account.providerAccountId, type: account.type,
          } })
          return result.userId === existing.id
        } catch { console.error("[AUTH] Fallo de validación Google"); return "/auth?error=AuthUnavailable" }
      }
      return account?.provider === "credentials" && user.isActive === true && allowed(user.role)
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id
      try {
        const dbUser = token.id ? await prisma.user.findUnique({ where: { id: String(token.id) }, select: { id: true, isActive: true, role: true, phoneNumber: true, specialty: true, calendarColor: true, language: true, name: true, image: true, email: true } }) : null
        token.isActive = !!dbUser?.isActive && allowed(dbUser?.role)
        if (dbUser) {
          token.sub = dbUser.id
          token.role = dbUser.role; token.phoneNumber = dbUser.phoneNumber; token.specialty = dbUser.specialty; token.calendarColor = dbUser.calendarColor; token.language = dbUser.language || "es-EC"; token.name = dbUser.name; token.picture = dbUser.image; token.email = dbUser.email
        }
      } catch { token.isActive = false; console.error("[AUTH] No se pudo verificar la sesión") }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string; session.user.role = token.role as any; session.user.isActive = token.isActive === true
        session.user.phoneNumber = token.phoneNumber as string | null; session.user.specialty = token.specialty as string | null; session.user.calendarColor = token.calendarColor as string | null; session.user.image = token.picture as string | null
        ;(session.user as any).language = token.language || "es-EC"
      }
      return session
    },
  },
  events: {
    async signIn({ user, account }) {
      try {
        const now = new Date()
        await prisma.user.update({ where: { id: user.id }, data: { lastLogin: now } })
        await prisma.$executeRaw`UPDATE public."User" SET "lastSeenAt" = ${now} WHERE "id" = ${user.id}`
        await logAuditEvent({ userId: user.id, action: "SIGN_IN", entity: "USER", entityId: user.id, details: account?.provider === "google" ? "Inicio de sesión mediante Google" : "Inicio de sesión mediante credenciales" })
      } catch { console.error("[AUTH] No se pudo registrar el acceso") }
    },
  },
}
