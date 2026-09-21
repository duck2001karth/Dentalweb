import { AppLayout } from "@/components/layouts/app-layout"
import dynamic from 'next/dynamic'
import { Skeleton } from "@/components/ui/skeleton" 
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { DashboardAgenda } from "@/components/agenda-comp/agenda"

const Greeting = dynamic(() =>
  import('@/components/dashboard/greeting').then((mod) => mod.Greeting),
  { 
    loading: () => (
      <div className="w-full">
        <Skeleton className="h-[280px] w-full rounded-2xl" />
      </div>
    )
  }
)

export default async function IndexPage() {
  const session = await getServerSession()
  if (!session) {
    redirect("/auth")
  }

  return (
    <AppLayout>
      <div className="w-full px-4 md:px-6 py-6 lg:py-8 flex flex-col gap-8 pb-12 animate-in fade-in duration-500 min-h-[calc(100vh-70px)]">
        <div className="w-full">
          <Greeting />
        </div>
        <div className="w-full">
          <DashboardAgenda />
        </div>

      </div>
    </AppLayout>
  )
}