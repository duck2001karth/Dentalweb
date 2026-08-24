import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

function formatSqlValue(val: any): string {
  if (val === null || val === undefined) return "NULL"
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE"
  if (typeof val === "number") return val.toString()
  if (val instanceof Date) return `'${val.toISOString()}'`
  if (Array.isArray(val)) {
    const arrayValues = val.map(v => typeof v === "string" ? `"${v.replace(/"/g, '\\"')}"` : v).join(",")
    return `'{${arrayValues}}'`
  }
  if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
  return `'${val.toString().replace(/'/g, "''")}'`
}

function generateTableInserts(tableName: string, records: any[]): string {
  if (!records || records.length === 0) return `-- No hay datos en ${tableName}\n\n`
  
  let sql = `-- Datos para la tabla: ${tableName} (${records.length} registros)\n`
  
  for (const row of records) {
    const columns = Object.keys(row).map(c => `"${c}"`).join(", ")
    const values = Object.values(row).map(v => formatSqlValue(v)).join(", ")
    sql += `INSERT INTO "${tableName}" (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`
  }
  
  return sql + "\n"
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const [
    users, patients, appointments, catalog, agreements,
    treatmentPlans, treatmentItems, payments, notes, odontograms
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.patient.findMany(),
    prisma.appointment.findMany(),
    prisma.procedureCatalog.findMany(),
    prisma.agreement.findMany(),
    prisma.treatmentPlan.findMany(),
    prisma.treatmentItem.findMany(),
    prisma.payment.findMany(),
    prisma.clinicalNote.findMany(),
    prisma.odontogramRecord.findMany(),
  ])

  let sqlDump = `-- ========================================================\n`
  sqlDump += `-- RESPALDO SQL - CARMO DENTAL\n`
  sqlDump += `-- Generado: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}\n`
  sqlDump += `-- Motor: PostgreSQL\n`
  sqlDump += `-- ========================================================\n\n`

  sqlDump += generateTableInserts("User", users)
  sqlDump += generateTableInserts("Patient", patients)
  sqlDump += generateTableInserts("agreements", agreements)
  sqlDump += generateTableInserts("ProcedureCatalog", catalog)
  sqlDump += generateTableInserts("TreatmentPlan", treatmentPlans)
  sqlDump += generateTableInserts("TreatmentItem", treatmentItems)
  sqlDump += generateTableInserts("Appointment", appointments)
  sqlDump += generateTableInserts("Payment", payments)
  sqlDump += generateTableInserts("ClinicalNote", notes)
  sqlDump += generateTableInserts("OdontogramRecord", odontograms)

  return new NextResponse(sqlDump, {
    status: 200,
    headers: {
      "Content-Type": "application/sql; charset=utf-8",
      "Content-Disposition": `attachment; filename="CarmoDental_Backup_${format(new Date(), "yyyyMMdd_HHmm")}.sql"`
    }
  })
}