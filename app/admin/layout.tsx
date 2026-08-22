import AdminSidebar from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden text-foreground transition-colors duration-200">
      <AdminSidebar />
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <AdminTopbar />
        <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-background custom-scrollbar">
          <div className="w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}