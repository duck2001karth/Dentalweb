import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { createApiHandler, ApiError } from "@/lib/server/api-handler"

import { inspectPurge, purgeDependencies } from "@/lib/server/patient-purge"

export const dynamic = "force-dynamic"
const noStore = { "Cache-Control": "private, no-store" }
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("restore"), id: z.string().uuid() }).strict(),
  z.object({ action: z.literal("purge"), id: z.string().uuid(), confirmation: z.literal("ELIMINAR"), reason: z.string().trim().min(8).max(300), verifiedRetention: z.literal(true), reviewedCounts: z.array(z.object({table:z.string(),count:z.number().int().nonnegative()}).strict()).max(30) }).strict(),
])

export const GET = createApiHandler({ roles: ["ADMIN"] }, async (_req, { searchParams }) => {
  const previewId = searchParams.get("previewId")
  if (previewId) {
    if (!z.string().uuid().safeParse(previewId).success) throw new ApiError("Identificador inválido", 422)
    const preview = await prisma.$transaction(tx => inspectPurge(tx, previewId), {isolationLevel:"RepeatableRead",timeout:15000})
    return NextResponse.json(preview, {headers:noStore})
  }
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
      if(data.action === "purge") {
        await tx.$executeRaw`SET LOCAL lock_timeout = '3s'`
        // Briefly block concurrent writes to affected tables, including legacy non-FK references.
        await tx.$executeRaw`LOCK TABLE public."Patient", public."Appointment", public."ClinicalNote", public."Anamnesis", public."OdontogramRecord", public."Periodontogram", public."PatientDocument", public."Prescription", public."ClinicalDocument", public."TreatmentPlan", public."TreatmentApproval", public."TreatmentItem", public."TreatmentSection", public."PatientComment", public."PatientTask", public."Payment", public."TaxDocument" IN SHARE ROW EXCLUSIVE MODE`
      }
      // Serializa restauraciones y purgas y evita nuevas referencias FK al paciente durante el borrado.
      const rows = await tx.$queryRaw<{id:string;isDeleted:boolean}[]>`SELECT id, "isDeleted" FROM public."Patient" WHERE id=${data.id} FOR UPDATE`
      if (!rows[0]) throw new ApiError("Paciente no encontrado", 404)
      if (!rows[0].isDeleted) throw new ApiError("Solo se permiten operaciones sobre pacientes archivados", 409)
      if (data.action === "restore") {
        await tx.patient.update({ where: { id: data.id }, data: { isDeleted: false } })
        await tx.auditLog.create({ data: { userId: user.id, action: "RESTORE_PATIENT", entity: "PATIENT", entityId: data.id, patientId: data.id, details: "Paciente restaurado desde papelera", oldData: { isDeleted: true }, newData: { isDeleted: false }, ipAddress, userAgent } })
        return { success: true }
      }
      const preview = await inspectPurge(tx, data.id)
      if (preview.blockers.length) return NextResponse.json({error:"No se puede eliminar este expediente de forma segura.",blockers:preview.blockers},{status:409,headers:noStore})
      const expected = preview.counts.map(({table,count})=>({table,count}))
      if(JSON.stringify(expected)!==JSON.stringify(data.reviewedCounts))throw new ApiError("El expediente cambió. Cierra el diálogo y revisa de nuevo los registros.",409)
      await purgeDependencies(tx,data.id,preview)
      // Any remaining direct relation (except audit) means abort, never rely on an implicit cascade.
      const remaining = await tx.$queryRaw<{blockers:string[]}[]>`SELECT public.carmo_patient_trash_blockers(${data.id}::text) AS blockers`
      if(!Array.isArray(remaining[0]?.blockers)||remaining[0].blockers.length)throw new ApiError("Quedaron dependencias no eliminadas. Operación revertida.",409)
      await tx.patient.delete({ where: { id: data.id }, select: { id: true } })
      await tx.auditLog.create({ data: { userId: user.id, action: "PURGE_PATIENT", entity: "PATIENT", entityId: data.id, archivedPatientId: data.id, details: "Eliminación definitiva desde papelera administrativa", oldData: { isDeleted: true }, newData: { reason: data.reason, verifiedRetention: true, deletedCounts: expected }, ipAddress, userAgent } })
      return { success: true }
    }, { timeout: 30000, isolationLevel: "ReadCommitted" })
  } catch (error) {
    if (error instanceof ApiError) throw error
    console.error("[PATIENT_TRASH] Operación revertida", error && typeof error === "object" && "code" in error ? error.code : "UNKNOWN")
    throw new ApiError("No se pudo completar la operación. Compruebe la migración y los permisos de PostgreSQL. No se confirmó ningún cambio.", 409)
  }
})
