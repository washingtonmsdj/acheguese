/**
 * Legacy compatibility facade.
 * Canonical implementation moved to ./services/LocationHistoryService.
 */

export {
  locationService,
  LocationService,
} from './services/LocationHistoryService';

export type {
  LocationHistory,
  UserResidence,
  ServiceArea,
  ProfileLocation,
} from './services/LocationHistoryService';