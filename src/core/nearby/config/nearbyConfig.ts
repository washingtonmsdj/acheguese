export const NEARBY_REFERENCE_STORAGE_KEY = "achegue-se:nearby-reference";

export const NEARBY_DEFAULT_RADIUS_KM = 1;
export const NEARBY_RADIUS_OPTIONS_KM = [0.5, 1, 3, 5, 10, 20] as const;
export const NEARBY_QUICK_RADIUS_OPTION_COUNT = 4;

export const NEARBY_QUERY_LIMIT = 100;
export const NEARBY_VISIBLE_RESULTS_LIMIT = 8;
export const NEARBY_DETAILS_STALE_TIME_MS = 5 * 60 * 1000;
export const NEARBY_MIN_ADDRESS_QUERY_LENGTH = 3;

export function isPreciseNearbyDistance(
  meters: number,
  showProximity: boolean,
): boolean {
  return showProximity && Number.isFinite(meters) && meters > 0;
}
