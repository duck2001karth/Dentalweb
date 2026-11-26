import { getSessionUser } from "@/lib/server/get-session-user"
import { redirect } from "next/navigation"
import { PatientTrash } from "@/components/admin/patient-trash"
export const dynamic = "force-dynamic"
export default async function TrashPage() {
  const user = await getSessionUser().catch(() => null)
  if (!user) redirect("/auth")
  if (user.role !== "ADMIN") redirect("/unauthorized")
  return <PatientTrash />
}
