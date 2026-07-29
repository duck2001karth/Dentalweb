
export interface InventoryItem {
  id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  registroSanitario?: string | null;
  marca?: string | null;
  concentracion?: string | null;
  unidadMedida?: string | null;
  presentacion?: string | null;
  lote?: string | null;
  fechaExpiracion?: string | null; 
  stock: number;
  minStock: number;
  unitCost: number;
  supplier?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface InventoryFormData {
  name: string;
  sku?: string;
  category?: string;
  registroSanitario?: string;
  marca?: string;
  concentracion?: string;
  unidadMedida?: string;
  presentacion?: string;
  lote?: string;
  fechaExpiracion?: string;
  stock: number | string;
  minStock: number | string;
  unitCost: number | string;
  supplier?: string;
}