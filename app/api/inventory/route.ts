import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const inventoryItems = await prisma.inventoryItem.findMany({
      orderBy: { createdAt: "desc" }
    })
    
    return NextResponse.json({ items: inventoryItems })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}