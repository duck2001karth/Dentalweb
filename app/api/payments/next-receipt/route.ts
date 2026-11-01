import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async () => {
    try {
      const lastPayment = await prisma.payment.findFirst({
        where: { receiptNumber: { startsWith: "REC-" } },
        orderBy: { createdAt: "desc" },
        select: { receiptNumber: true },
      })

      let nextNumber = 1
      if (lastPayment?.receiptNumber) {
        const match = lastPayment.receiptNumber.match(/\d+$/)
        if (match) nextNumber = parseInt(match[0], 10) + 1
      } else {
        const count = await prisma.payment.count()
        nextNumber = count + 1
      }

      return { nextReceipt: `REC-${nextNumber.toString().padStart(5, "0")}` }
    } catch (error) {
      return { nextReceipt: `REC-${Date.now().toString().slice(-5)}` }
    }
  }
)