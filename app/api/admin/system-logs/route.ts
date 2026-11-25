import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
export const dynamic="force-dynamic"
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}
export const GET=createApiHandler({roles:["ADMIN"]},async()=>{
 const logs=await prisma.systemLog.findMany({take:100,orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,level:true,message:true,createdAt:true}})
 return NextResponse.json(logs,{headers})
})
