export type ClinicalDocType = 
  | 'CONSENT' 
  | 'CERTIFICATE' 
  | 'PRESCRIPTION' 
  | 'REPORT' 
  | 'AUTHORIZATION' 
  | 'INSTRUCTIONS';

export interface DocumentTemplate {
  id: string;
  title: string;
  type: ClinicalDocType;
  category?: string | null;
  content: string;
  requiresPatientSignature: boolean;
  requiresDoctorSignature: boolean;
  isActive: boolean;
  isDefault: boolean;
  createdById?: string | null;
  createdBy?: {
    id: string;
    name: string | null;
    specialty?: string | null;
  } | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DocumentTemplateFormData {
  title: string;
  type: ClinicalDocType;
  category?: string;
  content: string;
  requiresPatientSignature: boolean;
  requiresDoctorSignature: boolean;
  isActive?: boolean;
  isDefault?: boolean;
}

// Variables disponibles para interpolación dinámica
export interface TemplatePlaceholder {
  tag: string;
  description: string;
  category: 'PACIENTE' | 'DOCTOR' | 'CLINICA' | 'FECHA';
}

export const TEMPLATE_PLACEHOLDERS: TemplatePlaceholder[] = [
  { tag: '{{paciente_nombre}}', description: 'Nombre y apellido del paciente', category: 'PACIENTE' },
  { tag: '{{paciente_ci}}', description: 'Cédula de identidad / Pasaporte', category: 'PACIENTE' },
  { tag: '{{paciente_edad}}', description: 'Edad calculada en años', category: 'PACIENTE' },
  { tag: '{{paciente_direccion}}', description: 'Dirección del paciente', category: 'PACIENTE' },
  { tag: '{{paciente_telefono}}', description: 'Teléfono o WhatsApp del paciente', category: 'PACIENTE' },
  
  { tag: '{{doctor_nombre}}', description: 'Nombre completo del profesional', category: 'DOCTOR' },
  { tag: '{{doctor_especialidad}}', description: 'Especialidad odontológica', category: 'DOCTOR' },
  
  { tag: '{{clinica_nombre}}', description: 'Nombre comercial de la clínica', category: 'CLINICA' },
  { tag: '{{clinica_ruc}}', description: 'RUC o NIT institucional', category: 'CLINICA' },
  { tag: '{{clinica_ciudad}}', description: 'Ciudad de atención', category: 'CLINICA' },
  { tag: '{{clinica_telefono}}', description: 'Teléfono de contacto de la clínica', category: 'CLINICA' },
  
  { tag: '{{fecha_actual}}', description: 'Fecha actual en formato texto largo', category: 'FECHA' },
  { tag: '{{hora_actual}}', description: 'Hora actual (HH:mm)', category: 'FECHA' },
];