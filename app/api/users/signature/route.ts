import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"

export const GET = createApiHandler(
  {}, 
  async (req, { user }) => {
    const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
    if (!dbUser) throw new Error("NOT_FOUND")

    const userData = dbUser as Record<string, any>
    const professionalCard = userData.professionalCard ?? userData.licenseNumber ?? ""

    return {
      signatureBase64: userData.signatureBase64 || null,
      professionalCard,
      specialty: userData.specialty || "Ortodoncia",
    }
  }
)

export const PATCH = createApiHandler(
  {
    schema: z.object({
      signatureBase64: z.string().nullable().optional(),
      professionalCard: z.string().optional(),
      specialty: z.string().optional(),
    }).passthrough(),
  },
  async (req, { user, data }) => {
    const updateData: Record<string, any> = {}
    if (data.signatureBase64 !== undefined) updateData.signatureBase64 = data.signatureBase64
    if (data.specialty !== undefined) updateData.specialty = data.specialty
    if (data.professionalCard !== undefined) updateData.professionalCard = data.professionalCard

    let updatedUser: any
    try {
      updatedUser = await prisma.user.update({
        where: { email: user.email! },
        data: updateData,
      })
    } catch (dbErr: any) {
      if (data.professionalCard !== undefined && dbErr?.message?.includes("professionalCard")) {
        delete updateData.professionalCard
        updateData.licenseNumber = data.professionalCard
        updatedUser = await prisma.user.update({
          where: { email: user.email! },
          data: updateData,
        })
      } else {
        throw dbErr
      }
    }

    const resData = updatedUser as Record<string, any>
    const resolvedCard = resData.professionalCard ?? resData.licenseNumber ?? data.professionalCard ?? ""

    return {
      success: true,
      signatureBase64: resData.signatureBase64,
      professionalCard: resolvedCard,
      specialty: resData.specialty,
    }
  }
)