export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT"

export interface Agreement {
  id: string
  name: string
  institutionName: string
  contactPerson?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  discountType: DiscountType
  discountValue: number | string
  isActive: boolean
  startDate: string | Date
  endDate?: string | Date | null
  notes?: string | null
  _count?: {
    treatmentPlans?: number
    patients?: number
  }
  createdAt: string | Date
  updatedAt: string | Date
}

export interface AgreementFormData {
  name: string
  institutionName: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  discountType: DiscountType
  discountValue: string | number
  isActive?: boolean
  startDate?: string
  endDate?: string
  notes?: string
}