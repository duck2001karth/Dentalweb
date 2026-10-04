import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Acceso denegado. No autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    if (!q || q.length < 2) {
      return NextResponse.json({ patients: [], catalog: [] });
    }

    const [patients, catalog] = await Promise.all([
      prisma.patient.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { ci: { contains: q, mode: 'insensitive' } }
          ],
          isDeleted: false
        },
        take: 5,
        select: { id: true, firstName: true, lastName: true, ci: true }
      }),
      
      prisma.procedureCatalog.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } }
          ],
          isActive: true
        },
        take: 5,
        select: { id: true, name: true, code: true, category: true, basePrice: true }
      })
    ]);

    return NextResponse.json({ patients, catalog });
    
  } catch (error) {
    console.error("Error en la búsqueda:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}