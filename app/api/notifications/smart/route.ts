import { createApiHandler } from "@/lib/server/api-handler"
import { workflowNotices,markWorkflowNotices } from "@/lib/server/workflow-notices"
import { z } from "zod"
export const dynamic="force-dynamic"
export const GET=createApiHandler({roles:["ADMIN","DOCTOR","RECEPTIONIST"]},async(_,{user})=>workflowNotices(user))
export const PATCH=createApiHandler({roles:["ADMIN","DOCTOR","RECEPTIONIST"],schema:z.object({ids:z.array(z.string().max(250)).max(250)})},async(_,{user,data})=>markWorkflowNotices(user,data.ids))
