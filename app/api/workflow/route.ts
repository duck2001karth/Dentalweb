import { prisma } from "@/lib/db"
import { createApiHandler, ApiError } from "@/lib/server/api-handler"
import { clinicDate, dateRange, lockAppointmentDay } from "@/lib/server/appointment-scheduling"
import { clinicClock } from "@/lib/server/workflow"
import { NextResponse } from "next/server"
import { z } from "zod"
export const dynamic="force-dynamic"
const roles=["ADMIN","DOCTOR","RECEPTIONIST"] as const
export const GET=createApiHandler({roles:[...roles]},async(_,{user,searchParams})=>{
 const today=clinicClock().day, day=searchParams.get("day")||today
 if(day!==clinicDate(day))throw new ApiError("Fecha inválida",422)
 const rows=await prisma.appointment.findMany({where:{date:dateRange(day),patient:{isDeleted:false},...(user.role==="DOCTOR"?{doctorId:user.id}:{})},select:{id:true,status:true,box:true,startTime:true,endTime:true,doctorId:true,patientId:true,patient:{select:{firstName:true,lastName:true}},doctor:{select:{name:true,calendarColor:true}}},orderBy:{startTime:"asc"}})
 const timing=await prisma.$queryRaw<Array<{appointmentId:string;arrivedAt:Date|null;startedAt:Date|null;finishedAt:Date|null}>>`SELECT t.* FROM public."WorkflowTiming" t JOIN public."Appointment" a ON a.id=t."appointmentId" WHERE a.date>=${dateRange(day).gte} AND a.date<${dateRange(day).lt} AND (${user.role} <> 'DOCTOR' OR a."doctorId"=${user.id})`
 const map=new Map(timing.map(t=>[t.appointmentId,t]));return NextResponse.json({today,day,serverTime:new Date().toISOString(),appointments:rows.map(a=>({...a,...(map.get(a.id)||{})}))},{headers:{"Cache-Control":"private, no-store"}})
})
const schema=z.object({id:z.string().min(1).max(128),status:z.enum(["WAITING","IN_PROGRESS","COMPLETED","NO_SHOW","CANCELLED"])}).strict()
export const PATCH=createApiHandler({roles:[...roles],schema},async(_,{user,data})=>{
 const today=clinicClock().day
 return prisma.$transaction(async tx=>{
  await lockAppointmentDay(tx,today)
  const a=await tx.appointment.findFirst({where:{id:data.id,date:dateRange(today),patient:{isDeleted:false}}})
  if(!a)throw new ApiError("Cita de hoy no encontrada",404)
  if(user.role==="DOCTOR"&&a.doctorId!==user.id)throw new ApiError("No autorizado",403)
  const allowed:Record<string,string[]>={SCHEDULED:["WAITING","NO_SHOW","CANCELLED"],WAITING:["IN_PROGRESS","CANCELLED"],IN_PROGRESS:["COMPLETED"]}
  if(!allowed[a.status]?.includes(data.status))throw new ApiError("El estado cambió o la transición no es válida",409)
  if(["IN_PROGRESS","COMPLETED"].includes(data.status)&&(user.role!=="DOCTOR"||a.doctorId!==user.id))throw new ApiError("Solo el especialista asignado puede iniciar o finalizar la atención",403)
  if(data.status==="IN_PROGRESS"){
   await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('carmo-workflow-active')) IS NULL AS acquired`
   const occupied=await tx.appointment.findFirst({where:{id:{not:a.id},status:"IN_PROGRESS",OR:[{doctorId:a.doctorId},...(a.box?[{box:a.box}]:[])]},select:{id:true}})
   if(occupied)throw new ApiError("El especialista o sillón está ocupado",409)
  }
  const changed=await tx.appointment.updateMany({where:{id:a.id,status:a.status,doctorId:a.doctorId},data:{status:data.status}})
  if(changed.count!==1)throw new ApiError("La cita cambió, vuelva a consultar",409)
  await tx.auditLog.create({data:{userId:user.id,patientId:a.patientId,entity:"APPOINTMENT",entityId:a.id,action:"WORKFLOW_STATUS",details:"Cambio de estado de atención",oldData:{status:a.status},newData:{status:data.status}}})
  return {success:true}
 })
})
