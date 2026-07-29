export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'INSURANCE' | 'OTHER';
export type PaymentState = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentState;
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
  } | null;
}

export interface PaymentFormData {
  patientId: string;
  amount: number | string;
  method: PaymentMethod;
  status: PaymentState;
  receiptNumber: string;
  notes: string;
}