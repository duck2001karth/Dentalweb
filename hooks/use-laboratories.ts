import { useState, useCallback, useEffect } from "react";
import { LaboratoryRecord, LaboratoryFormData, UpdateLaboratoryData } from "@/types/laboratory";
import { useToast } from "@/hooks/use-toast";

export function useLaboratories() {
  const { toast } = useToast();
  const [laboratories, setLaboratories] = useState<LaboratoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Obtener la lista de laboratorios
  const fetchLaboratories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/laboratories");
      if (!res.ok) throw new Error("Error al obtener los laboratorios");
      const data: LaboratoryRecord[] = await res.json();
      setLaboratories(data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los laboratorios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLaboratories();
  }, [fetchLaboratories]);

  // Crear laboratorio
  const createLaboratory = async (input: LaboratoryFormData) => {
    setIsSaving(true);
    try {
      const payload = {
        ...input,
        balance: Number(input.balance) || 0,
      };

      const res = await fetch("/api/laboratories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al crear laboratorio");

      const newLab: LaboratoryRecord = await res.json();
      setLaboratories((prev) => [...prev, newLab]);

      toast({
        title: "Laboratorio creado",
        description: `Se registró correctamente el laboratorio ${newLab.name}.`,
        variant: "success",
      });
      return newLab;
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo registrar el laboratorio.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Actualizar laboratorio
  const updateLaboratory = async (input: UpdateLaboratoryData) => {
    setIsSaving(true);
    try {
      const payload = {
        ...input,
        ...(input.balance !== undefined && { balance: Number(input.balance) || 0 }),
      };

      const res = await fetch("/api/laboratories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al actualizar laboratorio");

      const updatedLab: LaboratoryRecord = await res.json();
      setLaboratories((prev) =>
        prev.map((lab) => (lab.id === updatedLab.id ? updatedLab : lab))
      );

      toast({
        title: "Laboratorio actualizado",
        description: `Se guardaron los cambios de ${updatedLab.name}.`,
        variant: "success",
      });
      return updatedLab;
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    laboratories,
    isLoading,
    isSaving,
    fetchLaboratories,
    createLaboratory,
    updateLaboratory,
  };
}