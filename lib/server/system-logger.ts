import { prisma } from "@/lib/db"
const events={API_INTERNAL_ERROR:{level:"ERROR",message:"Error interno en una operación de la API."},API_ACCESS_DENIED:{level:"WARN",message:"Solicitud rechazada por permisos insuficientes."}} as const
export async function recordSystemEvent(event:keyof typeof events){
 try{await prisma.systemLog.create({data:events[event]})}
 catch{console.error("[SystemLog] No se pudo persistir el evento",event)}
}
