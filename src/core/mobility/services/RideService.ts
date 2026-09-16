/**
 * RideService - canonical ride service.
 *
 * Thin domain facade over the canonical mobility read boundaries.
 */

import {
  getRidesByPassenger,
  getActiveRide,
} from './mobility.queries';
import type { RideRequest } from '../types/types';
export type { RideRequest } from '../types/types';

export class RideService {
  async getRidesByPassenger(passengerId: string): Promise<RideRequest[]> {
    return getRidesByPassenger(passengerId);
  }

  async getActiveRide(userProfileId: string): Promise<RideRequest | null> {
    return getActiveRide(userProfileId);
  }
}

export const rideService = new RideService();