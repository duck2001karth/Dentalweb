import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

const SETTINGS_ID = "default-clinic-settings"

// Validación flexible porque es un PATCH parcial (upsert)
const updateSettingsSchema = z.object({
  clinicName: z.string().optional(),
  slogan: z.string().nullable().optional(),
  ruc: z.string().nullable().optional(),
  razonSocial: z.string().nullable().optional(),
  estabCode: z.string().optional(),
  ptoEmiCode: z.string().optional(),
  obligadoContab: z.boolean().optional(),
  taxRate: z.number().optional(),
  currency: z.string().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  timezone: z.string().optional(),
  timeFormat: z.string().optional(),
  phone: z.string().nullable().optional(),
  whatsappNumber: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  availableBoxes: z.array(z.string()).optional(),
  footerText: z.string().nullable().optional(),
  defaultPrintMode: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  watermarkUrl: z.string().nullable().optional(),
  logoScale: z.number().optional(),
  watermarkOpacity: z.number().optional(),
  watermarkScale: z.number().optional(),
})

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async () => {
    let settings = await prisma.clinicSettings.findUnique({
      where: { id: SETTINGS_ID },
    })

    if (!settings) {
      settings = await prisma.clinicSettings.create({
        data: {
          id: SETTINGS_ID,
          clinicName: "Clinica... ",
          slogan: "Clinica ...",
          city: "Quito",
          country: "Ecuador",
          currency: "USD",
          taxRate: 0,
          estabCode: "001",
          ptoEmiCode: "001",
          timezone: "America/Guayaquil",
          timeFormat: "24h",
          availableBoxes: ["Box 1 (Principal)", "Box 2 (Ortodoncia)", "Box 3 (Cirugía)"],
          footerText: "Documento emitido por Carmo Dental. Información médica confidencial.",
          defaultPrintMode: "color",
        },
      })
    }

    return settings
  }
)

export const PATCH = createApiHandler(
  {
    roles: ["ADMIN"],
    schema: updateSettingsSchema,
  },
  async (req, { user, data }) => {
    const updateData: any = {
      clinicName: data.clinicName || "Carmo Dental",
      slogan: data.slogan ?? null,
      ruc: data.ruc ?? null,
      razonSocial: data.razonSocial ?? null,
      estabCode: data.estabCode || "001",
      ptoEmiCode: data.ptoEmiCode || "001",
      obligadoContab: Boolean(data.obligadoContab),
      taxRate: data.taxRate || 0,
      currency: data.currency || "USD",
      address: data.address ?? null,
      city: data.city ?? null,
      country: data.country ?? null,
      timezone: data.timezone || "America/Guayaquil",
      timeFormat: data.timeFormat || "24h",
      phone: data.phone ?? null,
      whatsappNumber: data.whatsappNumber ?? null,
      email: data.email ?? null,
      website: data.website ?? null,
      availableBoxes: Array.isArray(data.availableBoxes) ? data.availableBoxes : ["Box 1"],
      footerText: data.footerText ?? null,
      defaultPrintMode: data.defaultPrintMode || "color",
      logoUrl: data.logoUrl ?? null,
      watermarkUrl: data.watermarkUrl ?? null,
      ...(data.logoScale !== undefined && { logoScale: data.logoScale }),
      ...(data.watermarkOpacity !== undefined && { watermarkOpacity: data.watermarkOpacity }),
      ...(data.watermarkScale !== undefined && { watermarkScale: data.watermarkScale }),
    }

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

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

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_CLINIC_SETTINGS",
          entity: "CLINIC_SETTINGS",
          entityId: SETTINGS_ID,
          details: `Actualización de configuración general de la clínica (${res.clinicName})`,
          oldData: previous
            ? {
                clinicName: previous.clinicName,
                ruc: previous.ruc,
                timezone: previous.timezone,
                timeFormat: previous.timeFormat,
                phone: previous.phone,
                hasLogo: Boolean(previous.logoUrl),
              }
            : undefined,
          newData: {
            clinicName: res.clinicName,
            ruc: res.ruc,
            timezone: res.timezone,
            timeFormat: res.timeFormat,
            phone: res.phone,
            hasLogo: Boolean(res.logoUrl),
          },
          ipAddress,
          userAgent
        },
      })

      return res
    })

    return updated
  }
)