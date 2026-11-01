import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { searchParams }) => {
    const daysParam = parseInt(searchParams.get("days") || "7", 10)
    const doctorId = searchParams.get("doctorId")
    const limit = parseInt(searchParams.get("limit") || "100", 10)

    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - (isNaN(daysParam) ? 7 : daysParam))

    const evolutions = await prisma.clinicalNote.findMany({
      where: {
        type: "EVOLUTION",
        createdAt: {
          gte: fromDate,
        },
        ...(doctorId && { authorId: doctorId }),
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, ci: true, phone: true },
        },
        author: {
          select: { id: true, name: true, specialty: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    })

    return evolutions
  }
)