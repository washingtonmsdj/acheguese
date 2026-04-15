/**
 * Utilitários para cálculos geográficos
 */

/**
 * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
 * @param lat1 Latitude do ponto 1
 * @param lon1 Longitude do ponto 1
 * @param lat2 Latitude do ponto 2
 * @param lon2 Longitude do ponto 2
 * @returns Distância em metros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distância em metros
}

/**
 * Formata a distância em metros para uma string legível
 * @param meters Distância em metros
 * @returns String formatada (ex: "150m" ou "2.5km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
