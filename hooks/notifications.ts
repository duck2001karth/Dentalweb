import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function useNotifications() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications")
      if (!res.ok) throw new Error("Error fetching notifications")
      return res.json()
    },
    refetchInterval: 1000 * 60 * 2 
  })

  const { mutate: markAsRead } = useMutation({
    mutationFn: async (ids: string[]) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    }
  })

  return { notifications, isLoading, markAsRead }
}