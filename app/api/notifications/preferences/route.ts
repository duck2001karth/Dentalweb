import { prisma } from "@/lib/db"
import { createApiHandler } from "@/lib/server/api-handler"
import { preferences } from "@/lib/server/workflow"
import { z } from "zod"
export const dynamic="force-dynamic"
export const GET=createApiHandler({roles:["ADMIN","DOCTOR","RECEPTIONIST"]},async(_,{user})=>preferences(user.id))
const schema=z.object({arrivals:z.boolean(),appointments:z.boolean(),reminders:z.boolean(),waiting:z.boolean(),completed:z.boolean(),stock:z.boolean(),minutes:z.union([z.literal(5),z.literal(10),z.literal(15),z.literal(30)])}).strict()
export const PATCH=createApiHandler({roles:["ADMIN","DOCTOR","RECEPTIONIST"],schema},async(_,{user,data:d})=>{
 await prisma.$executeRaw`INSERT INTO public."WorkflowPreference" ("userId","arrivals","appointments","reminders","waiting","completed","stock","minutes") VALUES (${user.id},${d.arrivals},${d.appointments},${d.reminders},${d.waiting},${d.completed},${d.stock},${d.minutes}) ON CONFLICT("userId") DO UPDATE SET "arrivals"=EXCLUDED."arrivals","appointments"=EXCLUDED."appointments","reminders"=EXCLUDED."reminders","waiting"=EXCLUDED."waiting","completed"=EXCLUDED."completed","stock"=EXCLUDED."stock","minutes"=EXCLUDED."minutes"`
 return {success:true}
})
