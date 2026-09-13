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

  async getActiveRide(userId: string): Promise<RideRequest | null> {
    return getActiveRide(userId);
  }
}

export const rideService = new RideService();