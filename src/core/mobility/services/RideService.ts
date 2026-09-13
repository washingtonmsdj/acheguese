/**
 * RideService - canonical ride service.
 *
 * Thin domain facade over the canonical mobility read boundaries.
 */

import {
  getRidesByPassenger,
  getRidesByDriverProfile,
  getActiveRide,
  type DriverRideListItem,
} from './mobility.queries';
import type { RideRequest } from '../types/types';
export type { RideRequest } from '../types/types';
export type { DriverRideListItem } from './mobility.queries';

export class RideService {
  async getRidesByPassenger(passengerId: string): Promise<RideRequest[]> {
    return getRidesByPassenger(passengerId);
  }

  async getRidesByDriver(
    driverProfileId: string,
  ): Promise<DriverRideListItem[]> {
    return getRidesByDriverProfile(driverProfileId);
  }

  async getActiveRide(userId: string): Promise<RideRequest | null> {
    return getActiveRide(userId);
  }
}

export const rideService = new RideService();