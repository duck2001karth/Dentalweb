// types/laboratory.ts

export interface LaboratoryRecord {
  id: string;
  name: string;
  details?: string | null;
  balance: number;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface LaboratoryFormData {
  name: string;
  details?: string;
  balance: number | string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export type UpdateLaboratoryData = Partial<LaboratoryFormData> & {
  id: string;
};