import { RIDE_STATE } from "../core/RideStateMachine";
import { getRideById } from "./mobility.queries";
import {
  MobilityRpcService,
  type DriverOfferBrokerRow,
} from "./MobilityRpcService";

interface HandoffRideState {
  status?: string;
  ride_mode?: string | null;
  driver_profile_id?: string | null;
  failed_delivery_metadata?: Record<string, unknown> | null;
}

export interface FailedDeliveryHandoffOffer {
  rideId: string;
  requestedAt: string;
  expiresAt: string;
  origin: string;
  destination: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  locationPrecision: "coarse_2dp";
  packageSize?: string | null;
  suggestedPrice: number;
  paymentMethod: string;
}

export interface FailedDeliveryHandoffAcceptanceResult {
  success: true;
  rideId: string;
  driverProfileId: string;
  status: typeof RIDE_STATE.IN_DELIVERY;
  acceptedAt?: string;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function isAcceptedHandoff(
  ride: HandoffRideState | null,
  driverProfileId: string,
): boolean {
  const metadata = ride?.failed_delivery_metadata;
  return (
    ride?.ride_mode === "motoboy" &&
    ride.status === RIDE_STATE.IN_DELIVERY &&
    ride.driver_profile_id === driverProfileId &&
    metadata?.resolution_status === "resolved" &&
    metadata?.resolution_action === "handoff_to_another_driver" &&
    metadata?.resolution_item_holder === "other_driver" &&
    metadata?.handoff_driver_profile_id === driverProfileId &&
    metadata?.handoff_acceptance_source === "authenticated_driver_accept" &&
    Boolean(nonEmptyString(metadata?.handoff_accepted_at))
  );
}

function toPendingOffer(
  offer: DriverOfferBrokerRow,
): FailedDeliveryHandoffOffer | null {
  if (offer.offer_kind !== "failed_delivery_handoff") return null;
  if (offer.location_precision !== "coarse_2dp") return null;

  const expiresAt = nonEmptyString(offer.handoff_request_expires_at);
  const requestedAt = nonEmptyString(offer.created_at);
  if (!expiresAt || !requestedAt) return null;

  const expiry = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiry) || expiry <= Date.now()) return null;

  if (
    !Number.isFinite(offer.origin_lat) ||
    !Number.isFinite(offer.origin_lng) ||
    !Number.isFinite(offer.destination_lat) ||
    !Number.isFinite(offer.destination_lng)
  ) {
    return null;
  }

  return {
    rideId: offer.id,
    requestedAt,
    expiresAt,
    origin: offer.origin,
    destination: offer.destination,
    originLat: offer.origin_lat as number,
    originLng: offer.origin_lng as number,
    destinationLat: offer.destination_lat as number,
    destinationLng: offer.destination_lng as number,
    locationPrecision: "coarse_2dp",
    packageSize: offer.package_size,
    suggestedPrice: offer.suggested_price,
    paymentMethod: offer.payment_method,
  };
}

/**
 * Receiver-side boundary for failed-delivery physical custody handoff.
 *
 * Before acceptance the receiver is deliberately not a ride participant. The
 * only discovery surface is the targeted, privacy-redacted offer broker. A raw
 * ride read is used only after a possibly committed acceptance for idempotent
 * recovery/read-back confirmation.
 */
export class FailedDeliveryHandoffService {
  static async listPending(
    driverProfileId: string,
    limit = 10,
  ): Promise<FailedDeliveryHandoffOffer[]> {
    const driver = driverProfileId.trim();
    if (!driver) return [];

    const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 50));
    const data = await MobilityRpcService.listDriverOffers({
      driverProfileId: driver,
      strategy: "open_board",
      limit: safeLimit,
    });

    return data.offers
      .map(toPendingOffer)
      .filter((offer): offer is FailedDeliveryHandoffOffer => offer !== null);
  }

  static async accept(
    rideId: string,
    driverProfileId: string,
  ): Promise<FailedDeliveryHandoffAcceptanceResult> {
    const driver = driverProfileId.trim();
    if (!driver) {
      throw new Error("Perfil do motoboy receptor e obrigatorio.");
    }

    const pending = await this.listPending(driver, 50);
    if (!pending.some((offer) => offer.rideId === rideId)) {
      const afterPossibleCommit = (await getRideById(rideId).catch(() => null)) as
        | HandoffRideState
        | null;
      if (afterPossibleCommit && isAcceptedHandoff(afterPossibleCommit, driver)) {
        return {
          success: true,
          rideId,
          driverProfileId: driver,
          status: RIDE_STATE.IN_DELIVERY,
          acceptedAt: nonEmptyString(
            afterPossibleCommit.failed_delivery_metadata?.handoff_accepted_at,
          ),
        };
      }

      throw new Error("Nao existe solicitacao de handoff ativa para este motoboy.");
    }

    let brokerError: Error | null = null;
    try {
      const result = await MobilityRpcService.acceptRideAtomic(
        rideId,
        driver,
        "exclusive_offer",
      );

      if (result.success === true) {
        const confirmed = (await getRideById(rideId).catch(() => null)) as
          | HandoffRideState
          | null;
        return {
          success: true,
          rideId,
          driverProfileId: driver,
          status: RIDE_STATE.IN_DELIVERY,
          acceptedAt: confirmed && isAcceptedHandoff(confirmed, driver)
            ? nonEmptyString(confirmed.failed_delivery_metadata?.handoff_accepted_at)
            : undefined,
        };
      }

      brokerError = new Error(
        result.error ||
          `Handoff nao confirmado${result.reason ? `: ${result.reason}` : ""}.`,
      );
    } catch (error) {
      brokerError = error instanceof Error ? error : new Error(String(error));
    }

    // A resposta pode se perder depois do commit. Nesse caso o receptor ja e
    // participante e a evidencia persistida e a unica fonte aceita para rescue.
    const after = (await getRideById(rideId).catch(() => null)) as
      | HandoffRideState
      | null;
    if (after && isAcceptedHandoff(after, driver)) {
      return {
        success: true,
        rideId,
        driverProfileId: driver,
        status: RIDE_STATE.IN_DELIVERY,
        acceptedAt: nonEmptyString(after.failed_delivery_metadata?.handoff_accepted_at),
      };
    }

    throw brokerError ?? new Error("O backend nao confirmou a transferencia de custodia.");
  }
}
