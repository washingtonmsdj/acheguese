const KM_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const MIN_DISTANCE_KM = 0.1;
const MIN_ETA_MINUTES = 2;
const DEFAULT_URBAN_SPEED_KMH = 24;

export interface GastronomyProximityInfo {
  distanceKm: number;
  distanceLabel: string;
  etaMinutes: number;
  etaLabel: string;
  summaryLabel: string;
}

/**
 * SSOT de exibicao de proximidade para cards de gastronomia.
 * Converte distancia real (metros) em km + tempo estimado (min).
 */
export function resolveGastronomyProximity(
  distanceMeters?: number,
): GastronomyProximityInfo | null {
  if (
    typeof distanceMeters !== 'number' ||
    !Number.isFinite(distanceMeters) ||
    distanceMeters < 0
  ) {
    return null;
  }

  const distanceKm = Math.max(distanceMeters / 1000, MIN_DISTANCE_KM);
  const etaMinutes = Math.max(
    MIN_ETA_MINUTES,
    Math.round((distanceKm / DEFAULT_URBAN_SPEED_KMH) * 60),
  );

  const distanceLabel = `${KM_FORMATTER.format(distanceKm)} km`;
  const etaLabel = `${etaMinutes} min`;

  return {
    distanceKm,
    distanceLabel,
    etaMinutes,
    etaLabel,
    summaryLabel: `${distanceLabel} - ${etaLabel}`,
  };
}
