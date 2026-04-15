/**
 * createCirclePolygon
 * 
 * Cria um polígono circular ao redor de um ponto central.
 * Útil como fallback quando não há polígono real disponível.
 * 
 * @param center - [latitude, longitude] do centro
 * @param radiusMeters - Raio do círculo em metros
 * @param points - Número de pontos do polígono (padrão: 32)
 * @returns Array de coordenadas [lat, lng][]
 */
export function createCirclePolygon(
  center: [number, number],
  radiusMeters: number,
  points: number = 32,
): [number, number][] {
  const [lat, lng] = center;
  const coordinates: [number, number][] = [];

  // Conversão aproximada de metros para graus
  // 1 grau de latitude ≈ 111km
  // 1 grau de longitude varia com a latitude
  const latDegreePerMeter = 1 / 111000;
  const lngDegreePerMeter = 1 / (111000 * Math.cos((lat * Math.PI) / 180));

  const radiusLat = radiusMeters * latDegreePerMeter;
  const radiusLng = radiusMeters * lngDegreePerMeter;

  // Gera pontos ao redor do círculo
  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const pointLat = lat + radiusLat * Math.sin(angle);
    const pointLng = lng + radiusLng * Math.cos(angle);
    coordinates.push([pointLat, pointLng]);
  }

  return coordinates;
}

/**
 * Raios sugeridos para diferentes contextos:
 * - Bairro pequeno: 300-500m
 * - Bairro médio: 500-800m
 * - Bairro grande: 800-1200m
 * - Distrito: 1500-3000m
 */
export const SUGGESTED_RADIUS = {
  small: 400,
  medium: 600,
  large: 1000,
  district: 2000,
} as const;
