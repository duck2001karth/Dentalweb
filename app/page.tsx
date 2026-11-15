
import { AppLayout } from "@/components/layouts/app-layout"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { DashboardAgenda } from "@/components/agenda-comp/agenda"

const Greeting = dynamic(
  () =>
    import("@/components/dashboard/greeting").then(
      (mod) => mod.Greeting
    ),
  {
    loading: () => (
      <div className="w-full min-w-0">
        <Skeleton className="h-[240px] w-full rounded-2xl sm:h-[260px] lg:h-[280px]" />
      </div>
    ),
  }
)

export default async function IndexPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth")
  }

  return (
    <AppLayout>
      <div
        className="
          mx-auto flex
          min-h-[calc(100dvh-70px)]
          w-full min-w-0
          max-w-[1800px]
          flex-col
          gap-5
          px-3 py-4
          pb-8
          sm:px-4 sm:py-5
          md:gap-6 md:px-6 md:py-6
          lg:gap-8 lg:px-8 lg:py-8 lg:pb-12
          motion-safe:animate-in
          motion-safe:fade-in
          motion-safe:duration-300
        "
      >
        <section className="w-full min-w-0">
          <Greeting />
        </section>

        <section
          className="w-full min-w-0"
          aria-label="Agenda diaria"
        >
          <DashboardAgenda />
        </section>
      </div>
    </AppLayout>
  )
}
