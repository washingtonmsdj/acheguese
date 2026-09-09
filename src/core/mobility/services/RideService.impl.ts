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
import { createRide } from './mobility.mutations';
import { TRUST_ACTOR_ROLES, TrustPolicyReadService } from '@/core/trust';
import { RIDE_STATUS } from '../constants';
import type { RideRequest } from '../types/types';
export type { RideRequest } from '../types/types';

export interface CreateRideData {
  pickup_location: string;
  dropoff_location: string;
  [key: string]: unknown;
}

export class RideService {
  async createRide(data: CreateRideData & { passenger_profile_id: string }): Promise<RideRequest> {
    const trustGate = await TrustPolicyReadService.canCurrentReceiveOperationalCall(
      TRUST_ACTOR_ROLES.CUSTOMER,
    );
    if (!trustGate.allowed) {
      throw new Error(trustGate.reason || "Cliente bloqueado para novos chamados ate revisao admin.");
    }

    const ride = await createRide({ ...data, status: RIDE_STATUS.PENDING });
    return ride as RideRequest;
  }

  async getRidesByPassenger(passengerId: string): Promise<RideRequest[]> {
    const rides = await getRidesByPassenger(passengerId);
    return rides as RideRequest[];
  }

  async getRidesByDriver(driverProfileId: string): Promise<RideRequest[]> {
    const rides = await getRidesByDriverProfile(driverProfileId);
    return rides as RideRequest[];
  }

  async getActiveRide(userId: string): Promise<RideRequest | null> {
    const ride = await getActiveRide(userId);
    return (ride as RideRequest | null) ?? null;
  }

  async shareRide(rideId: string, _shareData: { message?: string; contacts?: string[] }): Promise<void> {
    // Future implementation: sharing via notification/SMS.
  }

}

export const rideService = new RideService();
