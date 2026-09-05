// types/treatments.ts

// --- INTERFAZ PARA PRESTACIONES/ÍTEMS INDIVIDUALES DEL PLAN ---
export interface TreatmentItem {
  id: string;
  treatmentPlanId?: string;
  procedureName?: string;
  name?: string;               
  cost: number;
  price?: number;             
  tooth?: string | null;
  toothNumber?: string | null; 
  region?: string | null;      
  surfaces?: string[];
  isCompleted: boolean;
  progress?: number;           
  discount?: number;           
  paidAmount?: number;         
  isPaid?: boolean;            
  evolutionNote?: string | null;
  isPrivate?: boolean;
  fileUrl?: string | null;
  hasIncident?: boolean;
  hasAdverseEvent?: boolean;
  performedById?: string | null;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// --- INTERFAZ PARA PLANTILLAS DE PROTOCOLO CLÍNICO ---
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
    specialty?: string;
  };
  name: string;
  status: string; 
  totalCost: number;
  totalPaid: number;
  progress?: number;
  discount?: number;                          
  agreementId?: string | null;                
  convenio?: string | null;
  collaborators?: string | string[];          
  commentsToPatient?: string; 
  signatureBase64?: string | null;            
  lastAppointment?: string;
  items?: TreatmentItem[];                   
  payments?: any[];                           
  createdAt: string | Date;
  updatedAt: string | Date;
}


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
  discount?: number;
  agreementId?: string | null;
}

export type UpdateTreatmentInput = Partial<TreatmentPlanInput> & { 
  progress?: number;
  commentsToPatient?: string; 
  collaborators?: string | string[];
  signatureBase64?: string | null;
};

// --- ENTRADA PARA REGISTRAR EVOLUCIÓN CLÍNICA ---
export interface EvolutionInput {
  progress: number;
  note?: string;
  isPrivate?: boolean;
  hasIncident?: boolean;
  hasAdverseEvent?: boolean;
  doctorId?: string;
  fileUrl?: string;
}