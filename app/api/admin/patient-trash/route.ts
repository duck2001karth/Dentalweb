import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { createApiHandler, ApiError } from "@/lib/server/api-handler"

export const dynamic = "force-dynamic"
const noStore = { "Cache-Control": "private, no-store" }
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("restore"), id: z.string().uuid() }).strict(),
  z.object({ action: z.literal("purge"), id: z.string().uuid(), confirmation: z.literal("ELIMINAR"), reason: z.string().trim().min(8).max(300), verifiedRetention: z.literal(true) }).strict(),
])

export const GET = createApiHandler({ roles: ["ADMIN"] }, async (_req, { searchParams }) => {
  const q = (searchParams.get("q") || "").trim().slice(0, 100)
  const rawPage = Number(searchParams.get("page") || 1)
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 100000 ? rawPage : 1
  const limit = 20
  const where = { isDeleted: true, ...(q ? { OR: [ { firstName: { contains: q, mode: "insensitive" as const } }, { lastName: { contains: q, mode: "insensitive" as const } }, { ci: { contains: q } } ] } : {}) }
  const [registered, active, archived, filtered, rows] = await prisma.$transaction([
    prisma.patient.count(), prisma.patient.count({ where: { isDeleted: false } }),
    prisma.patient.count({ where: { isDeleted: true } }), prisma.patient.count({ where }),
    prisma.patient.findMany({ where, select: { id: true, firstName: true, lastName: true, ci: true, updatedAt: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], skip: (page - 1) * limit, take: limit }),
  ])
  const logs = rows.length ? await prisma.auditLog.findMany({ where: { patientId: { in: rows.map(p => p.id) }, action: "DELETE_PATIENT" }, distinct: ["patientId"], orderBy: { createdAt: "desc" }, select: { patientId: true, createdAt: true, user: { select: { name: true } } } }) : []
  const map = new Map(logs.map(l => [l.patientId, l]))
  return NextResponse.json({ registered, active, archived, filtered, page, limit, patients: rows.map(p => ({ ...p, archivedAt: map.get(p.id)?.createdAt || null, archivedBy: map.get(p.id)?.user.name || null })) }, { headers: noStore })
})

export const POST = createApiHandler({ roles: ["ADMIN"], schema }, async (req, { user, data }) => {
  // JSON + cabecera explícita no pueden ser enviados por un formulario de otro sitio.
  if (req.headers.get("x-carmo-trash") !== "1" || (req.headers.get("sec-fetch-site") && req.headers.get("sec-fetch-site") !== "same-origin")) throw new ApiError("Solicitud no autorizada", 403)
  const ipAddress = (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Desconocido").slice(0,128)
  const userAgent = (req.headers.get("user-agent") || "Desconocido").slice(0,512)
  try {
    return await prisma.$transaction(async tx => {
      // Serializa restauraciones y purgas y evita nuevas referencias FK al paciente durante el borrado.
      const rows = await tx.$queryRaw<{id:string;isDeleted:boolean}[]>`SELECT id, "isDeleted" FROM public."Patient" WHERE id=${data.id} FOR UPDATE`
      if (!rows[0]) throw new ApiError("Paciente no encontrado", 404)
      if (!rows[0].isDeleted) throw new ApiError("Solo se permiten operaciones sobre pacientes archivados", 409)
      if (data.action === "restore") {
        await tx.patient.update({ where: { id: data.id }, data: { isDeleted: false } })
        await tx.auditLog.create({ data: { userId: user.id, action: "RESTORE_PATIENT", entity: "PATIENT", entityId: data.id, patientId: data.id, details: "Paciente restaurado desde papelera", oldData: { isDeleted: true }, newData: { isDeleted: false }, ipAddress, userAgent } })
        return { success: true }
      }
      // No permitir cascadas sobre datos clínicos, financieros o relaciones nuevas.
      const result = await tx.$queryRaw<{blockers:string[]}[]>`SELECT public.carmo_patient_trash_blockers(${data.id}::text) AS blockers`
      if (!result[0] || !Array.isArray(result[0].blockers)) throw new ApiError("No se pudieron verificar las dependencias", 409)
      if (result[0].blockers.length) return NextResponse.json({ error: "El paciente tiene registros relacionados. Debe permanecer archivado.", blockers: result[0].blockers }, { status: 409, headers: noStore })
      await tx.patient.delete({ where: { id: data.id }, select: { id: true } })
      await tx.auditLog.create({ data: { userId: user.id, action: "PURGE_PATIENT", entity: "PATIENT", entityId: data.id, archivedPatientId: data.id, details: "Eliminación definitiva desde papelera administrativa", oldData: { isDeleted: true }, newData: { reason: data.reason, verifiedRetention: true }, ipAddress, userAgent } })
      return { success: true }
    }, { timeout: 15000 })
  } catch (error) {
    if (error instanceof ApiError) throw error
    console.error("[PATIENT_TRASH] Operación revertida", error && typeof error === "object" && "code" in error ? error.code : "UNKNOWN")
    throw new ApiError("No se pudo completar la operación. Compruebe la migración y los permisos de PostgreSQL. No se confirmó ningún cambio.", 409)
  }
})
