/**
 * Utilidad para prevenir ataques XSS (Cross-Site Scripting).
 * Convierte caracteres especiales en entidades HTML seguras.
 * Visualmente no altera el texto impreso, pero evita ejecución de código.
 */
export const escapeHTML = (str?: string | number | null): string => {
  if (str === null || str === undefined) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}