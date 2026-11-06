// Ejecutar desde la raíz del proyecto Dentalweb: node diagnostico-b2-solo-lectura.cjs
// Solo consulta TreatmentApproval; no modifica datos ni imprime firmas o información del paciente.
const fs = require('node:fs')
// Node.js 24: carga variables sin instalar dotenv.
// La ruta se ejecuta desde la raíz del proyecto.
if (fs.existsSync('.env')) process.loadEnvFile('.env')
if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local')

// Precaución: este diagnóstico debe ejecutarse únicamente contra PostgreSQL local.
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL no está configurada en .env o .env.local')
  process.exit(1)
}
let hostname
try { hostname = new URL(databaseUrl).hostname.toLowerCase().replace(/^\[|\]$/g, '') }
catch { console.error('DATABASE_URL no tiene un formato válido'); process.exit(1) }
if (!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
  console.error('Diagnóstico detenido: DATABASE_URL no apunta a PostgreSQL local.')
  process.exit(1)
}
const { PrismaClient } = require('@prisma/client')
const { createHash } = require('node:crypto')
const prisma = new PrismaClient()
const SNAPSHOT_KEYS = ['planId','patientId','name','agreementId','commercialDiscount','globalDiscount','commentsToPatient','items','amount']
const ITEM_KEYS = ['id','name','tooth','cost','discount','net']
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
function restore(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot) || !Array.isArray(snapshot.items) || !snapshot.items.length) return null
  if (Object.keys(snapshot).some(k => !SNAPSHOT_KEYS.includes(k))) return null
  const items = []
  for (const item of snapshot.items) {
    if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).some(k => !ITEM_KEYS.includes(k))) return null
    const ordered = {}
    for (const key of ITEM_KEYS) if (Object.prototype.hasOwnProperty.call(item,key)) ordered[key] = item[key]
    items.push(ordered)
  }
  const ordered = {}
  for (const key of SNAPSHOT_KEYS) {
    if (key === 'items') ordered.items = items
    else if (Object.prototype.hasOwnProperty.call(snapshot,key)) ordered[key] = snapshot[key]
  }
  return ordered
}
async function main() {
  const approvals = await prisma.treatmentApproval.findMany({
    orderBy: {approvedAt:'desc'}, take:10,
    select:{id:true,treatmentPlanId:true,approvedAmount:true,snapshotHash:true,snapshot:true,approvedAt:true}
  })
  for (const approval of approvals) {
    const snap = approval.snapshot
    const saved = String(approval.snapshotHash || '').toLowerCase()
    const restored = restore(snap)
    console.log('\n--- Aprobación',approval.id.slice(0,10),'---')
    console.log('Fecha:',approval.approvedAt.toISOString(),'Importe:',approval.approvedAmount)
    console.log('Plan ID:',approval.treatmentPlanId)
    console.log('Nombre:',typeof snap?.name === 'string' ? snap.name : '(sin nombre)')
    console.log('Campos snapshot:',snap && typeof snap === 'object' && !Array.isArray(snap) ? Object.keys(snap).join(', ') : '(no es objeto)')
    console.log('Cantidad items:',Array.isArray(snap?.items) ? snap.items.length : '(no es arreglo)')
    console.log('Campos primer item:',Array.isArray(snap?.items) && snap.items[0] && typeof snap.items[0] === 'object' ? Object.keys(snap.items[0]).join(', ') : '(no disponible)')
    console.log('Hash almacenado SHA256 válido:',/^[a-f0-9]{64}$/.test(saved))
    console.log('Coincide hash directo:',!!snap && digest(snap) === saved)
    console.log('Estructura compatible con D4:',!!restored)
    console.log('Coincide hash reconstruido D4:',!!restored && digest(restored) === saved)
  }
}
main().catch(e=>{console.error('Fallo de consulta:',e.message);process.exitCode=1}).finally(()=>prisma.$disconnect())
