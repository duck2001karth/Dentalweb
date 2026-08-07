import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  TreatmentPlan, 
  UseGetTreatmentsParams, 
  TreatmentPlanInput, 
  UpdateTreatmentInput 
} from "@/types/treatments"

// 1. OBTENER MÚLTIPLES PLANES
export function useGetTreatmentPlans(params?: UseGetTreatmentsParams) {
  const buildUrl = () => {
    const url = new URL(`${global?.window?.location.origin}/api/treatments`)

    if (params?.patientId) url.searchParams.append("patientId", params.patientId)
    if (params?.search) url.searchParams.append("search", params.search)
    if (params?.status) url.searchParams.append("status", params.status)

    return url.href
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["treatments", params],
    queryFn: async () => {
      const url = buildUrl()
      const response = await fetch(url)
      
      if (!response.ok) throw new Error("Error al obtener los planes")
      const json = await response.json()
      return (json.plans || json || []) as TreatmentPlan[]
    },
    enabled: !params?.skip,

    // 💡 DESACTIVA EL RE-FETCH SOLO AL CAMBIAR DE PESTAÑA DEL NAVEGADOR
    refetchOnWindowFocus: false,
  })

  return {
    plans: data || [],
    isLoading,
    isError, 
    error,
    refetch
  }
}

// 2. OBTENER UN PLAN ESPECÍFICO POR ID
export function useGetTreatmentPlan(id: string) {
  const { isLoading, data, error } = useQuery({
    queryKey: ["treatment", id],
    queryFn: async () => {
      const response = await fetch(`/api/treatments/${id}`)
      if (!response.ok) throw new Error("Error al obtener el plan de tratamiento")
      const json = await response.json()
      return json.plan || json
    },
    enabled: !!id,

    // 💡 DESACTIVA EL RE-FETCH SOLO AL CAMBIAR DE PESTAÑA DEL NAVEGADOR
    refetchOnWindowFocus: false,
  })

  return {
    isLoading,
    plan: data,
    error
  }
}

// 3. CREAR NUEVO PLAN DE TRATAMIENTO
export function useCreateTreatmentPlan() {
  const queryClient = useQueryClient()

  const {
    mutate: createTreatmentPlan,
    isPending: isLoading,
    isSuccess,
  } = useMutation({
    mutationFn: async (input: TreatmentPlanInput) => {
      const response = await fetch('/api/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Error al crear el plan de tratamiento')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatments"] })
    },
  })

  return {
    createTreatmentPlan,
    isLoading,
    isSuccess
  }
}

// 4. ACTUALIZAR PLAN DE TRATAMIENTO
export function useUpdateTreatmentPlan() {
  const queryClient = useQueryClient()

  const {
    mutate: updateTreatmentPlan,
    isPending: isLoading,
    isSuccess,
  } = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTreatmentInput }) => {
      const response = await fetch(`/api/treatments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      
      if (!response.ok) throw new Error("Error al actualizar el plan de tratamiento")
      return response.json()
    },
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ["treatment", updated.id] })
      const previousPlan = queryClient.getQueryData(["treatment", updated.id])
      
      queryClient.setQueryData(["treatment", updated.id], (old: any) => {
        if (!old) return old
        return {
          ...old,
          ...updated.input,
        }
      })

      return { previousPlan, updated }
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(["treatment", context?.updated.id], context?.previousPlan)
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["treatment", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["treatments"] })
    },
  })

  return {
    updateTreatmentPlan,
    isLoading,
    isSuccess
  }
}

// 5. ELIMINAR PLAN DE TRATAMIENTO
export function useDeleteTreatmentPlan() {
  const queryClient = useQueryClient()

  const {
    mutate: deleteTreatmentPlan,
    isPending: isLoading,
    isSuccess,
  } = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/treatments/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error("Error al eliminar el plan de tratamiento")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatments"] })
    },
  })

  return {
    deleteTreatmentPlan,
    isLoading,
    isSuccess
  }
}