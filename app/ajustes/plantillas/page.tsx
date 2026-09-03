import { Nav } from "@/components/nav"
import { TemplatesView } from "@/components/configurations/templates/templates-view"

export const metadata = {
  title: "Plantillas Clínicas | Carmo Dental",
}

export default function DocumentTemplatesPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Nav />
      <main className="flex-1 h-full overflow-y-auto w-full">
        <TemplatesView />
      </main>
    </div>
  )
}