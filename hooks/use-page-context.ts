import { usePathname } from "next/navigation";

// Definimos las entidades principales que manejará tu clínica
type ClinicalEntity = "paciente" | "agenda" | "admin" | "configuracion" | "soporte" | null;

type PageContext = {
  entity: ClinicalEntity; 
  id: string | null;      
  subModule: string | null; 
};

export function usePageContext(): PageContext {
  const pathname = usePathname();

  // Dividimos la ruta y eliminamos espacios vacíos.
  const pathSegments = pathname.split("/").filter(Boolean);

  if (pathSegments.length === 0) {
    return { entity: null, id: null, subModule: null };
  }

  const root = pathSegments[0]; 

  // 1. LÓGICA PARA RUTAS DE PACIENTES 
  if (root === "paciente" || root === "pacientes") {
    return {
      entity: "paciente",
      id: pathSegments[1] || null, 
      subModule: pathSegments[2] || null,
    };
  }

  // 2. LÓGICA PARA EL PANEL DE ADMINISTRACIÓN 
  if (root === "admin") {
    const section = pathSegments[1] as ClinicalEntity;
    
    return {
      entity: "admin",
      id: null, 
      subModule: pathSegments[2] || section || "dashboard",
    };
  }

  // 3. LÓGICA PARA LA AGENDA
  if (root === "agenda" || root === "agenda-global") {
    return {
      entity: "agenda",
      id: pathSegments[1] || null, 
      subModule: null,
    };
  }
  return { entity: null, id: null, subModule: null };
}