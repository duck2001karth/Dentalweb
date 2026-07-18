export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'INSURANCE' | 'OTHER';
export type PaymentState = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentState;
  receiptNumber?: string | null;
  notes?: string | null;
  patientId: string;
  treatmentPlanId?: string | null;
  processedById?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string | null;
  category: string;
  stock: number;
  minStock: number;
  unitCost: number;
  supplier?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Liquidation {
  id: string;
  doctorId: string;
  amount: number;
  periodStart: string | Date;
  periodEnd: string | Date;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ClinicSettings {
  id: string;
  clinicName: string;
  taxRate: number;
  currency: string;
  logoUrl?: string | null;
  watermarkUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  footerText?: string | null;
  updatedAt: string | Date;
}

export interface AuditLog {
  id: string;
  action: string;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId: string;
  createdAt: string | Date;
  user?: {
    name: string | null;
    email: string | null;
  };
}

export interface SystemLog {
  id: string;
  level: LogLevel;
  message: string;
  metadata?: any;
  createdAt: string | Date;
}