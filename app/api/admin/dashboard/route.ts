import { createApiHandler } from "@/lib/server/api-handler"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { subDays, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay, format, eachDayOfInterval } from "date-fns"
import { es } from "date-fns/locale"
export const GET=createApiHandler({roles:["ADMIN"]},async()=>{
 const now=new Date();const currentMonthStart=startOfMonth(now);const currentMonthEnd=endOfMonth(now);const lastMonthStart=startOfMonth(subMonths(now,1));const lastMonthEnd=endOfMonth(subMonths(now,1));const todayStart=startOfDay(now);const todayEnd=endOfDay(now)
 const validPaymentsFilter:Prisma.PaymentWhereInput={status:"COMPLETED",OR:[{notes:null},{NOT:{notes:{contains:"[PAGO ELIMINADO"}}}]}
 const [catalogCount,totalPatients,newPatientsThisMonth,treatmentPlansAll,recentLogs,allPayments,todayPayments,todayAppointmentsCount,activeAgreementsCount]=await Promise.all([
 prisma.procedureCatalog.count({where:{isActive:true}}),prisma.patient.count(),prisma.patient.count({where:{createdAt:{gte:currentMonthStart,lte:currentMonthEnd}}}),
 prisma.treatmentPlan.findMany({select:{id:true,status:true,totalCost:true,createdAt:true,patientId:true,payments:{where:validPaymentsFilter,select:{amount:true,createdAt:true,patientId:true}}}}),
 prisma.auditLog.findMany({take:6,orderBy:{createdAt:"desc"},include:{user:{select:{name:true,role:true}}}}),
 prisma.payment.findMany({where:{...validPaymentsFilter,createdAt:{gte:startOfMonth(subMonths(now,11))}},select:{amount:true,createdAt:true,patientId:true}}),
 prisma.payment.aggregate({where:{...validPaymentsFilter,createdAt:{gte:todayStart,lte:todayEnd}},_sum:{amount:true}}),
 prisma.appointment.count({where:{date:{gte:todayStart,lte:todayEnd}}}),prisma.agreement.count({where:{isActive:true}})
 ])
 const within=(d:Date,a:Date,b:Date)=>d>=a&&d<=b
 const paymentsIn=(a:Date,b:Date)=>allPayments.filter(p=>within(new Date(p.createdAt),a,b))
 const sum=(payments:typeof allPayments)=>payments.reduce((s,p)=>s+Number(p.amount||0),0)
 const currentMonthPayments=paymentsIn(currentMonthStart,currentMonthEnd);const currentMonthIncome=sum(currentMonthPayments);const lastMonthIncome=sum(paymentsIn(lastMonthStart,lastMonthEnd))
 const incomeGrowth=lastMonthIncome>0?(currentMonthIncome-lastMonthIncome)/lastMonthIncome*100:currentMonthIncome>0?100:0
 const acceptedPlans=treatmentPlansAll.filter(p=>p.status==="ACTIVE"||p.status==="COMPLETED").length
 const acceptanceRate=treatmentPlansAll.length?Math.round(acceptedPlans/treatmentPlansAll.length*100):0
 const totalAccountsReceivable=treatmentPlansAll.reduce((s,p)=>p.status==="CANCELLED"?s:s+Math.max(0,Number(p.totalCost||0)-p.payments.reduce((a,x)=>a+Number(x.amount||0),0)),0)
 const activePayingCount=currentMonthPayments.length
 const averageTicket=activePayingCount?currentMonthIncome/activePayingCount:0
 const bucket=(name:string,a:Date,b:Date)=>({name,real:Number(sum(paymentsIn(a,b)).toFixed(2)),projected:Number(treatmentPlansAll.filter(p=>within(new Date(p.createdAt),a,b)).reduce((s,p)=>s+Number(p.totalCost||0),0).toFixed(2))})
 const data7D=eachDayOfInterval({start:subDays(now,6),end:now}).map(d=>bucket(format(d,"EEE",{locale:es}),startOfDay(d),endOfDay(d)))
 const data4W=[3,2,1,0].map(i=>bucket(i===0?"Últimos 7 d":`Sem -${i}`,startOfDay(subDays(now,i*7+6)),endOfDay(subDays(now,i*7))))
 const monthBuckets=(n:number)=>Array.from({length:n},(_,i)=>{const d=subMonths(now,n-i-1);return bucket(format(d,"MMM",{locale:es}),startOfMonth(d),endOfMonth(d))})
 const recentActivity=recentLogs.map(log=>({id:log.id,action:log.action,user:log.user?.name||"Sistema",details:log.details||"Movimiento registrado",time:log.createdAt.toISOString()}))
 return NextResponse.json({stats:{income:currentMonthIncome,incomeGrowth:Number(incomeGrowth.toFixed(1)),patients:totalPatients,patientsGrowth:newPatientsThisMonth,activePlans:acceptedPlans,catalogItems:catalogCount,acceptanceRate,totalAccountsReceivable:Number(totalAccountsReceivable.toFixed(2)),averageTicket:Number(averageTicket.toFixed(2)),payingPatientsCount:activePayingCount,todayIncome:Number(todayPayments._sum.amount||0),todayAppointments:todayAppointmentsCount,activeAgreements:activeAgreementsCount},chartPeriods:{"7D":data7D,"4W":data4W,"6M":monthBuckets(6),"1Y":monthBuckets(12)},recentActivity},{headers:{"Cache-Control":"private, no-store"}})
})
