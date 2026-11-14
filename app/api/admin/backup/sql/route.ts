import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { format } from "date-fns"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const MAX_ROWS_PER_TABLE = 2_000
const MAX_BYTES = 8 * 1024 * 1024

type SqlRow = Record<string, unknown>
type SqlValue = string | number | boolean | bigint | Date | null | undefined | SqlValue[] | Record<string, unknown>

function sqlIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function sqlString(value: string): string {
  if (value.includes("\u0000")) throw new Error("SQL_EXPORT_UNSUPPORTED_VALUE")
  return `'${value.replace(/'/g, "''")}'`
}

function sqlArray(values: unknown[]): string {

  const encode = (value: unknown): string => {
    if (value === null || value === undefined) return "NULL"
    if (Array.isArray(value)) return `{${value.map(encode).join(",")}}`
    const raw = value instanceof Date ? value.toISOString() : String(value)
    if (raw.includes("\u0000")) throw new Error("SQL_EXPORT_UNSUPPORTED_VALUE")
    return `"${raw.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
  }
  return sqlString(`{${values.map(encode).join(",")}}`)
}

function sqlValue(value: unknown): string {
  if (value === undefined || value === null) return "NULL"
  if (value instanceof Date) return sqlString(value.toISOString())
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE"
  if (typeof value === "bigint") return value.toString()
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("SQL_EXPORT_UNSUPPORTED_VALUE")
    return String(value)
  }
  if (typeof value === "string") return sqlString(value)
  if (Array.isArray(value)) return sqlArray(value)
  if (typeof value === "object") {
    const candidate = value as { constructor?: { name?: string }; toString?: () => string }
    if (candidate.constructor?.name === "Decimal" && candidate.toString) {
      const decimal = candidate.toString()
      if (!/^-?(?:\d+)(?:\.\d+)?$/.test(decimal)) throw new Error("SQL_EXPORT_UNSUPPORTED_VALUE")
      return decimal
    }
    const json = JSON.stringify(value)
    if (json === undefined) throw new Error("SQL_EXPORT_UNSUPPORTED_VALUE")
    return `${sqlString(json)}::jsonb`
  }
  throw new Error("SQL_EXPORT_UNSUPPORTED_VALUE")
}

function insertStatements(table: string, rows: SqlRow[]): string {
  if (rows.length === 0) return `-- ${table}: 0 filas\n\n`
  let output = `-- ${table}: ${rows.length} filas\n`
  for (const row of rows) {
    const entries = Object.entries(row)
    const columns = entries.map(([key]) => sqlIdentifier(key)).join(", ")
    const values = entries.map(([, value]) => sqlValue(value)).join(", ")
    output += `INSERT INTO ${sqlIdentifier(table)} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`
    if (Buffer.byteLength(output, "utf8") > MAX_BYTES) throw new Error("SQL_EXPORT_TOO_LARGE")
  }
  return `${output}\n`
}

export const GET = createApiHandler(
  { roles: ["ADMIN"] },
  async (_req, { user, audit }) => {
    const take = MAX_ROWS_PER_TABLE + 1
    const [users, patients, appointments, catalog, agreements, treatmentPlans,
      treatmentItems, payments, notes, odontograms] = await Promise.all([
      prisma.user.findMany({ take, select: {
        id: true, name: true, email: true, role: true, specialty: true,
        isActive: true, language: true, createdAt: true,
      } }),
      prisma.patient.findMany({ take, select: {
        id: true, firstName: true, lastName: true, ci: true, phone: true,
        email: true, convenio: true, createdAt: true,
      } }),
      prisma.appointment.findMany({ take }),
      prisma.procedureCatalog.findMany({ take }),
      prisma.agreement.findMany({ take }),
      prisma.treatmentPlan.findMany({ take }),
      prisma.treatmentItem.findMany({ take }),
      prisma.payment.findMany({ take, select: {
        id: true, amount: true, method: true, receiptNumber: true,
        treatmentPlanId: true, patientId: true, createdAt: true,
      } }),
      prisma.clinicalNote.findMany({ take, select: {
        id: true, patientId: true, authorId: true, type: true, content: true, createdAt: true,
      } }),
      prisma.odontogramRecord.findMany({ take }),
    ])

    const tables: Array<[string, SqlRow[]]> = [
      ["User", users], ["Patient", patients], ["Appointment", appointments],
      ["ProcedureCatalog", catalog], ["agreements", agreements],
      ["TreatmentPlan", treatmentPlans], ["TreatmentItem", treatmentItems],
      ["Payment", payments], ["ClinicalNote", notes], ["OdontogramRecord", odontograms],
    ]

    if (tables.some(([, records]) => records.length > MAX_ROWS_PER_TABLE)) {
      return NextResponse.json({
        error: "La exportación supera el límite seguro por tabla. Usa un respaldo PostgreSQL administrado (pg_dump).",
      }, { status: 413, headers: { "Cache-Control": "no-store" } })
    }

    const now = new Date()
    const header = [
      "-- ========================================================",
      "-- EXPORTACIÓN PARCIAL DE DATOS - CARMO DENTAL",
      `-- Generada: ${now.toISOString()}`,
      "-- No es un respaldo completo ni una herramienta de restauración.",
      "-- No incluye esquema, secuencias, extensiones ni todas las tablas.",
      "-- CONTIENE INFORMACIÓN PERSONAL, CLÍNICA Y FINANCIERA CONFIDENCIAL.",
      "-- Almacenar cifrado y con acceso restringido; eliminar copias innecesarias.",
      "-- ========================================================",
      "SET standard_conforming_strings = on;",
      "BEGIN;",
      "",
    ].join("\n")

    let dump = header
    try {
      for (const [name, records] of tables) {
        dump += insertStatements(name, records)
        if (Buffer.byteLength(dump, "utf8") > MAX_BYTES) throw new Error("SQL_EXPORT_TOO_LARGE")
      }
    } catch (error) {
      if (error instanceof Error && error.message === "SQL_EXPORT_TOO_LARGE") {
        return NextResponse.json({ error: "La exportación supera 8 MB; utiliza un respaldo PostgreSQL administrado." },
          { status: 413, headers: { "Cache-Control": "no-store" } })
      }
      if (error instanceof Error && error.message === "SQL_EXPORT_UNSUPPORTED_VALUE") {
        return NextResponse.json({ error: "Se encontró un valor que no puede exportarse con seguridad." },
          { status: 422, headers: { "Cache-Control": "no-store" } })
      }
      throw error
    }
    dump += "COMMIT;\n"
    await audit({
      action: "DATABASE_SQL_BACKUP",
      entity: "SYSTEM",
      entityId: "backup-sql",
      details: `Exportación SQL parcial solicitada por usuario ${user.id}; ${tables.length} tablas, ${Buffer.byteLength(dump, "utf8")} bytes.`,
    })

    return new NextResponse(dump, {
      status: 200,
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="CarmoDental_Exportacion_Parcial_${format(now, "yyyyMMdd_HHmm")}.sql"`,
        "Cache-Control": "private, no-store, max-age=0",
        "Pragma": "no-cache",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    })
  }
)
