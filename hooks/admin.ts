"use client"
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import type { Payment, InventoryItem, ClinicSettings, AuditLog, SystemLog } from '@/types/admin'

export function useAdmin() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const fetchAdminData = async (endpoint: string) => {
    const res = await fetch(endpoint)
    if (!res.ok) throw new Error()
    return res.json()
  }

  const fetchInventory = async (): Promise<InventoryItem[]> => 
    queryClient.fetchQuery({ queryKey: ['admin-inventory'], queryFn: () => fetchAdminData('/api/admin/inventory') }).catch(() => { toast({ title: "Error", variant: "destructive" }); return [] })

  const fetchPayments = async (): Promise<Payment[]> => 
    queryClient.fetchQuery({ queryKey: ['admin-payments'], queryFn: () => fetchAdminData('/api/admin/payments') }).catch(() => { toast({ title: "Error", variant: "destructive" }); return [] })

  const fetchSettings = async (): Promise<ClinicSettings | null> => 
    queryClient.fetchQuery({ queryKey: ['admin-settings'], queryFn: () => fetchAdminData('/api/configuration') }).catch(() => { toast({ title: "Error", variant: "destructive" }); return null })

  const fetchAuditLogs = async (): Promise<AuditLog[]> => 
    queryClient.fetchQuery({ queryKey: ['admin-audit'], queryFn: () => fetchAdminData('/api/admin/audit') }).catch(() => { toast({ title: "Error", variant: "destructive" }); return [] })

  const fetchSystemLogs = async (): Promise<SystemLog[]> => 
    queryClient.fetchQuery({ queryKey: ['admin-system-logs'], queryFn: () => fetchAdminData('/api/admin/system-logs') }).catch(() => { toast({ title: "Error", variant: "destructive" }); return [] })

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<ClinicSettings>) => {
      const res = await fetch('/api/configuration', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => {
      toast({ title: "Éxito", description: "Configuración guardada", variant: "success" })
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
    },
    onError: () => {
      toast({ title: "Error", description: "No se guardó la configuración", variant: "destructive" })
    }
  })

  return {
    isLoading: updateSettingsMutation.isPending,
    fetchInventory,
    fetchPayments,
    fetchSettings,
    updateSettings: async (data: Partial<ClinicSettings>) => { await updateSettingsMutation.mutateAsync(data) },
    fetchAuditLogs,
    fetchSystemLogs
  }
}