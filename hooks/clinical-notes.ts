import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export interface ClinicalNote {
  id: string
  type: "EVOLUTION" | "PRESCRIPTION" | "GENERAL"
  content: string
  patientId: string
  authorId: string
  isSigned: boolean
  createdAt: string
  updatedAt: string
  status: string
}

export type ClinicalNoteInput = Omit<ClinicalNote, "id" | "isSigned" | "createdAt" | "updatedAt">
export type UpdateClinicalNoteInput = Partial<ClinicalNoteInput> & { isSigned?: boolean }

type NotesResponse = { clinicalNotes: ClinicalNote[] }
type NoteQueryParams = { patientId?: string; authorId?: string; type?: string; skip?: boolean }

export function useGetClinicalNotes(params?: NoteQueryParams) {
  const buildUrl = () => {
    const url = new URL("/api/clinical-notes", typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")
    if (params?.patientId) url.searchParams.append("patientId", params.patientId)
    if (params?.authorId) url.searchParams.append("authorId", params.authorId)
    if (params?.type) url.searchParams.append("type", params.type)
    return url.href
  }

  const { isLoading, data, refetch } = useQuery<NotesResponse>({
    queryKey: ["clinical-notes", params],
    queryFn: async () => {
      const request = await fetch(buildUrl())
      return request.json() as Promise<NotesResponse>
    },
    enabled: !params?.skip,
  })

  return { isLoading, clinicalNotes: data?.clinicalNotes, refetch }
}

export function useCreateClinicalNote() {
  const queryClient = useQueryClient()
  const { mutate: createClinicalNote, isPending: isLoading, data, isSuccess, reset } = useMutation({
    mutationFn: async (input: ClinicalNoteInput) => {
      const request = await fetch("/api/clinical-notes", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }),
      })
      return request.json()
    },
    onMutate: async (newNote) => {
      if (!newNote) return
      await queryClient.cancelQueries({ queryKey: ["clinical-notes"] })
      const previousNotes = queryClient.getQueryData<NotesResponse>(["clinical-notes"])
      const newNoteWithId: ClinicalNote = {
        ...newNote, id: Math.random().toString(36), isSigned: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      queryClient.setQueryData<NotesResponse>(["clinical-notes"], (old) => ({
        clinicalNotes: old?.clinicalNotes ? [newNoteWithId, ...old.clinicalNotes] : [newNoteWithId],
      }))
      return { previousNotes }
    },
    onError: (err, _newNote, context) => {
      console.log(err)
      queryClient.setQueryData(["clinical-notes"], context?.previousNotes)
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["clinical-notes"] }) },
  })
  return { createClinicalNote, isSuccess, data, isLoading, reset }
}
