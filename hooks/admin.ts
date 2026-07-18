// hooks/use-admin.ts
"use client";

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Payment, InventoryItem, ClinicSettings, AuditLog, SystemLog } from '@/types/admin';

export function useAdmin() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================
  // INVENTARIO
  // ==========================================
  const fetchInventory = useCallback(async (): Promise<InventoryItem[]> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/inventory');
      if (!res.ok) throw new Error('Error al obtener inventario');
      return await res.json();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar el inventario", variant: "destructive" });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ==========================================
  // PAGOS / FACTURACIÓN
  // ==========================================
  const fetchPayments = useCallback(async (): Promise<Payment[]> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/payments');
      if (!res.ok) throw new Error('Error al obtener pagos');
      return await res.json();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar la facturación", variant: "destructive" });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ==========================================
  // CONFIGURACIÓN GENERAL
  // ==========================================
  const fetchSettings = useCallback(async (): Promise<ClinicSettings | null> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Error al obtener configuración');
      return await res.json();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar la configuración", variant: "destructive" });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateSettings = async (data: Partial<ClinicSettings>) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Error al actualizar');
      toast({ title: "Éxito", description: "Configuración guardada", variant: "success" });
      return await res.json();
    } catch (error) {
      toast({ title: "Error", description: "No se guardó la configuración", variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // AUDITORÍA Y LOGS
  // ==========================================
  const fetchAuditLogs = useCallback(async (): Promise<AuditLog[]> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/audit');
      if (!res.ok) throw new Error('Error al obtener auditoría');
      return await res.json();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar la auditoría", variant: "destructive" });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchSystemLogs = useCallback(async (): Promise<SystemLog[]> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/system-logs');
      if (!res.ok) throw new Error('Error al obtener logs del sistema');
      return await res.json();
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los logs", variant: "destructive" });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    fetchInventory,
    fetchPayments,
    fetchSettings,
    updateSettings,
    fetchAuditLogs,
    fetchSystemLogs
  };
}