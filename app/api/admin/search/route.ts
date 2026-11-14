import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

// Conservamos los roles actuales del personal que utiliza el buscador.
// La validación de sesión, usuario activo y rol se centraliza en createApiHandler.
export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { searchParams }) => {
    const rawQuery = searchParams.get("q")
    const query = rawQuery?.trim() ?? ""

    if (query.length < 2) {
      return { patients: [], catalog: [] }
    }

    if (query.length > 80 || /[\u0000-\u001f\u007f]/.test(query)) {
      return NextResponse.json(
        { error: "La búsqueda debe tener entre 2 y 80 caracteres válidos" },
        { status: 400 }
      )
    }

    const [patients, catalog] = await Promise.all([
      prisma.patient.findMany({
        where: {
          isDeleted: false,
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { ci: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          ci: true,
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        take: 5,
      }),
      prisma.procedureCatalog.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { code: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          code: true,
          category: true,
          basePrice: true,
        },
        orderBy: { name: "asc" },
        take: 5,
      }),
    ])

    return { patients, catalog }
  }
)
