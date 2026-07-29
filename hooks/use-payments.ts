"use client";

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { PaymentRecord, PaymentFormData } from '@/types/billing';

export function usePayments() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payments');
      if (res.ok) setPayments(await res.json());
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los pagos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createPayment = async (data: PaymentFormData, processedById?: string) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, processedById })
      });
      if (!res.ok) throw new Error();
      toast({ title: "Pago Registrado", variant: "success" });
      await fetchPayments();
      return true;
    } catch (error) {
      toast({ title: "Error de Registro", variant: "destructive" });
      return false;
    } finally { setIsSaving(false); }
  };

  const updatePayment = async (id: string, data: Partial<PaymentFormData>) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      });
      if (!res.ok) throw new Error();
      toast({ title: "Pago Actualizado", variant: "success" });
      await fetchPayments();
      return true;
    } catch (error) {
      toast({ title: "Error al actualizar", variant: "destructive" });
      return false;
    } finally { setIsSaving(false); }
  };

  const deletePayment = async (id: string) => {
    try {
      const res = await fetch(`/api/payments?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: "Registro eliminado", variant: "success" });
      await fetchPayments();
      return true;
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" });
      return false;
    }
  };

  return { payments, isLoading, isSaving, fetchPayments, createPayment, updatePayment, deletePayment };
}