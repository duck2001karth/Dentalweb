import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logAudit } from "@/lib/log"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere nivel de administrador." }, { status: 403 })
    }

    const ip = req.headers.get("x-forwarded-for") || "Local"
    const [
      users, patients, appointments, procedureCatalog, agreements, 
      treatmentPlans, treatmentItems, payments, odontogramRecords, 
      periodontograms, anamnesis, clinicalNotes, prescriptions, 
      clinicalDocuments, patientDocuments, patientComments, patientTasks, 
      evolutionTemplates, inventoryItems, inventoryMovements, laboratories, 
      liquidations, taxDocuments, clinicSettings, auditLogs, systemLogs, notifications
    ] = await Promise.all([
      // 1. Usuarios (Excluyendo contraseñas y tokens secretos por seguridad)
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, specialty: true, isActive: true, createdAt: true } }),
      // 2. Clínico Principal
      prisma.patient.findMany(),
      prisma.appointment.findMany(),
      prisma.procedureCatalog.findMany(),
      prisma.agreement.findMany(),
      // 3. Tratamientos y Financiero
      prisma.treatmentPlan.findMany(),
      prisma.treatmentItem.findMany(),
      prisma.payment.findMany(),
      prisma.liquidation.findMany(),
      prisma.taxDocument.findMany(),
      // 4. Expediente Clínico Avanzado
      prisma.odontogramRecord.findMany(),
      prisma.periodontogram.findMany(),
      prisma.anamnesis.findMany(),
      prisma.clinicalNote.findMany(),
      prisma.prescription.findMany(),
      prisma.clinicalDocument.findMany(),
      prisma.patientDocument.findMany(),
      // 5. Inventario y Laboratorio
      prisma.inventoryItem.findMany(),
      prisma.inventoryMovement.findMany(),
      prisma.laboratory.findMany(),
      // 6. Gestión Interna
      prisma.patientComment.findMany(),
      prisma.patientTask.findMany(),
      prisma.evolutionTemplate.findMany(),
      prisma.notification.findMany(),
      // 7. Configuración y Logs
      prisma.clinicSettings.findMany(),
      prisma.auditLog.findMany(),
      prisma.systemLog.findMany()
    ])

    // Calcular el volumen total de registros
    const totalRecords = 
      users.length + patients.length + appointments.length + procedureCatalog.length + agreements.length +
      treatmentPlans.length + treatmentItems.length + payments.length + odontogramRecords.length + 
      periodontograms.length + anamnesis.length + clinicalNotes.length + prescriptions.length + 
      clinicalDocuments.length + patientDocuments.length + patientComments.length + patientTasks.length + 
      evolutionTemplates.length + inventoryItems.length + inventoryMovements.length + laboratories.length + 
      liquidations.length + taxDocuments.length + clinicSettings.length + auditLogs.length + systemLogs.length + notifications.length;

    const backupData = {
      metadata: {
        appName: "Carmo Dental SaaS",
        environment: process.env.NODE_ENV,
        generatedAt: new Date().toISOString(),
        requestedBy: session.user.email,
        totalRecords: totalRecords
      },
      data: {
        system: { users, clinicSettings, evolutionTemplates },
        clinical: { patients, appointments, anamnesis, odontogramRecords, periodontograms, clinicalNotes, prescriptions, clinicalDocuments, patientDocuments },
        financial: { procedureCatalog, agreements, treatmentPlans, treatmentItems, payments, liquidations, taxDocuments },
        inventory: { inventoryItems, inventoryMovements, laboratories },
        management: { patientComments, patientTasks, notifications, auditLogs, systemLogs }
      }
    }

    await logAudit({
      action: "UPDATE", 
      target: "Seguridad",
      details: `Respaldo maestro generado. Total de registros exportados: ${totalRecords}.`,
      userId: session.user.id,
      ipAddress: ip
    })

    return NextResponse.json(backupData)

  } catch (error) {
    console.error("Error generando backup maestro:", error)
    return NextResponse.json({ error: "Fallo crítico al compilar la base de datos." }, { status: 500 })
  }
}