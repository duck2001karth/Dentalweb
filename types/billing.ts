export type PaymentMethod = 
  | 'CASH' 
  | 'CREDIT_CARD' 
  | 'DEBIT_CARD' 
  | 'TRANSFER' 
  | 'CHECK' 
  | 'INSURANCE' 
  | 'OTHER';

export type PaymentState = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentState;
  reference?: string | null;      
  receiptImage?: string | null;   
  receiptNumber?: string | null;
  notes?: string | null;
  createdAt: string;

  patient: {
    id: string;
    firstName: string;
    lastName: string;
    ci: string;
  };
  processedBy?: {
    name: string | null;
    role?: string | null;
  } | null;
  treatmentPlan?: {
    id: string;
    name: string;
  } | null;
}

export interface PaymentFormData {
  patientId: string;
  amount: number | string;
  method: PaymentMethod;
  status: PaymentState;
  receiptNumber: string;
  notes: string;
  reference?: string;             
  receiptImage?: string | null;   
}