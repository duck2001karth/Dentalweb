import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { UserRole, Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { headers } from "next/headers"
const email = z.string().trim().toLowerCase().email().max(254)
const userFields = z.object({
 name:z.string().trim().min(2).max(150).optional(), email:email.optional(), password:z.string().min(8).max(200).optional(), role:z.nativeEnum(UserRole).optional(), specialty:z.string().trim().max(150).nullish(), isActive:z.boolean().optional(), language:z.string().trim().min(2).max(15).nullish(),
}).strict()
const creationSchema=userFields.extend({name:z.string().trim().min(2).max(150),email,password:z.string().min(8).max(200)})
const modificationSchema=userFields.extend({id:z.string().min(1).max(128)})
const forbidden=(error:string,status=403)=>NextResponse.json({error},{status})
const safeSelect={id:true,name:true,email:true,role:true,specialty:true,language:true,isActive:true,lastLogin:true,createdAt:true,image:true} as const
async function metadata(){const h=await headers();return {ipAddress:(h.get("x-forwarded-for")?.split(",")[0]?.trim()||h.get("x-real-ip")||"Desconocido").slice(0,128),userAgent:(h.get("user-agent")||"Desconocido").slice(0,512)}}
export const GET=createApiHandler({roles:["ADMIN"]},async()=>{
 const [users,activity]=await Promise.all([prisma.user.findMany({select:safeSelect,orderBy:{createdAt:"desc"}}),prisma.$queryRaw<Array<{id:string;lastSeenAt:Date|null}>>`SELECT "id", "lastSeenAt" FROM public."User"`])
 const seen=new Map(activity.map(row=>[row.id,row.lastSeenAt]))
 return NextResponse.json(users.map(u=>({...u,lastSeenAt:seen.get(u.id)??null})),{headers:{"Cache-Control":"private, no-store"}})
})
export const POST=createApiHandler({roles:["ADMIN"],schema:creationSchema},async(_req,{user,data})=>{
 if(await prisma.user.findUnique({where:{email:data.email}}))return forbidden("Ya existe un usuario con ese correo",409)
 const hashedPassword=await bcrypt.hash(data.password,12);const meta=await metadata()
 try{return await prisma.$transaction(async tx=>{
  const row=await tx.user.create({data:{name:data.name,email:data.email,password:hashedPassword,role:data.role??"DOCTOR",specialty:data.specialty||null,language:data.language||"es-EC",isActive:data.isActive??true},select:safeSelect})
  await tx.auditLog.create({data:{userId:user.id,action:"CREATE_USER",entity:"USER",entityId:row.id,details:"Cuenta creada",newData:{id:row.id,email:row.email,role:row.role},...meta}});return row
 })}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2002")return forbidden("Ya existe un usuario con ese correo",409);throw error}
})
export const PATCH=createApiHandler({roles:["ADMIN"],schema:modificationSchema},async(_req,{user,data})=>{
 const {id,password,...updates}=data
 if(id===user.id&&(updates.isActive===false||(updates.role&&updates.role!=="ADMIN")))return forbidden("No puede desactivar su propia cuenta administrativa ni quitarse el rol administrador",409)
 const hashedPassword=password?await bcrypt.hash(password,12):undefined;const meta=await metadata()
 const result=await prisma.$transaction(async tx=>{
  const previous=await tx.user.findUnique({where:{id}})
  if(!previous)return {error:"Usuario no encontrado",status:404} as const
  if(updates.email&&updates.email!==previous.email)return {error:"El correo autorizado no se puede modificar desde este formulario",status:409} as const
  if(previous.role==="ADMIN"&&previous.isActive&&(updates.isActive===false||(updates.role&&updates.role!=="ADMIN"))){if(await tx.user.count({where:{role:"ADMIN",isActive:true}})<=1)return {error:"No se puede desactivar el último administrador",status:409} as const}
  const updated=await tx.user.update({where:{id},data:{...updates,...(hashedPassword?{password:hashedPassword}:{})},select:safeSelect})
  await tx.auditLog.create({data:{userId:user.id,action:"UPDATE_USER",entity:"USER",entityId:id,details:"Cuenta modificada",oldData:{role:previous.role,isActive:previous.isActive,email:previous.email},newData:{role:updated.role,isActive:updated.isActive,email:updated.email},...meta}})
  return {updated} as const
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable})
 if("error" in result)return forbidden(result.error??"Error al procesar usuario",result.status??400)
 return result.updated
})
export const DELETE=createApiHandler({roles:["ADMIN"]},async(_req,{user,searchParams})=>{
 const id=searchParams.get("id");if(!id)return forbidden("Falta el ID",400);if(id===user.id)return forbidden("No puede desactivar su propia cuenta",409);const meta=await metadata()
 const result=await prisma.$transaction(async tx=>{
  const existing=await tx.user.findUnique({where:{id}});if(!existing)return {error:"Usuario no encontrado",status:404} as const
  if(existing.role==="ADMIN"&&existing.isActive&&await tx.user.count({where:{role:"ADMIN",isActive:true}})<=1)return {error:"No se puede desactivar el último administrador",status:409} as const
  await tx.user.update({where:{id},data:{isActive:false}})
  await tx.auditLog.create({data:{userId:user.id,action:"DEACTIVATE_USER",entity:"USER",entityId:id,details:"Cuenta desactivada; historial de auditoría conservado",oldData:{isActive:existing.isActive},newData:{isActive:false},...meta}})
  return {success:true} as const
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable})
 if("error" in result)return forbidden(result.error??"Error al procesar usuario",result.status??400)
 return {success:true,message:"Cuenta desactivada; se conservó el historial"}
})
