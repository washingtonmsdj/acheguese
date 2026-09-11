import { MobilityRpcService } from "./MobilityRpcService";

export interface FailedDeliveryHandoffCandidate {
  profileId: string;
  distanceKm: number;
  rating: number | null;
  riskLevel: string | null;
  dispatchPolicy: string | null;
}

export interface FailedDeliveryHandoffRequestResult {
  updated: true;
  rideId: string;
  targetDriverProfileId: string;
}

/**
 * Admin-side command surface for failed-delivery custody recovery.
 *
 * This service can select/request a receiver, but it never transfers custody.
 * The physical transfer remains exclusively receiver-confirmed through
 * FailedDeliveryHandoffService.accept().
 */
export class FailedDeliveryHandoffAdminService {
  static async listCandidates(
    rideId: string,
    limit = 25,
  ): Promise<FailedDeliveryHandoffCandidate[]> {
    const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 100));
    const data = await MobilityRpcService.findAvailableDriversForRide({
      rideId,
      radiusKm: 0.5,
      limit: safeLimit,
    });

    return data.drivers.map((driver) => ({
      profileId: driver.profile_id,
      distanceKm: driver.distance_km,
      rating: driver.rating,
      riskLevel: driver.risk_level,
      dispatchPolicy: driver.dispatch_policy,
    }));
  }

  static async request(
    rideId: string,
    targetDriverProfileId: string,
    notes: string,
  ): Promise<FailedDeliveryHandoffRequestResult> {
    const target = targetDriverProfileId.trim();
    const normalizedNotes = notes.trim();
    if (!target) throw new Error("Motoboy receptor e obrigatorio.");
    if (!normalizedNotes) throw new Error("Motivo operacional do handoff e obrigatorio.");

    const result = await MobilityRpcService.updateFailedDeliveryResolution({
      rideId,
      resolutionUpdate: {
        handoff_requested: true,
        handoff_driver_profile_id: target,
        resolution_status: "in_progress",
        resolution_action_notes: normalizedNotes,
      },
    });

    if (result.updated !== true) {
      throw new Error("O backend nao confirmou a solicitacao de handoff.");
    }

    return {
      updated: true,
      rideId,
      targetDriverProfileId: target,
    };
  }
}
