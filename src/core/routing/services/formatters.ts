/**
 * Routing Formatters - Utilitários de formatação
 * 
 * Funções para formatar distâncias e durações de forma consistente.
 * 
 * @module core/routing/services/formatters
 */

/**
 * Formata distância em metros para texto legível
 * 
 * @param meters Distância em metros
 * @returns Texto formatado (ex: "1.5 km", "250 m")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/**
 * Formata duração em segundos para texto legível
 * 
 * @param seconds Duração em segundos
 * @returns Texto formatado (ex: "1h 30min", "45 min", "30s")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}

/**
 * Formata velocidade em m/s para km/h
 * 
 * @param metersPerSecond Velocidade em m/s
 * @returns Velocidade em km/h
 */
export function formatSpeed(metersPerSecond: number): number {
  return Math.round(metersPerSecond * 3.6);
}

/**
 * Calcula velocidade média
 * 
 * @param distanceMeters Distância em metros
 * @param durationSeconds Duração em segundos
 * @returns Velocidade média em km/h
 */
export function calculateAverageSpeed(
  distanceMeters: number,
  durationSeconds: number
): number {
  if (durationSeconds === 0) return 0;
  const metersPerSecond = distanceMeters / durationSeconds;
  return formatSpeed(metersPerSecond);
}
