/**
 * Query Keys Centralizadas - Mobilidade
 * 
 * SSOT para React Query keys
 * Facilita invalidação e gerenciamento de cache
 */

export const MOBILITY_QUERY_KEYS = {
  // Rides
  rides: (userId?: string) => ["rides", userId] as const,
  ride: (rideId: string) => ["ride", rideId] as const,
  rideHistory: (userId: string) => ["ride-history", userId] as const,
  activeRides: (userId: string) => ["active-rides", userId] as const,
  
  // Deliveries (motoboy)
  deliveries: (sourceType: string, sourceId: string) => ["deliveries", sourceType, sourceId] as const,
  delivery: (deliveryId: string) => ["delivery", deliveryId] as const,
  
  // Reports
  rideReports: (userId: string) => ["ride-reports", "user", userId] as const,
  rideReportsByRide: (rideId: string) => ["ride-reports", "ride", rideId] as const,
  rideReportsStats: () => ["ride-reports", "stats"] as const,
  
  // Admin
  adminReports: (filters?: any) => ["admin-ride-reports", filters] as const,
  adminReportsStats: () => ["admin-ride-reports-stats"] as const,
  adminMotoboyOperations: (filters?: any) => ["admin-motoboy-operations", filters] as const,
  
  // Driver
  driverRides: (driverProfileId: string) => ["driver-rides", driverProfileId] as const,
  driverAvailability: (driverProfileId: string) => ["driver-availability", driverProfileId] as const,
  
  // Ratings
  rideRating: (rideId: string) => ["ride-rating", rideId] as const,
  driverRatings: (driverProfileId: string) => ["driver-ratings", driverProfileId] as const,
  
  // Locations
  locations: () => ["locations"] as const,
  location: (locationId: string) => ["location", locationId] as const,
  
  // Rollout
  rollout: (locationId: string) => ["rollout", locationId] as const,
  motoboyEnabled: (locationId: string) => ["motoboy-enabled", locationId] as const,
} as const;

/**
 * Invalidar todas as queries relacionadas a rides
 */
export function invalidateRideQueries(queryClient: any, userId?: string) {
  if (userId) {
    queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.rides(userId) });
    queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.rideHistory(userId) });
    queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.activeRides(userId) });
  } else {
    queryClient.invalidateQueries({ queryKey: ["rides"] });
    queryClient.invalidateQueries({ queryKey: ["ride-history"] });
    queryClient.invalidateQueries({ queryKey: ["active-rides"] });
  }
}

/**
 * Invalidar todas as queries relacionadas a deliveries
 */
export function invalidateDeliveryQueries(queryClient: any, sourceType?: string, sourceId?: string) {
  if (sourceType && sourceId) {
    queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.deliveries(sourceType, sourceId) });
  } else {
    queryClient.invalidateQueries({ queryKey: ["deliveries"] });
  }
}

/**
 * Invalidar todas as queries relacionadas a reports
 */
export function invalidateReportQueries(queryClient: any, userId?: string) {
  if (userId) {
    queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.rideReports(userId) });
  }
  queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.rideReportsStats() });
  queryClient.invalidateQueries({ queryKey: ["admin-ride-reports"] });
}
