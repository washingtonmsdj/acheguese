/**
 * Canonical defensive/query bounds for public read models.
 *
 * These are platform limits rather than domain business rules. Keeping them in
 * one config prevents Map, Nearby and provider-specific readers from drifting.
 */
export const PUBLIC_READ_LIMITS = {
  MAP_DEFAULT: 100,
  MAP_MAX: 200,
  SPATIAL_RPC_MAX: 200,
  BUSINESS_SPATIAL_CANDIDATE_MULTIPLIER: 4,
} as const;
