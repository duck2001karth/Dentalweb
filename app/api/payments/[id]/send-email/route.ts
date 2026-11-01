import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
    schema: z.object({ email: z.string().email("Correo inválido") }),
  },
  async (req, { params, data }) => {
    const paymentId = params.id as string

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) throw new Error("NOT_FOUND")

    // Aquí conectas Resend, Nodemailer, etc.
    return { success: true, message: `Comprobante enviado a ${data.email}` }
  }
)