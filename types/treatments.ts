// types/treatments.ts

// --- INTERFAZ PARA PRESTACIONES/ÍTEMS INDIVIDUALES DEL PLAN ---
export interface TreatmentItem {
  id: string;
  treatmentPlanId: string;
  procedureName: string;
  cost: number;
  tooth?: string | null;
  surfaces?: string[];
  isCompleted: boolean;
  progress?: number;         // Porcentaje de avance (0, 25, 50, 75, 100)
  discount?: number;        // Descuento individual por ítem (%)
  paidAmount?: number;      // Monto abonado a esta prestación
  isPaid?: boolean;         // Estado de pago completo
  evolutionNote?: string | null;
  isPrivate?: boolean;
  fileUrl?: string | null;
  hasIncident?: boolean;
  hasAdverseEvent?: boolean;
  performedById?: string | null;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// --- INTERFAZ PARA PLANTILLAS DE EVOLUCIÓN CLÍNICA ---
export interface EvolutionTemplate {
  id: string;
  name: string;
  text: string;
  category?: string;
  createdAt?: string | Date;
}

// --- INTERFAZ PRINCIPAL DEL PLAN DE TRATAMIENTO ---
export interface TreatmentPlan {
  id: string;
  patientId: string;
  doctorId?: string;
  doctor?: { 
    id?: string;
    name: string; 
    specialty?: string 
  };
  name: string;
  status: string; 
  totalCost: number;
  totalPaid: number;
  progress?: number;
  collaborators?: string;
  commentsToPatient?: string; 
  lastAppointment?: string;
  items?: TreatmentItem[];  // Lista de prestaciones asociadas
  createdAt: string | Date;
  updatedAt: string | Date;
}

// --- PARÁMETROS DE BÚSQUEDA Y FILTRADO ---
export interface UseGetTreatmentsParams {
  patientId?: string;
  status?: string;
  search?: string;
  skip?: boolean;
}

// --- ENTRADAS DE CREACIÓN Y ACTUALIZACIÓN ---
export interface TreatmentPlanInput {
  patientId: string;
  doctorId?: string;
  name: string;
  status?: string;
  totalCost?: number;
  totalPaid?: number;
}

export type UpdateTreatmentInput = Partial<TreatmentPlanInput> & { 
  progress?: number;
  commentsToPatient?: string; 
  collaborators?: string;
};

// --- ENTRADA COMPLETA PARA REGISTRAR EVOLUCIÓN CLÍNICA ---
export interface EvolutionInput {
  progress: number;
  note?: string;
  isPrivate?: boolean;
  hasIncident?: boolean;
  hasAdverseEvent?: boolean;
  doctorId?: string;
  fileUrl?: string;
}