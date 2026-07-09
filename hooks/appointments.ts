import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { 
  AppointmentWithDetails, 
  AppointmentInput, 
  UpdateAppointmentInput 
} from "@/types/appointments"

interface UseGetAppointmentsParams {
  fecha?: Date | string;
  statuses?: string[];
  search?: string;
  skip?: boolean;
  doctorId?: string; 
  patientId?: string; 
}

export function useGetAppointments(params?: UseGetAppointmentsParams) {
  const fechaStr = params?.fecha 
    ? (typeof params.fecha === 'string' ? params.fecha : format(params.fecha, "yyyy-MM-dd"))
    : undefined

  const buildUrl = () => {
    const url = new URL("/api/citas", global?.window?.location.origin || "http://localhost:3000")

    if (fechaStr) {
      url.searchParams.append("fecha", fechaStr)
    }
    if (params?.search) {
      url.searchParams.append("search", params.search)
    }
    if (params?.statuses && params.statuses.length > 0) {
      url.searchParams.append("statuses", params.statuses.join(","))
    }
    if (params?.doctorId && params.doctorId !== "all") {
      url.searchParams.append("doctorId", params.doctorId)
    }
    if (params?.patientId) {
      url.searchParams.append("patientId", params.patientId)
    }

    return url.toString()
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["appointments", { ...params, fecha: fechaStr, doctorId: params?.doctorId, patientId: params?.patientId }],
    queryFn: async () => {
      const urlString = buildUrl()
      const response = await fetch(urlString)
      
      if (!response.ok) {
        throw new Error("Error al obtener las citas de la base de datos")
      }
      const json = await response.json()
      return json.citas as AppointmentWithDetails[]
    },
    enabled: !params?.skip,
  })

  return {
    appointments: data || [],
    isLoading,
    error,
    refetch
  }
}

export function useGetAppointment(id: string) {
  const { isLoading, data, error } = useQuery({
    queryKey: ["appointment", id],
    queryFn: async () => {
      const response = await fetch(`/api/citas/${id}`)
      if (!response.ok) throw new Error("Error al obtener la cita")
      const json = await response.json()
      return json.cita as AppointmentWithDetails
    },
    enabled: !!id,
  })

  return {
    isLoading,
    appointment: data,
    error
  }
}

// 3. CREAR CITA
export function useCreateAppointment() {
  const queryClient = useQueryClient()

  const {
    mutate: createAppointment,
    isPending: isLoading,
    isSuccess,
  } = useMutation({
    mutationFn: async (input: AppointmentInput) => {
      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Error al crear la cita')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["citas"] }) 
    },
  })

  return {
    createAppointment,
    isLoading,
    isSuccess
  }
}

// 4. ACTUALIZAR CITA (Ideal para cambiar estados a En Progreso, Atendido, etc)
export function useUpdateAppointment() {
  const queryClient = useQueryClient()

  const {
    mutate: updateAppointment,
    isPending: isLoading,
    isSuccess,
  } = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateAppointmentInput }) => {
      const response = await fetch(`/api/citas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      
      if (!response.ok) throw new Error("Error al actualizar la cita")
      return response.json()
    },
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ["appointment", updated.id] })
      const previousAppointment = queryClient.getQueryData(["appointment", updated.id])
      
      queryClient.setQueryData(["appointment", updated.id], (old: any) => {
        if (!old) return old
        return {
          ...old,
          ...updated.input,
        }
      })

      return { previousAppointment, updated }
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(["appointment", context?.updated.id], context?.previousAppointment)
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["appointment", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["citas"] })
    },
  })

  return {
    updateAppointment,
    isLoading,
    isSuccess
  }
}

// 5. ELIMINAR / CANCELAR CITA
export function useDeleteAppointment() {
  const queryClient = useQueryClient()

  const {
    mutate: deleteAppointment,
    isPending: isLoading,
    isSuccess,
  } = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/citas/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error("Error al eliminar la cita")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["citas"] })
    },
  })

  return {
    deleteAppointment,
    isLoading,
    isSuccess
  }
}