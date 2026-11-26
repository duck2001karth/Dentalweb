import { prisma } from "@/lib/db"
import { clinicClock, preferences } from "@/lib/server/workflow"
import { dateRange, minutes } from "@/lib/server/appointment-scheduling"
import type { Prisma } from "@prisma/client"
type Actor={id:string;role:string}
export const ownNotices=(u:Actor):Prisma.NotificationWhereInput=>({OR:[{userId:u.id},{userId:null,targetRole:{in:[u.role,"ALL"]}}]})
export async function workflowNotices(user:Actor){
 const p=await preferences(user.id), now=new Date(), {day,minute}=clinicClock(now)
 const stored=await prisma.notification.findMany({where:ownNotices(user),orderBy:{createdAt:"desc"},take:100})
 const rows=stored.filter(n=>n.type==='WF_WAITING'?p.arrivals:n.type==='WF_COMPLETED'?p.completed:['WF_NEW','WF_RESCHEDULED','WF_CANCELLED','WF_NO_SHOW'].includes(n.type)?p.appointments:true).map(n=>({...n,link:n.type.startsWith('WF_')?'/centro-atencion':undefined}))
 const virtual:Array<{id:string;title:string;message:string;type:string;isRead:boolean;createdAt:Date;link:string}>=[]
 const push=(id:string,title:string,message:string,type:string,link='/centro-atencion')=>virtual.push({id,title,message,type,link,isRead:false,createdAt:now})
 if(p.reminders){
  const appointments=await prisma.appointment.findMany({where:{date:dateRange(day),status:"SCHEDULED",patient:{isDeleted:false},...(user.role==='DOCTOR'?{doctorId:user.id}:{})},select:{id:true,startTime:true},take:500})
  for(const a of appointments){const delta=minutes(a.startTime)-minute;if(delta>=0&&delta<=p.minutes)push(`wf-reminder-${a.id}-${day}-${a.startTime}`,`Próxima cita · ${a.startTime}`,`Cita programada dentro de ${p.minutes} minutos. Consulte la agenda.`,"WF_REMINDER")}
 }
 if(p.waiting&&user.role!=='DOCTOR'){
  const waits=await prisma.$queryRaw<Array<{id:string;arrivedAt:Date}>>`SELECT a.id,t."arrivedAt" FROM public."Appointment" a JOIN public."WorkflowTiming" t ON t."appointmentId"=a.id JOIN public."Patient" p ON p.id=a."patientId" WHERE a.status='WAITING' AND NOT p."isDeleted" AND t."arrivedAt"<=now()-interval '20 minutes' LIMIT 100`
  for(const w of waits)push(`wf-wait-${w.id}-${w.arrivedAt.getTime()}`,"Espera prolongada","Un paciente lleva al menos 20 minutos en sala de espera.","WF_WAIT_ALERT")
 }
 if(p.stock&&user.role!=='DOCTOR'){
  const stock=await prisma.$queryRaw<Array<{id:string;name:string;stock:number;minStock:number;updatedAt:Date}>>`SELECT id,name,stock,"minStock","updatedAt" FROM public."InventoryItem" WHERE "isActive" AND stock<="minStock" ORDER BY stock LIMIT 50`
  for(const s of stock)push(`wf-stock-${s.id}-${s.updatedAt.getTime()}`,"Stock mínimo",`${s.name}: ${s.stock} unidades disponibles.`,"WF_STOCK","/inventario")
 }
 const read=await prisma.$queryRaw<Array<{noticeId:string}>>`SELECT "noticeId" FROM public."WorkflowNoticeRead" WHERE "userId"=${user.id}`
 const seen=new Set(read.map(r=>r.noticeId))
 return [...virtual,...rows].map(n=>({...n,isRead:seen.has(n.id)||(('userId' in n)&&n.userId===user.id&&n.isRead)}))
}
export async function markWorkflowNotices(user:Actor,ids:string[]){
 const visible=await workflowNotices(user), valid=new Set(visible.map(n=>n.id));const debtIds=ids.filter(id=>id.startsWith('debt-')).map(id=>id.slice(5));
 if(debtIds.length){const plans=await prisma.treatmentPlan.findMany({where:{id:{in:debtIds},status:{in:["ACTIVE","DRAFT"]},...(user.role==='DOCTOR'?{doctorId:user.id}:{})},select:{id:true}});for(const p of plans)valid.add(`debt-${p.id}`)}
 const requested=[...new Set(ids)].filter(id=>valid.has(id))
 await prisma.$transaction(async tx=>{for(const id of requested)await tx.$executeRaw`INSERT INTO public."WorkflowNoticeRead" ("userId","noticeId") VALUES (${user.id},${id}) ON CONFLICT DO NOTHING`})
 return {success:true}
}
