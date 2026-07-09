// types/treatments.ts

export interface TreatmentPlan {
  id: string;
  patientId: string;
  doctorId?: string;
  doctor?: { name: string; specialty?: string };
  name: string;
  status: string; 
  totalCost: number;
  totalPaid: number;
  progress?: number;
  collaborators?: string;
  commentsToPatient?: string; 
  lastAppointment?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface UseGetTreatmentsParams {
  patientId?: string;
  status?: string;
  search?: string;
  skip?: boolean;
}

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
};