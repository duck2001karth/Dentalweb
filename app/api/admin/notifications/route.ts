import { createApiHandler } from "@/lib/server/api-handler"
import { workflowNotices,markWorkflowNotices } from "@/lib/server/workflow-notices"
import { getSessionUser } from "@/lib/server/get-session-user"
import { NextResponse } from "next/server"
export const dynamic="force-dynamic"
export const GET=createApiHandler({roles:["ADMIN"]},async(_,{user})=>workflowNotices(user))
export async function PATCH(){try{const user=await getSessionUser();if(user.role!=="ADMIN")return NextResponse.json({error:"No autorizado"},{status:403});return NextResponse.json(await markWorkflowNotices(user,(await workflowNotices(user)).map(n=>n.id)))}catch{return NextResponse.json({error:"No se pudo actualizar"},{status:500})}}
