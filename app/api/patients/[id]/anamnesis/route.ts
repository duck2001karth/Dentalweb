import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (req, { params }) => {
    const patientId = params.id as string
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, isDeleted: false },
      select: { id: true },
    })
    if (!patient) throw new Error("NOT_FOUND")
    const anamnesis = await prisma.anamnesis.findUnique({ where: { patientId } })
    
    if (!anamnesis || !anamnesis.data) return { data: null }

    const content: any = typeof anamnesis.data === "string" 
      ? JSON.parse(anamnesis.data) 
      : anamnesis.data
      
    return { data: content }
  }
)

export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] }, // RBAC aplicado directamente
  async (req, { params, data, audit }) => {
    const patientId = params.id as string

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, isDeleted: false },
      select: { id: true },
    })
    if (!patient) throw new Error("NOT_FOUND")

    const anamnesisPayload = {
      motivo: data.motivo || { tags: [], notes: "" },
      enfermedadActual: data.enfermedadActual || { tags: [], notes: "" },
      alertasMedicas: data.alertasMedicas || { tags: [], notes: "" },
      enfermedades: data.enfermedades || { tags: [], notes: "" },
      medicamentos: data.medicamentos || { tags: [], notes: "" },
      habitos: data.habitos || { tags: [], notes: "" },
      antecedentesOdonto: data.antecedentesOdonto || { tags: [], notes: "" },
      antecedentesFamiliares: data.antecedentesFamiliares || { tags: [], notes: "" },
    }

    const saved = await prisma.$transaction(async (tx) => {
      const res = await tx.anamnesis.upsert({
        where: { patientId },
        update: { data: anamnesisPayload },
        create: { patientId, data: anamnesisPayload },
      })

      const alertTags = data.alertasMedicas?.tags || []
      if (alertTags.length > 0) {
        await tx.patient.update({
          where: { id: patientId },
          data: { medicalAlerts: alertTags.join(", ") },
        })
      }
      return res
    })

    await audit({
      action: "UPDATE_ANAMNESIS",
      entity: "ANAMNESIS",
      entityId: saved.id,
      patientId: patientId,
      details: "Actualización de ficha médica (Anamnesis)",
    })

    return { success: true, data: saved }
  }
)