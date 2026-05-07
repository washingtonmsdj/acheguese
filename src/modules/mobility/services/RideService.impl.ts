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
import {
  createRide,
  updateRide,
  createEmergencyAlert,
} from './mobility.mutations';
import { TRUST_ACTOR_ROLES, TrustEventService } from '@/core/trust';
import { RIDE_STATUS } from '../constants';

export interface RideRequest {
  id: string;
  passenger_profile_id: string;
  driver_profile_id?: string;
  status: string;
  pickup_location: string;
  dropoff_location: string;
  created_at: string;
  [key: string]: unknown;
}

export interface CreateRideData {
  pickup_location: string;
  dropoff_location: string;
  [key: string]: unknown;
}

export interface UpdateRideData {
  status?: string;
  driver_profile_id?: string;
  [key: string]: unknown;
}

interface CompleteRideData extends UpdateRideData {
  status: 'completed';
  actual_fare: number;
  distance_km: number;
  duration_minutes: number;
}

export class RideService {
  async createRide(data: CreateRideData & { passenger_profile_id: string }): Promise<RideRequest> {
    const trustGate = await TrustEventService.canReceiveOperationalCall(
      data.passenger_profile_id,
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

  async updateRide(id: string, data: UpdateRideData): Promise<RideRequest> {
    const ride = await updateRide(id, data as Record<string, unknown>);
    return ride as RideRequest;
  }

  async acceptRide(rideId: string, driverProfileId: string): Promise<RideRequest> {
    const trustGate = await TrustEventService.canReceiveOperationalCall(
      driverProfileId,
      TRUST_ACTOR_ROLES.DRIVER,
    );
    if (!trustGate.allowed) {
      throw new Error(trustGate.reason || "Motorista bloqueado para novos chamados ate revisao admin.");
    }

    return this.updateRide(rideId, { driver_profile_id: driverProfileId, status: 'accepted' });
  }

  async startRide(rideId: string): Promise<RideRequest> {
    return this.updateRide(rideId, { status: 'in_progress' });
  }

  async completeRide(rideId: string, actualFare: number, distanceKm: number, durationMinutes: number): Promise<RideRequest> {
    const completeData: CompleteRideData = {
      status: 'completed',
      actual_fare: actualFare,
      distance_km: distanceKm,
      duration_minutes: durationMinutes,
    };
    return this.updateRide(rideId, completeData);
  }

  async cancelRide(rideId: string): Promise<RideRequest> {
    return this.updateRide(rideId, { status: 'cancelled' });
  }

  async shareRide(rideId: string, _shareData: { message?: string; contacts?: string[] }): Promise<void> {
    // Future implementation: sharing via notification/SMS.
  }

  async createEmergencyAlert(rideId: string, userId: string, location: { lat: number; lng: number }): Promise<void> {
    await createEmergencyAlert(rideId, userId, location);
  }
}

export const rideService = new RideService();
