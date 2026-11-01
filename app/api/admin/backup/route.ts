import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export const GET = createApiHandler(
  { roles: ["ADMIN"] },
  async (req, { user, audit }) => {
    const [users, patients, catalog, payments, anamnesisCounts, documentsCounts] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, role: true, isActive: true },
      }),
      prisma.patient.findMany({
        select: { id: true, ci: true, firstName: true },
      }),
      prisma.procedureCatalog.findMany({
        select: { id: true, code: true, name: true, basePrice: true },
      }),
      prisma.payment.findMany({
        select: { id: true, amount: true, method: true, receiptNumber: true },
      }),
      prisma.anamnesis.count(),
      prisma.patientDocument.count(),
    ])

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
        requestedBy: user.email,
        totalRecords,
      },
      data: {
        system: { users },
        clinical: { patients, anamnesisCounts, documentsCounts },
        financial: { catalog, payments },
      },
    }

    await audit({
      action: "SYSTEM_BACKUP",
      entity: "SYSTEM",
      entityId: "backup-json",
      details: `Respaldo maestro (metadatos) generado. Total registros: ${totalRecords}.`,
    })

    return backupData
  }
)