import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

const SETTINGS_ID = "default-clinic-settings"

// Un PATCH parcial debe modificar solo los campos suministrados.
// Se mantienen imágenes PNG/JPEG/WebP como data URL para los logotipos actuales.
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()
const imageField = z.string().max(1_500_000).refine(
  (value) => value === "" || /^https:\/\/[^\s]+$/i.test(value) ||
    /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value),
  "Imagen inválida; use HTTPS o PNG/JPEG/WebP en Base64",
).nullable().optional()

const updateSettingsSchema = z.object({
  clinicName: z.string().trim().min(2).max(160).optional(),
  slogan: optionalText(350),
  ruc: optionalText(30),
  razonSocial: optionalText(200),
  estabCode: z.string().trim().regex(/^\d{3}$/).optional(),
  ptoEmiCode: z.string().trim().regex(/^\d{3}$/).optional(),
  obligadoContab: z.boolean().optional(),
  taxRate: z.number().finite().min(0).max(100).optional(),
  currency: z.string().trim().regex(/^[A-Z]{3}$/).optional(),
  address: optionalText(500),
  city: optionalText(120),
  country: z.string().trim().min(2).max(120).optional(),
  timezone: z.string().trim().regex(/^[A-Za-z_]+\/[A-Za-z_+\/-]+$/).max(80).optional(),
  timeFormat: z.enum(["12h", "24h"]).optional(),
  phone: optionalText(40),
  whatsappNumber: optionalText(40),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]).nullable().optional(),
  website: z.union([z.literal(""), z.string().trim().url().max(500).refine(v => v.startsWith("https://"), "Solo HTTPS")]).nullable().optional(),
  availableBoxes: z.array(z.string().trim().min(1).max(100)).min(1).max(50)
    .refine(items => new Set(items).size === items.length, "Los boxes deben ser únicos").optional(),
  footerText: optionalText(2000),
  defaultPrintMode: z.enum(["color", "bw", "black-white", "grayscale"]).optional(),
  logoUrl: imageField,
  watermarkUrl: imageField,
  logoScale: z.number().int().min(10).max(300).nullable().optional(),
  watermarkOpacity: z.number().int().min(0).max(100).nullable().optional(),
  watermarkScale: z.number().int().min(10).max(300).nullable().optional(),
}).strict()

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async () => {
    return prisma.clinicSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: {
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
  },
)

export const PATCH = createApiHandler(
  { roles: ["ADMIN"], schema: updateSettingsSchema },
  async (_req, { user, data }) => {
    if (Object.keys(data).length === 0) {
      return { success: false, error: "No se proporcionaron cambios" }
    }

    const h = await headers()
    const ipAddress = (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "Desconocido").slice(0, 128)
    const userAgent = (h.get("user-agent") || "Desconocido").slice(0, 512)

    return prisma.$transaction(async tx => {
      const previous = await tx.clinicSettings.findUnique({ where: { id: SETTINGS_ID } })
      // No sobrescribir valores omitidos, en particular timezone/currency/availableBoxes.
      const updated = await tx.clinicSettings.upsert({
        where: { id: SETTINGS_ID },
        update: data,
        create: { id: SETTINGS_ID, clinicName: data.clinicName || "Carmo Dental", ...data },
      })
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_CLINIC_SETTINGS",
          entity: "CLINIC_SETTINGS",
          entityId: SETTINGS_ID,
          details: `Actualización de configuración clínica (${updated.clinicName})`,
          oldData: previous ? {
            clinicName: previous.clinicName, ruc: previous.ruc,
            timezone: previous.timezone, timeFormat: previous.timeFormat,
            hasLogo: Boolean(previous.logoUrl),
          } : undefined,
          newData: {
            clinicName: updated.clinicName, ruc: updated.ruc,
            timezone: updated.timezone, timeFormat: updated.timeFormat,
            hasLogo: Boolean(updated.logoUrl),
            changedFields: Object.keys(data),
          },
          ipAddress,
          userAgent,
        },
      })
      return updated
    })
  },
)
