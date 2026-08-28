import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"
const SETTINGS_ID = "default-clinic-settings"

export async function GET() {
  try {
    let settings = await prisma.clinicSettings.findUnique({
      where: { id: SETTINGS_ID }
    })

    if (!settings) {
      settings = await prisma.clinicSettings.create({
        data: {
          id: SETTINGS_ID,
          clinicName: "Carmo Dental",
          currency: "USD",
          taxRate: 0,
          estabCode: "001",
          ptoEmiCode: "001",
          availableBoxes: ["Box 1 (Principal)", "Box 2 (Ortodoncia)", "Box 3 (Cirugía)"],
          footerText: "Documento emitido por Carmo Dental. Información médica confidencial."
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error al obtener ClinicSettings:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    const updated = await prisma.clinicSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        clinicName: body.clinicName || "Carmo Dental",
        ruc: body.ruc || null,
        razonSocial: body.razonSocial || null,
        estabCode: body.estabCode || "001",
        ptoEmiCode: body.ptoEmiCode || "001",
        obligadoContab: Boolean(body.obligadoContab),
        taxRate: parseFloat(body.taxRate || 0),
        currency: body.currency || "USD",
        address: body.address || null,
        phone: body.phone || null,
        whatsappNumber: body.whatsappNumber || null,
        email: body.email || null,
        website: body.website || null,
        availableBoxes: body.availableBoxes || ["Box 1"],
        footerText: body.footerText || null,
        logoUrl: body.logoUrl || null,
        watermarkUrl: body.watermarkUrl || null
      },
      create: {
        id: SETTINGS_ID,
        clinicName: body.clinicName || "Carmo Dental",
        ruc: body.ruc || null,
        razonSocial: body.razonSocial || null,
        estabCode: body.estabCode || "001",
        ptoEmiCode: body.ptoEmiCode || "001",
        obligadoContab: Boolean(body.obligadoContab),
        taxRate: parseFloat(body.taxRate || 0),
        currency: body.currency || "USD",
        address: body.address || null,
        phone: body.phone || null,
        whatsappNumber: body.whatsappNumber || null,
        email: body.email || null,
        website: body.website || null,
        availableBoxes: body.availableBoxes || ["Box 1"],
        footerText: body.footerText || null,
        logoUrl: body.logoUrl || null,
        watermarkUrl: body.watermarkUrl || null
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error al actualizar ClinicSettings:", error)
    return NextResponse.json({ error: "Error guardando ajustes" }, { status: 500 })
  }
}