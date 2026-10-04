/**
 * Convierte una hora en formato "HH:mm" a minutos totales desde la medianoche.
 * Centralizado para evitar duplicidad de lógica en componentes de agenda.
 * import { timeToMinutes } from "@/lib/date-utils"
 */
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}