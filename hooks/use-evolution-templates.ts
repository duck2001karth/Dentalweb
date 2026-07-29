import { useState, useCallback } from "react";
import { EvolutionTemplate } from "@/types/treatments";
import { useToast } from "@/hooks/use-toast";

export function useEvolutionTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EvolutionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/evolution-templates");
      if (!res.ok) throw new Error("Error al obtener plantillas");
      const data: EvolutionTemplate[] = await res.json();
      setTemplates(data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las plantillas de evolución.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createTemplate = async (name: string, text: string, category: string = "General") => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/evolution-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, text, category }),
      });

      if (!res.ok) throw new Error("Error al guardar la plantilla");

      const newTpl: EvolutionTemplate = await res.json();
      setTemplates((prev) => [...prev, newTpl]);
      
      toast({
        title: "Plantilla creada",
        description: `Se guardó correctamente "${name}".`,
        variant: "success",
      });
      return newTpl;
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo guardar la plantilla clínica.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    templates,
    isLoading,
    isSaving,
    fetchTemplates,
    createTemplate,
  };
}