/**
 * RideService - public API
 *
 * Re-export canonical implementation from RideService.impl.
 */

export { RideService, rideService } from './RideService.impl';
export type {
  RideRequest,
  CreateRideData,
} from './RideService.impl';

