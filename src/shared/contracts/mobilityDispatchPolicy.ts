/**
 * Canonical mobility dispatch policy shared by browser/core and Edge runtime.
 * Keep this module runtime-neutral: no browser, Node, Deno, Supabase or app imports.
 */
export const MOBILITY_DISPATCH_POLICY = Object.freeze({
  exclusiveOffer: Object.freeze({
    enabled: true,
    offerTimeoutSeconds: 30,
    maxRetryAttempts: 5,
    maxOffersPerDriver: 1,
    searchRadiusKm: 10,
    totalTimeoutMinutes: 10,
    requiresVerification: true,
    requiresSubscription: true,
  }),
  openBoard: Object.freeze({
    enabled: true,
    maxOffersPerDriver: 10,
    offerExpirationMinutes: 30,
    maxRetryAttempts: 999,
    searchRadiusKm: 15,
    requiresVerification: true,
    requiresSubscription: true,
  }),
  reservationBoard: Object.freeze({
    enabled: true,
    offerTimeoutSeconds: 24 * 60 * 60,
    maxRetryAttempts: 999,
    maxOffersPerDriver: 999,
    searchRadiusKm: 50,
    minAdvanceHours: 2,
    maxAdvanceDays: 7,
    requiresVerification: true,
    requiresSubscription: true,
  }),
  scoring: Object.freeze({
    distanceWeight: 0.40,
    ratingWeight: 0.25,
    acceptanceRateWeight: 0.15,
    totalRidesWeight: 0.10,
    responseTimeWeight: 0.10,
  }),
});

export type MobilityDispatchPolicy = typeof MOBILITY_DISPATCH_POLICY;
