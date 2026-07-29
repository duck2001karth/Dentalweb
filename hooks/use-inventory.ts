
"use client";

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { InventoryItem, InventoryFormData } from '@/types/inventory';

export function useInventory() {
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) setItems(await res.json());
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar el inventario.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createItem = async (data: InventoryFormData) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        stock: Number(data.stock) || 0,
        minStock: Number(data.minStock) || 0,
        unitCost: Number(data.unitCost) || 0,
        fechaExpiracion: data.fechaExpiracion ? new Date(data.fechaExpiracion).toISOString() : null,
      };

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error();
      toast({ title: "Insumo registrado", variant: "success" });
      await fetchItems();
      return true;
    } catch (error) {
      toast({ title: "Error al registrar", variant: "destructive" });
      return false;
    } finally { setIsSaving(false); }
  };

  const updateItem = async (id: string, data: Partial<InventoryFormData>) => {
    setIsSaving(true);
    try {
      const payload = { ...data };
      if (payload.stock !== undefined) payload.stock = Number(payload.stock);
      if (payload.minStock !== undefined) payload.minStock = Number(payload.minStock);
      if (payload.fechaExpiracion !== undefined) payload.fechaExpiracion = payload.fechaExpiracion ? new Date(payload.fechaExpiracion).toISOString() : undefined;

      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload })
      });
      
      if (!res.ok) throw new Error();
      toast({ title: "Insumo actualizado", variant: "success" });
      await fetchItems();
      return true;
    } catch (error) {
      toast({ title: "Error al actualizar", variant: "destructive" });
      return false;
    } finally { setIsSaving(false); }
  };

  return { items, isLoading, isSaving, fetchItems, createItem, updateItem };
}