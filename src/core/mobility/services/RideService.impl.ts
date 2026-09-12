/**
 * RideService - canonical implementation
 *
 * SSOT owner for ride lifecycle operations in mobility module.
 */

import {
  getRidesByPassenger,
  getRidesByDriverProfile,
  getActiveRide,
} from './mobility.queries';
import type { RideRequest } from '../types/types';
export type { RideRequest } from '../types/types';

export class RideService {
  async getRidesByPassenger(passengerId: string): Promise<RideRequest[]> {
    return getRidesByPassenger(passengerId);
  }

  async getRidesByDriver(driverProfileId: string): Promise<RideRequest[]> {
    const rides = await getRidesByDriverProfile(driverProfileId);
    return rides as RideRequest[];
  }

  async getActiveRide(userId: string): Promise<RideRequest | null> {
    return getActiveRide(userId);
  }

  async shareRide(rideId: string, _shareData: { message?: string; contacts?: string[] }): Promise<void> {
    // Future implementation: sharing via notification/SMS.
  }

}

export const rideService = new RideService();
