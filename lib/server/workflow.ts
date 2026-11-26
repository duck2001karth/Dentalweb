import { prisma } from "@/lib/db"
export const clinicZone = process.env.CLINIC_TIME_ZONE || "America/Guayaquil"
export function clinicClock(now=new Date()) {
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:clinicZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now).map(p=>[p.type,p.value]))
 return {day:`${parts.year}-${parts.month}-${parts.day}`,minute:Number(parts.hour)*60+Number(parts.minute)}
}
export type Preferences={arrivals:boolean;appointments:boolean;reminders:boolean;waiting:boolean;completed:boolean;stock:boolean;minutes:number}
export const defaults:Preferences={arrivals:true,appointments:true,reminders:true,waiting:true,completed:true,stock:true,minutes:15}
export async function preferences(id:string):Promise<Preferences>{const rows=await prisma.$queryRaw<Preferences[]>`SELECT "arrivals","appointments","reminders","waiting","completed","stock","minutes" FROM public."WorkflowPreference" WHERE "userId"=${id}`;return rows[0]||defaults}
