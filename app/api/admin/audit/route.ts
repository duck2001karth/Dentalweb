import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiHandler } from "@/lib/server/api-handler"
export const dynamic="force-dynamic"
export const GET=createApiHandler({roles:["ADMIN"]},async()=>{
 const logs=await prisma.auditLog.findMany({take:100,orderBy:{createdAt:"desc"},include:{user:{select:{name:true,email:true,role:true}}}})
 return NextResponse.json(logs,{headers:{"Cache-Control":"private, no-store"}})
})
