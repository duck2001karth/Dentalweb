import { createApiHandler } from "@/lib/server/api-handler"
import { deletePeriodontogram, jsonError, updatePeriodontogram, updateSchema, validId } from "../_shared"

// PUT /api/periodontogram/[id] {data}
export const PUT = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"], schema: updateSchema },
  async (_req, { user, params, data }) => {
    const id = params.id
    if (!validId(id)) return jsonError("ID de evaluación inválido", 400)
    const input = updateSchema.parse(data)
    return updatePeriodontogram(id, input.data, user)
  },
)

// DELETE /api/periodontogram/[id]
export const DELETE = createApiHandler(
  { roles: ["ADMIN"] },
  async (_req, { user, params }) => {
    const id = params.id
    if (!validId(id)) return jsonError("ID de evaluación inválido", 400)
    return deletePeriodontogram(id, user)
  },
)
