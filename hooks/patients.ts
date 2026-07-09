import {
  UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { Patient, PatientInput, UpdatePatientInput } from "@/types/patients"

// --- HOOKS ---

export function useGetPatients(params?: {
  search?: string
  ci?: string
  skip?: boolean
}): {
  isLoading: boolean
  patients: Patient[]
  refetch: Function
} {
  const buildUrl = () => {
    const url = new URL(`${global?.window?.location.origin}/api/patients`)

    if (!params) return url.href

    if (params?.search) {
      url.searchParams.append("search", params.search)
    }

    if (params?.ci) {
      url.searchParams.append("ci", params.ci)
    }

    return url.href
  }

  const { isLoading, data, refetch } = useQuery({
    queryKey: ["patients", params],
    queryFn: async () => {
      const url = buildUrl()
      const request = await fetch(url)
      return request.json()
    },
    enabled: !params?.skip,
  })

  return {
    isLoading,
    patients: data?.patients,
    refetch,
  }
}

export function useGetPatient(id: string): {
  isLoading: boolean
  patient: Patient
} {
  const { isLoading, data } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const request = await fetch(`/api/patients/${id}`)
      return request.json()
    },
    enabled: !!id,
  })

  return {
    isLoading,
    patient: data?.patient,
  }
}

export function useCreatePatient() {
  const queryClient = useQueryClient()
  
  const {
    mutate: createPatient,
    isPending: isLoading,
    data,
    isSuccess,
    reset,
  } = useMutation({
    mutationFn: async (input: PatientInput) => {
      const request = await fetch(`/api/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      })
      
      if (!request.ok) {
         const err = await request.json()
         throw new Error(err.error || "Error al crear paciente")
      }
      return request.json()
    },
    onMutate: async (newPatient) => {
      if (!newPatient) return

      await queryClient.cancelQueries({ queryKey: ["patients"] })
      const previousPatients = queryClient.getQueryData(["patients"])
      const newPatientWithId: any = { 
        ...newPatient,
        id: Math.random().toString(36),
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData(
        ["patients"],
        (old: { patients: Patient[] } | undefined) => ({
          patients: old?.patients ? [newPatientWithId, ...old.patients] : [newPatientWithId],
        })
      )

      return { previousPatients }
    },
    onError: (err, newPatient, context: any) => {
      console.log(err)
      queryClient.setQueryData(["patients"], context?.previousPatients)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] })
    },
  })

  return {
    createPatient,
    isSuccess,
    data,
    isLoading,
    reset,
  }
}

export function useUpdatePatient() {
  const queryClient = useQueryClient()

  const {
    mutate: updatePatient,
    isPending: isLoading,
    data,
    isSuccess,
    reset,
  } = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdatePatientInput }) => {
      const request = await fetch(`/api/patients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      })
      if (!request.ok) throw new Error("Error al actualizar paciente")
      return request.json()
    },
    onMutate: async (updated) => {
      if (!updated) return

      await queryClient.cancelQueries({ queryKey: ["patient", updated.id] })
      const previousPatient = queryClient.getQueryData(["patient", updated.id])
      
      queryClient.setQueryData(
        ["patient", updated.id],
        (old?: { patient: Patient }) => {
          if (!old) return
          return {
            patient: {
              ...old.patient,
              ...updated.input,
            },
          }
        }
      )

      return { previousPatient, updated }
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(
        ["patient", context?.updated.id],
        context?.previousPatient
      )
    },
    onSettled: (data) => {
      setTimeout(() => {
        if (data?.id) {
             queryClient.invalidateQueries({ queryKey: ["patient", data.id] })
        }
        queryClient.invalidateQueries({ queryKey: ["patients"] })
      }, 300)
    },
  })

  return {
    updatePatient,
    isSuccess,
    data,
    isLoading,
    reset,
  }
}

export function useDeletePatient() {
  const queryClient = useQueryClient()

  const {
    mutate: deletePatient,
    isPending: isLoading,
    isSuccess,
    reset,
  } = useMutation({
    mutationFn: async (id: string) => {
      const request = await fetch(`/api/patients/${id}`, {
        method: "DELETE",
      })
      if (!request.ok) throw new Error("Error al eliminar paciente")
      return request.json()
    },
    onSuccess: () => {
      // Invalida la lista para que desaparezca automáticamente de la tabla
      queryClient.invalidateQueries({ queryKey: ["patients"] })
    },
  })

  return {
    deletePatient,
    isLoading,
    isSuccess,
    reset,
  }
}
// ==========================================
// HOOKS PARA COMENTARIOS DEL PACIENTE
// ==========================================

export function useGetPatientComments(patientId: string) {
  const { isLoading, data, refetch } = useQuery({
    queryKey: ["patient-comments", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/comments`)
      if (!res.ok) throw new Error("Error fetching comments")
      return res.json()
    },
    enabled: !!patientId,
  })

  return { isLoading, comments: data || [], refetch }
}

export function useCreatePatientComment() {
  const queryClient = useQueryClient()

  const { mutate: createComment, isPending: isLoading } = useMutation({
    mutationFn: async ({ patientId, text, authorId }: { patientId: string, text: string, authorId: string }) => {
      const res = await fetch(`/api/patients/${patientId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, authorId }),
      })
      if (!res.ok) throw new Error("Error creando comentario")
      return res.json()
    },
    onSuccess: (newComment, variables) => {
      // Invalida la caché para refrescar instantáneamente
      queryClient.invalidateQueries({ queryKey: ["patient-comments", variables.patientId] })
    },
  })

  return { createComment, isLoading }
}

// ==========================================
// HOOKS PARA TAREAS DEL PACIENTE
// ==========================================

export function useGetPatientTasks(patientId: string) {
  const { isLoading, data, refetch } = useQuery({
    queryKey: ["patient-tasks", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/tasks`)
      if (!res.ok) throw new Error("Error fetching tasks")
      return res.json()
    },
    enabled: !!patientId,
  })

  return { isLoading, tasks: data || [], refetch }
}

export function useCreatePatientTask() {
  const queryClient = useQueryClient()

  const { mutate: createTask, isPending: isLoading } = useMutation({
    mutationFn: async ({ patientId, title, creatorId, assignedToId }: { patientId: string, title: string, creatorId: string, assignedToId?: string | null }) => {
      const res = await fetch(`/api/patients/${patientId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, creatorId, assignedToId }),
      })
      if (!res.ok) throw new Error("Error creando tarea")
      return res.json()
    },
    onSuccess: (newTask, variables) => {
      queryClient.invalidateQueries({ queryKey: ["patient-tasks", variables.patientId] })
    },
  })

  return { createTask, isLoading }
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  const { mutate: toggleTask } = useMutation({
    mutationFn: async ({ patientId, taskId, isCompleted }: { patientId: string, taskId: string, isCompleted: boolean }) => {
      const res = await fetch(`/api/patients/${patientId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted }),
      })
      if (!res.ok) throw new Error("Error actualizando tarea")
      return res.json()
    },
    onMutate: async ({ patientId, taskId, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: ["patient-tasks", patientId] })
      const previousTasks = queryClient.getQueryData(["patient-tasks", patientId])
      
      queryClient.setQueryData(["patient-tasks", patientId], (oldTasks: any) => {
        if (!oldTasks) return []
        return oldTasks.map((t: any) => t.id === taskId ? { ...t, isCompleted } : t)
      })
      
      return { previousTasks, patientId }
    },
    onError: (err, newTodo, context: any) => {
      queryClient.setQueryData(["patient-tasks", context.patientId], context.previousTasks)
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["patient-tasks", variables.patientId] })
    },
  })

  return { toggleTask }
}