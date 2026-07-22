/**
 * Core Routing Services - Barrel exports
 * 
 * @module core/routing/services
 */

export { RoutingService, createRoutingService } from './RoutingService';
export { formatDistance, formatDuration } from './formatters';
export { TerritoryCommunityRouteService } from "./TerritoryCommunityRouteService";
export {
  registerCommunityInterest,
  type CommunityInterestRole,
  type RegisterCommunityInterestInput,
  type RegisterCommunityInterestResult,
} from "./CommunityInterestRegistrationService";
