import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"
const SETTINGS_ID = "default-clinic-settings"

// Helper para capturar metadatos y registrar auditoría
async function createAuditEntry(
  tx: any,
  data: {
    userId: string
    action: "UPDATE"
    entityId: string
    details?: string
    oldData?: any
    newData?: any
  }
) {
  try {
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await tx.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: "CLINIC_SETTINGS",
        entityId: data.entityId,
        details: data.details || null,
        oldData: data.oldData || null,
        newData: data.newData || null,
        ipAddress,
        userAgent,
      },
    })
  } catch (err) {
    console.error("Error al registrar auditoría en ClinicSettings:", err)
  }
}

// 1. Obtener ajustes institucionales
export async function GET() {
  try {
    let settings = await prisma.clinicSettings.findUnique({
      where: { id: SETTINGS_ID },
    })

    if (!settings) {
      settings = await prisma.clinicSettings.create({
        data: {
          id: SETTINGS_ID,
          clinicName: "Carmo Dental",
          slogan: "CLÍNICA DE ESPECIALIDADES ODONTOLÓGICAS",
          city: "Quito",
          country: "Ecuador",
          currency: "USD",
          taxRate: 0,
          estabCode: "001",
          ptoEmiCode: "001",
          availableBoxes: ["Box 1 (Principal)", "Box 2 (Ortodoncia)", "Box 3 (Cirugía)"],
          footerText: "Documento emitido por Carmo Dental. Información médica confidencial.",
          defaultPrintMode: "color",
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error al obtener ClinicSettings:", error)
    return NextResponse.json({ error: "Error interno al obtener configuración" }, { status: 500 })
  }
}

// 2. Modificar ajustes (Exclusivo Administradores con Auditoría)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const currentUser = session.user as any
    const userRole = String(currentUser?.role || "").toUpperCase().trim()

    const isAuthorized =
      userRole === "ADMIN" ||
      userRole === "ADMINISTRADOR" ||
      userRole === "ADMINISTRATION"

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Solo administradores pueden modificar los ajustes de la clínica" },
        { status: 403 }
      )
    }

    const body = await req.json()

    const updateData: any = {
      clinicName: body.clinicName || "Carmo Dental",
      slogan: body.slogan ?? null,
      ruc: body.ruc ?? null,
      razonSocial: body.razonSocial ?? null,
      estabCode: body.estabCode || "001",
      ptoEmiCode: body.ptoEmiCode || "001",
      obligadoContab: Boolean(body.obligadoContab),
      taxRate: parseFloat(body.taxRate) || 0,
      currency: body.currency || "USD",
      address: body.address ?? null,
      city: body.city ?? null,
      country: body.country ?? null,
      phone: body.phone ?? null,
      whatsappNumber: body.whatsappNumber ?? null,
      email: body.email ?? null,
      website: body.website ?? null,
      availableBoxes: Array.isArray(body.availableBoxes) ? body.availableBoxes : ["Box 1"],
      footerText: body.footerText ?? null,
      defaultPrintMode: body.defaultPrintMode || "color",
      logoUrl: body.logoUrl ?? null,
      watermarkUrl: body.watermarkUrl ?? null,
    }

    if (body.logoScale !== undefined) {
      updateData.logoScale = Number(body.logoScale) || 100
    }

    if (body.watermarkOpacity !== undefined) {
      updateData.watermarkOpacity = Number(body.watermarkOpacity) || 14
    }

    if (body.watermarkScale !== undefined) {
      updateData.watermarkScale = Number(body.watermarkScale) || 100
    }

    const updated = await prisma.$transaction(async (tx) => {
      const previous = await tx.clinicSettings.findUnique({
        where: { id: SETTINGS_ID },
      })

      const res = await tx.clinicSettings.upsert({
        where: { id: SETTINGS_ID },
        update: updateData,
        create: {
          id: SETTINGS_ID,
          ...updateData,
        },
      })

      await createAuditEntry(tx, {
        userId: currentUser.id,
        action: "UPDATE",
        entityId: SETTINGS_ID,
        details: `Actualización de configuración general de la clínica (${res.clinicName})`,
        oldData: previous
          ? {
              clinicName: previous.clinicName,
              ruc: previous.ruc,
              phone: previous.phone,
              whatsappNumber: previous.whatsappNumber,
              address: previous.address,
              email: previous.email,
              hasLogo: Boolean(previous.logoUrl),
            }
          : null,
        newData: {
          clinicName: res.clinicName,
          ruc: res.ruc,
          phone: res.phone,
          whatsappNumber: res.whatsappNumber,
          address: res.address,
          email: res.email,
          hasLogo: Boolean(res.logoUrl),
        },
      })

      return res
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error al actualizar ClinicSettings:", error?.message || error)
    return NextResponse.json(
      { error: error?.message || "Error al guardar los ajustes de la clínica" },
      { status: 500 }
    )
  }
}