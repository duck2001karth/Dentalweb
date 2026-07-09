import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

// --- TIPOS ---
export interface ClinicalNote {
  id: string
  type: "EVOLUTION" | "PRESCRIPTION" | "GENERAL"
  content: string
  patientId: string
  authorId: string
  isSigned: boolean
  createdAt: string
}

export type ClinicalNoteInput = Omit<ClinicalNote, "id" | "isSigned" | "createdAt" | "updatedAt">
export type UpdateClinicalNoteInput = Partial<ClinicalNoteInput> & { isSigned?: boolean }

// --- HOOKS ---

export function useGetClinicalNotes(params?: {
  patientId?: string
  authorId?: string
  type?: string
  skip?: boolean
}): {
  isLoading: boolean
  clinicalNotes: ClinicalNote[]
  refetch: Function
} {
  const buildUrl = () => {
    const url = new URL(`${global?.window?.location.origin}/api/clinical-notes`)

    if (!params) return url.href

    if (params?.patientId) {
      url.searchParams.append("patientId", params.patientId)
    }

    if (params?.authorId) {
      url.searchParams.append("authorId", params.authorId)
    }

    if (params?.type) {
      url.searchParams.append("type", params.type)
    }

    return url.href
  }

  const { isLoading, data, refetch } = useQuery({
    queryKey: ["clinical-notes", params],
    queryFn: async () => {
      const url = buildUrl()
      const request = await fetch(url)
      return request.json()
    },
    enabled: !params?.skip,
  })

  return {
    isLoading,
    clinicalNotes: data?.clinicalNotes,
    refetch,
  }
}

export function useCreateClinicalNote() {
  const queryClient = useQueryClient()
  
  const {
    mutate: createClinicalNote,
    isPending: isLoading,
    data,
    isSuccess,
    reset,
  } = useMutation({
    mutationFn: async (input: ClinicalNoteInput) => {
      const request = await fetch(`/api/clinical-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      })
      return request.json()
    },
    onMutate: async (newNote) => {
      if (!newNote) return

      await queryClient.cancelQueries({ queryKey: ["clinical-notes"] })
      const previousNotes = queryClient.getQueryData(["clinical-notes"])
      const newNoteWithId: any = { 
        ...newNote,
        id: Math.random().toString(36),
        isSigned: false,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData(
        ["clinical-notes"],
        (old: { clinicalNotes: ClinicalNote[] } | undefined) => ({
          clinicalNotes: old?.clinicalNotes ? [newNoteWithId, ...old.clinicalNotes] : [newNoteWithId],
        })
      )

      return { previousNotes }
    },
    onError: (err, newNote, context: any) => {
      console.log(err)
      queryClient.setQueryData(["clinical-notes"], context?.previousNotes)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-notes"] })
    },
  })

  return {
    createClinicalNote,
    isSuccess,
    data,
    isLoading,
    reset,
  }
}