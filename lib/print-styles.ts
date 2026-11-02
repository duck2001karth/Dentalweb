
/**
 * DENTALWEB - ESTILOS CENTRALES DE IMPRESIÓN
 *
 * CSS confiable definido por el desarrollador.
 * No insertar aquí valores procedentes de pacientes,
 * formularios ni configuraciones no validadas.
 */

export const PRINT_SHARED_STYLES = String.raw`
:root {
  --print-primary: #008bcd;
  --print-ink: #0f172a;
  --print-muted: #64748b;
  --print-border: #e2e8f0;
}

/* TARJETA DE PACIENTE */
.print-patient-card {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  border: 1px solid var(--print-border);
  border-radius: 10px;
  margin-bottom: 16px;
  background: #f8fafc;
  break-inside: avoid;
  page-break-inside: avoid;
  overflow: hidden;
}

.print-patient-col {
  padding: 10px 14px;
  min-width: 0;
}

.print-patient-col:first-child {
  border-right: 1px solid var(--print-border);
}

.print-patient-label {
  font-size: 8.5px;
  font-weight: 800;
  color: var(--print-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.print-patient-title {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--print-ink);
  margin-top: 2px;
  overflow-wrap: anywhere;
}

.print-patient-meta {
  font-size: 10.5px;
  color: #334155;
  margin-top: 3px;
  overflow-wrap: anywhere;
}

.print-patient-alert {
  display: inline-block;
  color: #be123c;
  font-weight: 700;
  font-size: 9.5px;
  margin-top: 5px;
  background: #ffe4e6;
  border: 1px solid #fecdd3;
  padding: 2px 7px;
  border-radius: 6px;
  overflow-wrap: anywhere;
}

/* TÍTULOS DE SECCIONES */
.print-section-heading {
  font-size: 11px;
  font-weight: 900;
  color: var(--print-primary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--print-border);
  padding-bottom: 4px;
  break-after: avoid;
}

/* TARJETAS DE REGISTROS CLÍNICOS */
.print-entry {
  background: #fff;
  border: 1px solid var(--print-border);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 12px;
  break-inside: avoid;
  page-break-inside: avoid;
}

.print-entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px dashed #f1f5f9;
  margin-bottom: 8px;
  padding-bottom: 6px;
}

.print-entry-content {
  font-size: 11px;
  color: #334155;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media print {
  .print-patient-card,
  .print-entry {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`
