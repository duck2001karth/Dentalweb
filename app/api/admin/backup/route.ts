import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logAuditEvent } from "@/lib/audit"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, role: true, isActive: true },
    })
    const patients = await prisma.patient.findMany({
      select: { id: true, ci: true, firstName: true },
    })
    const catalog = await prisma.procedureCatalog.findMany({
      select: { id: true, code: true, name: true, basePrice: true },
    })
    const payments = await prisma.payment.findMany({
      select: { id: true, amount: true, method: true, receiptNumber: true },
    })

    const anamnesisCounts = await prisma.anamnesis.count()
    const documentsCounts = await prisma.patientDocument.count()

    const totalRecords =
      users.length +
      patients.length +
      catalog.length +
      payments.length +
      anamnesisCounts +
      documentsCounts

    const backupData = {
      metadata: {
        appName: "Carmo Dental SaaS",
        environment: process.env.NODE_ENV,
        generatedAt: new Date().toISOString(),
        requestedBy: session.user.email,
        totalRecords,
      },
      data: {
        system: { users },
        clinical: { patients, anamnesisCounts, documentsCounts },
        financial: { catalog, payments },
      },
    }

    await logAuditEvent({
      userId: session.user.id,
      action: "SYSTEM_BACKUP",
      entity: "SYSTEM",
      entityId: "backup-json",
      details: `Respaldo maestro (metadatos) generado. Total registros: ${totalRecords}.`,
    })

    return NextResponse.json(backupData)
  } catch (error) {
    console.error("Error generando backup maestro:", error)
    return NextResponse.json({ error: "Fallo al compilar la base de datos." }, { status: 500 })
  }
}