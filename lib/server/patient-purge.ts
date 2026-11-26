import type { Prisma } from "@prisma/client"
import { ApiError } from "@/lib/server/api-handler"

type Tx = Prisma.TransactionClient
// Identifiers and predicates are constants, never supplied by a request.
const plans = 'SELECT id FROM public."TreatmentPlan" WHERE "patientId"=$1'
const direct = '"patientId"=$1'
const targets = [
  { table: "ClinicalNote", label: "Notas y evoluciones", predicate: direct },
  { table: "Anamnesis", label: "Anamnesis", predicate: direct },
  { table: "OdontogramRecord", label: "Odontogramas", predicate: direct },
  { table: "Periodontogram", label: "Periodontogramas", predicate: direct },
  { table: "PatientDocument", label: "Adjuntos", predicate: direct },
  { table: "Prescription", label: "Recetas", predicate: direct },
  { table: "ClinicalDocument", label: "Documentos clínicos", predicate: direct },
  { table: "PatientComment", label: "Comentarios", predicate: direct },
  { table: "PatientTask", label: "Tareas", predicate: direct },
  { table: "WorkflowTiming", label: "Tiempos de atención", predicate: '"appointmentId" IN (SELECT id FROM public."Appointment" WHERE "patientId"=$1)', optional: true },
  { table: "Appointment", label: "Citas", predicate: direct },
  { table: "TreatmentApproval", label: "Aprobaciones de tratamiento", predicate: direct },
  { table: "TreatmentItem", label: "Prestaciones", predicate: `"treatmentPlanId" IN (${plans})` },
  { table: "TreatmentSection", label: "Secciones de tratamiento", predicate: `"treatmentPlanId" IN (${plans})` },
  { table: "TreatmentPlan", label: "Planes de tratamiento", predicate: direct },
] as const
const knownDirect = new Set<string>(targets.map(t => t.table))
const allowedEdges = new Set([
  ...targets.filter(t => t.predicate === direct && t.table !== "TreatmentApproval").map(t=>`Patient|${t.table}|patientId|id`),
  "Patient|AuditLog|patientId|id",
  "Appointment|WorkflowTiming|appointmentId|id",
  "TreatmentPlan|TreatmentApproval|treatmentPlanId|id",
  "TreatmentPlan|TreatmentItem|treatmentPlanId|id",
  "TreatmentPlan|TreatmentSection|treatmentPlanId|id",
  "TreatmentPlan|ClinicalDocument|treatmentPlanId|id",
  "TreatmentPlan|OdontogramRecord|planId|id",
  // Payment is not deleted; the separate financial check blocks any link.
  "TreatmentPlan|Payment|treatmentPlanId|id",
  "Patient|Payment|patientId|id", "Patient|TaxDocument|patientId|id",
  "TreatmentSection|TreatmentItem|sectionId|id",
])
async function exists(tx:Tx, sql:string, id:string) {
  const rows=await tx.$queryRawUnsafe<{found:boolean}[]>(`SELECT EXISTS (${sql}) AS found`,id)
  return rows[0]?.found === true
}
async function available(tx:Tx, table:string) {
  const rows=await tx.$queryRaw<{present:boolean}[]>`SELECT to_regclass(${`public."${table}"`}) IS NOT NULL AS present`
  return rows[0]?.present===true
}
export async function inspectPurge(tx:Tx,id:string) {
  await tx.$executeRaw`SET LOCAL row_security = off`
  const patient=await tx.patient.findFirst({where:{id,isDeleted:true},select:{id:true}})
  if(!patient) throw new ApiError("Paciente archivado no encontrado",404)
  const result=await tx.$queryRaw<{blockers:string[]}[]>`SELECT public.carmo_patient_trash_blockers(${id}::text) AS blockers`
  if(!Array.isArray(result[0]?.blockers)) throw new ApiError("No se pudieron verificar las dependencias",409)
  const blockers=new Set(result[0].blockers.filter(t=>!knownDirect.has(t)))
  const counts:{table:string;label:string;count:number}[]=[{table:"Patient",label:"Ficha del paciente",count:1}]
  for(const t of targets){
    if("optional" in t && !(await available(tx,t.table))) continue
    const r=await tx.$queryRawUnsafe<{total:bigint}[]>(`SELECT count(*) AS total FROM public."${t.table}" WHERE ${t.predicate}`,id)
    counts.push({table:t.table,label:t.label,count:Number(r[0].total)})
  }
  // Reject unexpected foreign-key paths before any cascade or SET NULL can affect other records.
  const edges=await tx.$queryRaw<{parent:string;child:string;childSchema:string;parentSchema:string;childCol:string;parentCol:string;arity:number}[]>`
    SELECT p.relname AS parent,c.relname AS child, cn.nspname AS "childSchema",pn.nspname AS "parentSchema", ca.attname AS "childCol",pa.attname AS "parentCol",cardinality(f.conkey) AS arity
    FROM pg_constraint f JOIN pg_class p ON p.oid=f.confrelid JOIN pg_namespace pn ON pn.oid=p.relnamespace
    JOIN pg_class c ON c.oid=f.conrelid JOIN pg_namespace cn ON cn.oid=c.relnamespace
    JOIN pg_attribute ca ON ca.attrelid=c.oid AND ca.attnum=f.conkey[1]
    JOIN pg_attribute pa ON pa.attrelid=p.oid AND pa.attnum=f.confkey[1]
    WHERE f.contype='f' AND pn.nspname='public'`
  const deleting=new Set(counts.filter(c=>c.count>0).map(c=>c.table))
  for(const e of edges){
    if(!deleting.has(e.parent))continue
    const key=`${e.parent}|${e.child}|${e.childCol}|${e.parentCol}`
    if(e.arity===1&&e.childSchema==="public"&&allowedEdges.has(key)) continue
    // The V1 catalog function checks whether unknown direct Patient relations contain rows.
    // For a dependent table, fail closed on unknown relationships even if no rows were found.
    if(e.parent==="Patient" && e.arity===1 && e.parentCol==="id" && !result[0].blockers.includes(e.child) && !result[0].blockers.includes(`${e.child} (relación no verificada)`))continue
    blockers.add(`Relación no autorizada: ${e.parent} → ${e.child}`)
  }
  if(await exists(tx,`SELECT 1 FROM public."Payment" WHERE "patientId"=$1 OR "treatmentPlanId" IN (${plans})`,id))blockers.add("Pagos asociados (conservación financiera)")
  if(await exists(tx,'SELECT 1 FROM public."TaxDocument" WHERE "patientId"=$1',id))blockers.add("Comprobantes fiscales (conservación financiera)")
  if(await exists(tx,'SELECT 1 FROM public."TreatmentPlan" WHERE "patientId"=$1 AND "totalPaid"<>0',id)||await exists(tx,`SELECT 1 FROM public."TreatmentItem" WHERE "treatmentPlanId" IN (${plans}) AND ("paidAmount"<>0 OR "isPaid")`,id))blockers.add("Tratamientos con pagos registrados")
  for(const [table,col] of [["ClinicalDocument","treatmentPlanId"],["OdontogramRecord","planId"],["TreatmentApproval","treatmentPlanId"]] as const){
    if(await exists(tx,`SELECT 1 FROM public."${table}" WHERE "${col}" IN (${plans}) AND "patientId"<>$1`,id))blockers.add(`Vínculo a otro paciente: ${table}`)
  }
  if(await exists(tx,`SELECT 1 FROM public."TreatmentApproval" WHERE "patientId"=$1 AND "treatmentPlanId" NOT IN (${plans})`,id))blockers.add("Aprobación vinculada a otro expediente")
  if(await exists(tx,`SELECT 1 FROM public."TreatmentItem" WHERE "sectionId" IN (SELECT id FROM public."TreatmentSection" WHERE "treatmentPlanId" IN (${plans})) AND "treatmentPlanId" NOT IN (${plans})`,id))blockers.add("Prestación vinculada a otro expediente")
  // Stored file references are not assumed to be exclusively owned external objects.
  for(const [table,col,predicate] of [["PatientDocument","url",direct],["ClinicalNote","fileUrl",direct],["TreatmentItem","fileUrl",`"treatmentPlanId" IN (${plans})`]] as const){
    if(await exists(tx,`SELECT 1 FROM public."${table}" WHERE ${predicate} AND "${col}" IS NOT NULL AND "${col}"<>'' AND "${col}" !~ '^data:[^;,]+;base64,[A-Za-z0-9+/]+={0,2}$' AND "${col}" !~ '^[A-Za-z0-9+/]+={0,2}$'`,id))blockers.add(`Archivo externo o formato no identificado: ${table}`)
  }
  // Active appointments are not suitable for an irreversible administrative purge.
  if(await exists(tx,`SELECT 1 FROM public."Appointment" WHERE "patientId"=$1 AND status IN ('WAITING','IN_PROGRESS')`,id))blockers.add("Atención activa o en sala de espera")
  return {counts,blockers:[...blockers].sort()}
}
export type PurgePreview=Awaited<ReturnType<typeof inspectPurge>>
export async function purgeDependencies(tx:Tx,id:string,preview:PurgePreview){
  // Delete explicitly in dependency order; the root is deleted by the caller, in this transaction.
  for(const t of targets){
    const expected=preview.counts.find(c=>c.table===t.table)?.count
    if(!expected)continue
    const n=await tx.$executeRawUnsafe(`DELETE FROM public."${t.table}" WHERE ${t.predicate}`,id)
    if(n!==expected)throw new ApiError("El expediente cambió. Vuelve a consultar el desglose.",409)
  }
}
