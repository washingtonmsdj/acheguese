/**
 * MOBILITY OFFER SERVICE
 *
 * SSOT para ofertas pre-aceite. Toda leitura vem do broker redigido; este
 * servico jamais reidrata identidade/PII a partir de ids internos da oferta.
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { TRUST_ACTOR_ROLES, TrustPolicyReadService } from '@/core/trust';
import { MobilityDispatchConfigService } from './MobilityDispatchConfigService';
import { DriverAvailabilityService } from './DriverAvailabilityService';
import {
  MobilityRpcService,
  type DriverOfferBrokerRow,
} from './MobilityRpcService';
import { getDriverOfferCapabilities } from './mobility.queries';
import type {
  TrustDispatchPolicy,
  TrustPolicyDecision,
  TrustRiskLevel,
} from '@/core/trust';
import type {
  DispatchStrategy,
  ExclusiveOffer,
  OpenBoardOffer,
  ReservationOffer,
  AcceptOfferResult,
  EligibilityResult,
  OpenBoardFilters,
  OpenBoardSort,
} from '../types/dispatch.types';
import { DISPATCH_ATTEMPT_STATUS } from '../constants/dispatchStatus';

type AcceptRideAtomicResult = {
  success?: boolean;
  reason?: string;
  error?: string;
};

type TrustDecisionView = Pick<
  TrustPolicyDecision,
  'risk_level' | 'dispatch_policy'
>;

function normalizeAcceptOfferReason(
  value: string | undefined,
): AcceptOfferResult['reason'] | undefined {
  switch (value) {
    case 'accepted':
    case 'already_accepted':
    case 'expired':
    case 'invalid_state':
    case 'driver_busy':
    case 'not_eligible':
      return value;
    default:
      return undefined;
  }
}

export class MobilityOfferService {
  private static getTrustPriorityMultiplier(
    decision: TrustDecisionView | null,
  ): number {
    if (!decision) return 1;
    if (decision.risk_level === 'critical') return 0.35;
    if (decision.risk_level === 'restricted') return 0.55;
    if (decision.risk_level === 'watchlist') return 0.8;
    return 1;
  }

  private static getTrustOfferMetadata(
    decision: TrustDecisionView | null,
  ): {
    driverTrustRiskLevel?: TrustRiskLevel;
    driverDispatchPolicy?: TrustDispatchPolicy;
  } {
    return {
      driverTrustRiskLevel: decision?.risk_level,
      driverDispatchPolicy: decision?.dispatch_policy,
    };
  }

  private static toOfferTrustDecision(
    ride: DriverOfferBrokerRow,
  ): TrustDecisionView | null {
    if (!ride.risk_level || !ride.dispatch_policy) return null;
    return {
      risk_level: ride.risk_level as TrustRiskLevel,
      dispatch_policy: ride.dispatch_policy as TrustDispatchPolicy,
    };
  }

  private static getPassengerTrustOfferMetadata(
    decision: TrustDecisionView | null,
  ): {
    passengerTrustRiskLevel?: TrustRiskLevel;
    passengerDispatchPolicy?: TrustDispatchPolicy;
  } {
    return {
      passengerTrustRiskLevel: decision?.risk_level,
      passengerDispatchPolicy: decision?.dispatch_policy,
    };
  }

  private static getCustomerTrustOfferMetadata(
    decision: TrustDecisionView | null,
  ): {
    customerTrustRiskLevel?: TrustRiskLevel;
    customerDispatchPolicy?: TrustDispatchPolicy;
  } {
    return {
      customerTrustRiskLevel: decision?.risk_level,
      customerDispatchPolicy: decision?.dispatch_policy,
    };
  }

  /**
   * Defense in depth for G69. The broker is the authority that coarse-grains
   * route data; browser code refuses to treat an unlabeled response as a safe
   * pre-accept offer.
   */
  private static hasCoarseLocationContract(ride: DriverOfferBrokerRow): boolean {
    const record = ride as unknown as Record<string, unknown>;
    return record.location_precision === 'coarse_2dp';
  }

  static async getExclusiveOffer(
    driverProfileId: string,
  ): Promise<ExclusiveOffer | null> {
    try {
      const offerData = await MobilityRpcService.listDriverOffers({
        driverProfileId,
        strategy: 'exclusive_offer',
        limit: 1,
      });
      const ride = offerData.offers[0];
      if (!ride) return null;
      if (!this.hasCoarseLocationContract(ride)) {
        logger.error('Preaccept offer rejected: missing coarse location contract', {
          rideId: ride.id,
          strategy: 'exclusive_offer',
        });
        return null;
      }

      const trustGate = await TrustPolicyReadService.canCurrentReceiveOperationalCall(
        TRUST_ACTOR_ROLES.DRIVER,
      );
      if (!trustGate.allowed) {
        logger.warn('Exclusive offer hidden by trust policy', {
          driverProfileId,
          reason: trustGate.reason,
        });
        return null;
      }

      const config = MobilityDispatchConfigService.getConfig('exclusive_offer');
      const assignedAt = new Date(ride.driver_assigned_at || ride.created_at);
      const expiresAt = new Date(
        assignedAt.getTime() + config.offerTimeoutSeconds * 1000,
      );
      const attemptNumber = await this.getLatestAttemptNumber(
        ride.id,
        driverProfileId,
      );

      if (new Date() > expiresAt) {
        logger.warn('Exclusive offer expired', { rideId: ride.id, driverProfileId });
        return null;
      }

      const passengerTrustDecision = this.toOfferTrustDecision(ride);
      const originNeighborhood = this.extractNeighborhood(ride.origin);
      const destinationNeighborhood = this.extractNeighborhood(ride.destination);

      let estimatedDistance = 0;
      let estimatedDuration = 0;
      if (
        ride.origin_lat != null &&
        ride.origin_lng != null &&
        ride.destination_lat != null &&
        ride.destination_lng != null
      ) {
        estimatedDistance = this.calculateDistance(
          ride.origin_lat,
          ride.origin_lng,
          ride.destination_lat,
          ride.destination_lng,
        );
        estimatedDuration = this.estimateDuration(estimatedDistance);
      }

      return {
        id: `offer_${ride.id}`,
        rideId: ride.id,
        driverProfileId,
        offeredAt: ride.driver_assigned_at || ride.created_at,
        expiresAt: expiresAt.toISOString(),
        attemptNumber,
        status: DISPATCH_ATTEMPT_STATUS.PENDING,
        origin: ride.origin,
        destination: ride.destination,
        originLat: ride.origin_lat ?? undefined,
        originLng: ride.origin_lng ?? undefined,
        destinationLat: ride.destination_lat ?? undefined,
        destinationLng: ride.destination_lng ?? undefined,
        locationPrecision: 'coarse_2dp',
        originNeighborhood,
        destinationNeighborhood,
        estimatedDistance,
        estimatedDuration,
        suggestedPrice: ride.suggested_price,
        paymentMethod: ride.payment_method,
        ...this.getTrustOfferMetadata(trustGate.decision),
        ...this.getPassengerTrustOfferMetadata(passengerTrustDecision),
      };
    } catch (error) {
      logger.error('MobilityOfferService.getExclusiveOffer', error as Error, {
        driverProfileId,
      });
      return null;
    }
  }

  static async getOpenBoardOffers(
    driverProfileId: string,
    filters?: OpenBoardFilters,
    sort?: OpenBoardSort,
    limit: number = 10,
  ): Promise<OpenBoardOffer[]> {
    try {
      const trustGate = await TrustPolicyReadService.canCurrentReceiveOperationalCall(
        TRUST_ACTOR_ROLES.COURIER,
      );
      if (!trustGate.allowed) {
        logger.warn('Open board hidden by trust policy', {
          driverProfileId,
          reason: trustGate.reason,
        });
        return [];
      }

      const driverData = await this.getDriverCapabilities(driverProfileId);
      if (!driverData?.can_do_delivery) return [];

      const driverStatus = await DriverAvailabilityService.getStatus(driverProfileId);
      if (!driverStatus?.currentLocation) {
        logger.warn('Driver has no location', { driverProfileId });
        return [];
      }
      const { lat, lng } = driverStatus.currentLocation;

      const sortBy = sort?.sortBy ?? 'created_at';
      const sortOrder = sort?.order ?? 'desc';
      const sortColumn = sortBy === 'price' ? 'suggested_price' : 'created_at';
      const offerData = await MobilityRpcService.listDriverOffers({
        driverProfileId,
        strategy: 'open_board',
        minPrice: filters?.minPrice,
        maxPrice: filters?.maxPrice,
        packageSizes: filters?.packageSize,
        sortBy: sortColumn,
        ascending: sortOrder === 'asc',
        limit,
      });

      const rides = offerData.offers.filter(
        (offer) =>
          offer.offer_kind !== 'failed_delivery_handoff' &&
          this.hasCoarseLocationContract(offer),
      );
      if (rides.length === 0) return [];

      const driverTrustMultiplier = this.getTrustPriorityMultiplier(
        trustGate.decision,
      );
      const offers: OpenBoardOffer[] = [];

      for (const ride of rides) {
        if (
          ride.origin_lat == null ||
          ride.origin_lng == null ||
          ride.destination_lat == null ||
          ride.destination_lng == null
        ) {
          continue;
        }

        const distanceToOrigin = this.calculateDistance(
          lat,
          lng,
          ride.origin_lat,
          ride.origin_lng,
        );
        if (filters?.maxDistance && distanceToOrigin > filters.maxDistance) {
          continue;
        }

        const estimatedDistance = this.calculateDistance(
          ride.origin_lat,
          ride.origin_lng,
          ride.destination_lat,
          ride.destination_lng,
        );
        const estimatedDuration = this.estimateDuration(estimatedDistance);
        const customerTrustDecision = this.toOfferTrustDecision(ride);
        const customerTrustMultiplier =
          this.getTrustPriorityMultiplier(customerTrustDecision);
        const trustAdjustedPriority = Math.round(
          100 * driverTrustMultiplier * customerTrustMultiplier,
        );

        const config = MobilityDispatchConfigService.getConfig('open_board');
        const createdAt = new Date(ride.created_at);
        const expiresAt = new Date(
          createdAt.getTime() + config.offerTimeoutSeconds * 1000,
        );

        offers.push({
          id: `offer_${ride.id}`,
          rideId: ride.id,
          createdAt: ride.created_at,
          expiresAt: expiresAt.toISOString(),
          origin: ride.origin,
          destination: ride.destination,
          originLat: ride.origin_lat,
          originLng: ride.origin_lng,
          destinationLat: ride.destination_lat,
          destinationLng: ride.destination_lng,
          locationPrecision: 'coarse_2dp',
          packageSize: ride.package_size ?? undefined,
          estimatedDistance,
          estimatedDuration,
          suggestedPrice: ride.suggested_price,
          paymentMethod: ride.payment_method,
          priority: trustAdjustedPriority,
          trustAdjustedPriority,
          ...this.getTrustOfferMetadata(trustGate.decision),
          ...this.getCustomerTrustOfferMetadata(customerTrustDecision),
        });
      }

      if (sortBy === 'distance') {
        offers.sort((a, b) =>
          sortOrder === 'asc'
            ? a.estimatedDistance - b.estimatedDistance
            : b.estimatedDistance - a.estimatedDistance,
        );
      }
      if (sortBy === 'priority' || sortBy === 'score') {
        offers.sort((a, b) =>
          sortOrder === 'asc' ? a.priority - b.priority : b.priority - a.priority,
        );
      }

      return offers;
    } catch (error) {
      logger.error('MobilityOfferService.getOpenBoardOffers', error as Error, {
        driverProfileId,
      });
      return [];
    }
  }

  static async getReservationOffers(
    driverProfileId: string,
    limit: number = 10,
  ): Promise<ReservationOffer[]> {
    try {
      const trustGate = await TrustPolicyReadService.canCurrentReceiveOperationalCall(
        TRUST_ACTOR_ROLES.DRIVER,
      );
      if (!trustGate.allowed) return [];

      const offerData = await MobilityRpcService.listDriverOffers({
        driverProfileId,
        strategy: 'reservation_board',
        sortBy: 'departure_time',
        ascending: true,
        limit,
      });

      const offers: ReservationOffer[] = [];
      for (const ride of offerData.offers) {
        if (
          !this.hasCoarseLocationContract(ride) ||
          !ride.scheduled_for ||
          ride.origin_lat == null ||
          ride.origin_lng == null ||
          ride.destination_lat == null ||
          ride.destination_lng == null
        ) {
          continue;
        }

        const estimatedDistance = this.calculateDistance(
          ride.origin_lat,
          ride.origin_lng,
          ride.destination_lat,
          ride.destination_lng,
        );
        const passengerTrustDecision = this.toOfferTrustDecision(ride);

        offers.push({
          id: `reservation_${ride.id}`,
          rideId: ride.id,
          scheduledFor: ride.scheduled_for,
          createdAt: ride.created_at,
          origin: ride.origin,
          destination: ride.destination,
          originLat: ride.origin_lat,
          originLng: ride.origin_lng,
          destinationLat: ride.destination_lat,
          destinationLng: ride.destination_lng,
          locationPrecision: 'coarse_2dp',
          estimatedDistance,
          estimatedDuration: this.estimateDuration(estimatedDistance),
          suggestedPrice: ride.suggested_price,
          paymentMethod: ride.payment_method,
          ...this.getTrustOfferMetadata(trustGate.decision),
          ...this.getPassengerTrustOfferMetadata(passengerTrustDecision),
          status: 'open',
        });
      }

      return offers;
    } catch (error) {
      logger.error('MobilityOfferService.getReservationOffers', error as Error, {
        driverProfileId,
      });
      return [];
    }
  }

  static async acceptOffer(
    rideId: string,
    driverProfileId: string,
    strategy: DispatchStrategy,
  ): Promise<AcceptOfferResult> {
    try {
      const eligibility = await this.validateDriverEligibility(
        driverProfileId,
        strategy,
      );
      if (!eligibility.isEligible) {
        return {
          success: false,
          rideId,
          driverProfileId,
          reason: 'not_eligible',
          error: eligibility.reasons.join(', '),
        };
      }

      const data: AcceptRideAtomicResult =
        await MobilityRpcService.acceptRideAtomic(
          rideId,
          driverProfileId,
          strategy,
        );

      if (!data?.success) {
        return {
          success: false,
          rideId,
          driverProfileId,
          reason: normalizeAcceptOfferReason(data?.reason),
          error: data?.error,
        };
      }

      logger.info('Offer accepted successfully', {
        rideId,
        driverProfileId,
        strategy,
      });
      return {
        success: true,
        rideId,
        driverProfileId,
        reason: 'accepted',
        acceptedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('MobilityOfferService.acceptOffer', error as Error, {
        rideId,
        driverProfileId,
      });
      return {
        success: false,
        rideId,
        driverProfileId,
        reason: 'already_accepted',
        error: (error as Error).message,
      };
    }
  }

  private static async validateDriverEligibility(
    driverProfileId: string,
    strategy: DispatchStrategy,
  ): Promise<EligibilityResult> {
    const reasons: string[] = [];
    try {
      const driverData = await this.getDriverCapabilities(driverProfileId);
      if (!driverData) return { isEligible: false, reasons: ['Driver not found'] };

      const availability = await DriverAvailabilityService.getStatus(driverProfileId);
      if (!availability) {
        return { isEligible: false, reasons: ['Driver availability not found'] };
      }

      const config = MobilityDispatchConfigService.getConfig(strategy);
      if (config.requiresVerification && !driverData.is_verified) {
        reasons.push('Driver not verified');
      }
      if (driverData.is_suspended) reasons.push('Driver is suspended');
      if (!availability.isOnline) reasons.push('Driver is offline');
      if (!availability.isAvailable) reasons.push('Driver is not available');
      if (availability.activeRideId) reasons.push('Driver has active ride');
      if (config.requiresSubscription && !driverData.subscription_active) {
        reasons.push('Driver subscription is not active');
      }
      if (strategy === 'open_board' && !driverData.can_do_delivery) {
        reasons.push('Driver cannot do deliveries');
      }
      if (strategy !== 'open_board' && driverData.can_do_rides === false) {
        reasons.push('Driver cannot do rides');
      }

      const trustRole =
        strategy === 'open_board'
          ? TRUST_ACTOR_ROLES.COURIER
          : TRUST_ACTOR_ROLES.DRIVER;
      const trustGate = await TrustPolicyReadService.canCurrentReceiveOperationalCall(
        trustRole,
      );
      if (!trustGate.allowed) {
        reasons.push(trustGate.reason || 'Driver blocked by trust policy');
      }

      return { isEligible: reasons.length === 0, reasons };
    } catch (error) {
      logger.error('MobilityOfferService.validateDriverEligibility', error as Error, {
        driverProfileId,
      });
      return { isEligible: false, reasons: ['Error validating eligibility'] };
    }
  }

  private static extractNeighborhood(address: string): string {
    const parts = address
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return 'Regiao';

    const isAdministrativePart = (part: string) => {
      const normalized = part
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return (
        /^\d+$/.test(normalized) ||
        /^\d{5}-?\d{3}$/.test(normalized) ||
        /^[a-z]{2}$/.test(normalized) ||
        normalized === 'brasil' ||
        normalized === 'brazil' ||
        /^(rua|avenida|av\.?|travessa|estrada|rodovia|alameda)\b/.test(normalized)
      );
    };

    return (
      [...parts].reverse().find((part) => !isAdministrativePart(part)) ||
      parts[0] ||
      'Regiao'
    );
  }

  private static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const earthRadiusKm = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private static toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private static estimateDuration(distanceKm: number): number {
    const avgSpeedKmh = 30;
    return Math.ceil((distanceKm / avgSpeedKmh) * 60);
  }

  private static async getDriverCapabilities(driverProfileId: string) {
    return getDriverOfferCapabilities(driverProfileId);
  }

  private static async getLatestAttemptNumber(
    rideId: string,
    driverProfileId: string,
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('ride_dispatch_audit')
        .select('attempt_number')
        .eq('ride_id', rideId)
        .eq('driver_profile_id', driverProfileId)
        .order('attempt_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      const attemptNumber = data?.attempt_number;
      return typeof attemptNumber === 'number' && attemptNumber > 0
        ? attemptNumber
        : 1;
    } catch (error) {
      logger.warn('Failed to resolve latest dispatch attempt number', {
        rideId,
        driverProfileId,
        error,
      });
      return 1;
    }
  }
}
