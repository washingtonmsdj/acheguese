/**
 * MOBILITY OFFER SERVICE
 * 
 * SSOT para gerenciamento de ofertas de corrida
 * Implementa modelo híbrido:
 * - Exclusive Offer: 1 motorista por vez
 * - Open Board: múltiplos motoristas
 * - Reservation Board: agendamentos
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/core/infrastructure/supabase';
import { profileService } from '@/core/profiles/services/ProfileService';
import { TRUST_ACTOR_ROLES, TrustEventService } from '@/core/trust';
import { MobilityDispatchConfigService } from './MobilityDispatchConfigService';
import { DriverAvailabilityService } from './DriverAvailabilityService';
import {
  getDriverOfferCapabilities,
  getExclusiveOfferRideForDriver,
  getOpenBoardOfferRides,
  getReservationOfferRides,
} from './mobility.queries';
import type {
  TrustActorRole,
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
import { RIDE_STATUS } from '../constants';
import { DISPATCH_ATTEMPT_STATUS } from '../constants/dispatchStatus';

// ============================================
// MOBILITY OFFER SERVICE
// ============================================

export class MobilityOfferService {
  private static getTrustPriorityMultiplier(decision: TrustPolicyDecision | null): number {
    if (!decision) return 1;
    if (decision.risk_level === 'critical') return 0.35;
    if (decision.risk_level === 'restricted') return 0.55;
    if (decision.risk_level === 'watchlist') return 0.8;
    return 1;
  }

  private static getTrustOfferMetadata(decision: TrustPolicyDecision | null): {
    driverTrustRiskLevel?: TrustRiskLevel;
    driverDispatchPolicy?: TrustDispatchPolicy;
  } {
    return {
      driverTrustRiskLevel: decision?.risk_level,
      driverDispatchPolicy: decision?.dispatch_policy,
    };
  }

  private static async getSubjectTrustDecision(
    profileId: string | null | undefined,
    role: TrustActorRole,
  ): Promise<TrustPolicyDecision | null> {
    if (!profileId) return null;

    const result = await TrustEventService.getPolicyDecision(profileId, role);
    if (result.error) {
      logger.warn('Subject trust policy unavailable for offer priority', {
        profileId,
        role,
        error: result.error,
      });
      return null;
    }

    return result.data;
  }

  private static getPassengerTrustOfferMetadata(decision: TrustPolicyDecision | null): {
    passengerTrustRiskLevel?: TrustRiskLevel;
    passengerDispatchPolicy?: TrustDispatchPolicy;
  } {
    return {
      passengerTrustRiskLevel: decision?.risk_level,
      passengerDispatchPolicy: decision?.dispatch_policy,
    };
  }

  private static getCustomerTrustOfferMetadata(decision: TrustPolicyDecision | null): {
    customerTrustRiskLevel?: TrustRiskLevel;
    customerDispatchPolicy?: TrustDispatchPolicy;
  } {
    return {
      customerTrustRiskLevel: decision?.risk_level,
      customerDispatchPolicy: decision?.dispatch_policy,
    };
  }

  /**
   * Busca oferta exclusiva para motorista específico
   * Usado em: Corrida imediata de passageiro
   */
  static async getExclusiveOffer(
    driverProfileId: string
  ): Promise<ExclusiveOffer | null> {
    try {
      const ride = await getExclusiveOfferRideForDriver(driverProfileId);
      if (!ride) return null;

      const trustGate = await TrustEventService.canReceiveOperationalCall(
        driverProfileId,
        TRUST_ACTOR_ROLES.DRIVER,
      );
      if (!trustGate.allowed) {
        logger.warn('Exclusive offer hidden by trust policy', {
          driverProfileId,
          reason: trustGate.reason,
        });
        return null;
      }
      const trustMetadata = this.getTrustOfferMetadata(trustGate.decision);

      // Calcular expiração
      const config = MobilityDispatchConfigService.getConfig('exclusive_offer');
      const assignedAt = new Date(ride.driver_assigned_at || ride.created_at);
      const expiresAt = new Date(assignedAt.getTime() + config.offerTimeoutSeconds * 1000);

      // Verificar se expirou
      if (new Date() > expiresAt) {
        logger.warn('Exclusive offer expired', { rideId: ride.id, driverProfileId });
        return null;
      }

      // Buscar dados do passageiro (rating, trust level)
      const passengerData = ride.passenger_profile_id
        ? await profileService.getProfileById(ride.passenger_profile_id)
        : null;
      const passengerMeta = passengerData as Record<string, unknown> | null;
      const passengerRatingValue = passengerMeta?.passenger_rating;
      const passengerRating =
        typeof passengerRatingValue === 'number' ? passengerRatingValue : undefined;
      const passengerTrustLevelValue = passengerMeta?.passenger_trust_level;
      const passengerTrustLevel =
        typeof passengerTrustLevelValue === 'string' ? passengerTrustLevelValue : undefined;
      const passengerTrustDecision = await this.getSubjectTrustDecision(
        ride.passenger_profile_id,
        TRUST_ACTOR_ROLES.CUSTOMER,
      );
      const passengerTrustMetadata =
        this.getPassengerTrustOfferMetadata(passengerTrustDecision);

      // Extrair bairros (proteger endereços completos)
      const originNeighborhood = this.extractNeighborhood(ride.origin);
      const destinationNeighborhood = this.extractNeighborhood(ride.destination);

      // Calcular distância estimada (se tiver coordenadas)
      let estimatedDistance = 0;
      let estimatedDuration = 0;
      if (ride.origin_lat && ride.origin_lng && ride.destination_lat && ride.destination_lng) {
        estimatedDistance = this.calculateDistance(
          ride.origin_lat,
          ride.origin_lng,
          ride.destination_lat,
          ride.destination_lng
        );
        estimatedDuration = this.estimateDuration(estimatedDistance);
      }

      return {
        id: `offer_${ride.id}`,
        rideId: ride.id,
        driverProfileId,
        offeredAt: ride.driver_assigned_at || ride.created_at,
        expiresAt: expiresAt.toISOString(),
        attemptNumber: 1, // TODO: buscar do audit
        status: DISPATCH_ATTEMPT_STATUS.PENDING,
        
        // Dados protegidos (apenas após aceite)
        origin: ride.origin,
        destination: ride.destination,
        originLat: ride.origin_lat ?? undefined,
        originLng: ride.origin_lng ?? undefined,
        destinationLat: ride.destination_lat ?? undefined,
        destinationLng: ride.destination_lng ?? undefined,
        
        // Dados públicos (antes do aceite)
        originNeighborhood,
        destinationNeighborhood,
        estimatedDistance,
        estimatedDuration,
        suggestedPrice: ride.suggested_price,
        paymentMethod: ride.payment_method,
        passengerRating,
        passengerTrustLevel,
        ...trustMetadata,
        ...passengerTrustMetadata,
      };
    } catch (error) {
      logger.error('MobilityOfferService.getExclusiveOffer', error as Error, { driverProfileId });
      return null;
    }
  }

  /**
   * Busca ofertas abertas para motorista (motoboy/entrega)
   * Usado em: Entrega/motoboy
   */
  static async getOpenBoardOffers(
    driverProfileId: string,
    filters?: OpenBoardFilters,
    sort?: OpenBoardSort,
    limit: number = 10
  ): Promise<OpenBoardOffer[]> {
    try {
      const trustGate = await TrustEventService.canReceiveOperationalCall(
        driverProfileId,
        TRUST_ACTOR_ROLES.COURIER,
      );
      if (!trustGate.allowed) {
        logger.warn('Open board hidden by trust policy', {
          driverProfileId,
          reason: trustGate.reason,
        });
        return [];
      }
      const trustPriorityMultiplier = this.getTrustPriorityMultiplier(trustGate.decision);
      const trustMetadata = this.getTrustOfferMetadata(trustGate.decision);

      const driverData = await this.getDriverCapabilities(driverProfileId);
      if (!driverData?.can_do_delivery) {
        logger.info('Driver has no delivery capability enabled', { driverProfileId });
        return [];
      }

      // Buscar localização atual do motorista
      const driverStatus = await DriverAvailabilityService.getStatus(driverProfileId);
      if (!driverStatus?.currentLocation) {
        logger.warn('Driver has no location', { driverProfileId });
        return [];
      }

      const { lat, lng } = driverStatus.currentLocation;

      const sortBy = sort?.sortBy ?? 'created_at';
      const sortOrder = sort?.order ?? 'desc';
      const sortColumn = sortBy === 'price' ? 'suggested_price' : 'created_at';
      const rides = await getOpenBoardOfferRides({
        minPrice: filters?.minPrice,
        maxPrice: filters?.maxPrice,
        packageSizes: filters?.packageSize,
        sortBy: sortColumn,
        ascending: sortOrder === 'asc',
        limit,
      });
      if (rides.length === 0) return [];

      // Processar ofertas
      const offers: OpenBoardOffer[] = [];

      for (const ride of rides) {
        if (!ride.origin_lat || !ride.origin_lng || !ride.destination_lat || !ride.destination_lng) {
          continue; // Pular se não tiver coordenadas
        }

        // Calcular distância do motorista até origem
        const distanceToOrigin = this.calculateDistance(
          lat,
          lng,
          ride.origin_lat,
          ride.origin_lng
        );

        // Filtrar por distância máxima
        if (filters?.maxDistance && distanceToOrigin > filters.maxDistance) {
          continue;
        }

        // Calcular distância da corrida
        const estimatedDistance = this.calculateDistance(
          ride.origin_lat,
          ride.origin_lng,
          ride.destination_lat,
          ride.destination_lng
        );

        const estimatedDuration = this.estimateDuration(estimatedDistance);

        // Buscar dados do cliente
        const customerProfile = ride.source_id
          ? await profileService.getProfileById(ride.source_id).catch(() => null)
          : null;
        const customerRecord = customerProfile as Record<string, unknown> | null;
        const customerDisplayNameValue = customerRecord?.display_name;
        const customerDisplayName =
          typeof customerDisplayNameValue === 'string' ? customerDisplayNameValue : 'Cliente';
        const customerRatingValue = customerRecord?.rating;
        const customerRating =
          typeof customerRatingValue === 'number' ? customerRatingValue : undefined;
        const customerTrustDecision = await this.getSubjectTrustDecision(
          ride.source_id,
          TRUST_ACTOR_ROLES.CUSTOMER,
        );
        const customerTrustMetadata =
          this.getCustomerTrustOfferMetadata(customerTrustDecision);

        // Calcular expiração
        const config = MobilityDispatchConfigService.getConfig('open_board');
        const createdAt = new Date(ride.created_at);
        const expiresAt = new Date(createdAt.getTime() + config.offerTimeoutSeconds * 1000);

        const basePriority = 100;
        const subjectPriorityMultiplier =
          this.getTrustPriorityMultiplier(customerTrustDecision);
        const trustAdjustedPriority = Math.round(
          basePriority * trustPriorityMultiplier * subjectPriorityMultiplier,
        );

        offers.push({
          id: `offer_${ride.id}`,
          rideId: ride.id,
          createdAt: ride.created_at,
          expiresAt: expiresAt.toISOString(),
          
          // Dados completos (visíveis antes do aceite)
          origin: ride.origin,
          destination: ride.destination,
          originLat: ride.origin_lat,
          originLng: ride.origin_lng,
          destinationLat: ride.destination_lat,
          destinationLng: ride.destination_lng,
          
          // Metadados
          packageSize: ride.package_size,
          packageDescription: ride.package_description,
          estimatedDistance,
          estimatedDuration,
          suggestedPrice: ride.suggested_price,
          paymentMethod: ride.payment_method,
          
          // Filtros
          priority: trustAdjustedPriority,
          trustAdjustedPriority,
          ...trustMetadata,
          
          // Cliente
          customerName: customerDisplayName,
          customerRating,
          ...customerTrustMetadata,
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
      logger.error('MobilityOfferService.getOpenBoardOffers', error as Error, { driverProfileId });
      return [];
    }
  }

  /**
   * Busca reservas de corridas agendadas
   * Usado em: Corridas agendadas
   */
  static async getReservationOffers(
    driverProfileId: string,
    limit: number = 10
  ): Promise<ReservationOffer[]> {
    try {
      const trustGate = await TrustEventService.canReceiveOperationalCall(
        driverProfileId,
        TRUST_ACTOR_ROLES.DRIVER,
      );
      if (!trustGate.allowed) {
        logger.warn('Reservation offers hidden by trust policy', {
          driverProfileId,
          reason: trustGate.reason,
        });
        return [];
      }
      const trustMetadata = this.getTrustOfferMetadata(trustGate.decision);

      const rides = await getReservationOfferRides(limit);
      if (rides.length === 0) return [];

      // Processar reservas
      const offers: ReservationOffer[] = [];

      for (const ride of rides) {
        if (!ride.origin_lat || !ride.origin_lng || !ride.destination_lat || !ride.destination_lng) {
          continue;
        }

        // Calcular distância
        const estimatedDistance = this.calculateDistance(
          ride.origin_lat,
          ride.origin_lng,
          ride.destination_lat,
          ride.destination_lng
        );

        const estimatedDuration = this.estimateDuration(estimatedDistance);

        // Buscar dados do passageiro
        const passengerProfile = ride.passenger_profile_id
          ? await profileService.getProfileById(ride.passenger_profile_id).catch(() => null)
          : null;
        const passengerRecord = passengerProfile as Record<string, unknown> | null;
        const passengerNameValue = passengerRecord?.display_name;
        const passengerName =
          typeof passengerNameValue === 'string' ? passengerNameValue : 'Passageiro';
        const passengerRatingValue = passengerRecord?.passenger_rating;
        const passengerRating =
          typeof passengerRatingValue === 'number' ? passengerRatingValue : undefined;
        const passengerTrustDecision = await this.getSubjectTrustDecision(
          ride.passenger_profile_id,
          TRUST_ACTOR_ROLES.CUSTOMER,
        );
        const passengerTrustMetadata =
          this.getPassengerTrustOfferMetadata(passengerTrustDecision);

        // Determinar status
        let status: 'open' | 'reserved' | 'confirmed' | 'cancelled' = 'open';
        if (ride.driver_profile_id) {
          status = ride.status === RIDE_STATUS.DRIVER_ACCEPTED ? 'confirmed' : 'reserved';
        }

        offers.push({
          id: `reservation_${ride.id}`,
          rideId: ride.id,
          scheduledFor: ride.scheduled_for,
          createdAt: ride.created_at,
          
          // Dados completos
          origin: ride.origin,
          destination: ride.destination,
          originLat: ride.origin_lat,
          originLng: ride.origin_lng,
          destinationLat: ride.destination_lat,
          destinationLng: ride.destination_lng,
          
          // Metadados
          estimatedDistance,
          estimatedDuration,
          suggestedPrice: ride.suggested_price,
          paymentMethod: ride.payment_method,
          
          // Passageiro
          passengerName,
          passengerRating,
          ...trustMetadata,
          ...passengerTrustMetadata,
          
          // Status
          acceptedBy: ride.driver_profile_id,
          status,
        });
      }

      return offers;
    } catch (error) {
      logger.error('MobilityOfferService.getReservationOffers', error as Error, { driverProfileId });
      return [];
    }
  }

  /**
   * Aceita oferta (com controle de concorrência)
   */
  static async acceptOffer(
    rideId: string,
    driverProfileId: string,
    strategy: DispatchStrategy
  ): Promise<AcceptOfferResult> {
    try {
      // Validar elegibilidade do motorista
      const eligibility = await this.validateDriverEligibility(driverProfileId, strategy);
      if (!eligibility.isEligible) {
        return {
          success: false,
          rideId,
          driverProfileId,
          reason: 'not_eligible',
          error: eligibility.reasons.join(', '),
        };
      }

      // Tentar aceitar com lock atômico
      const { data, error } = await supabase.rpc('accept_ride_atomic', {
        p_ride_id: rideId,
        p_driver_profile_id: driverProfileId,
        p_strategy: strategy,
      });

      if (error) {
        logger.error('Failed to accept offer', error, { rideId, driverProfileId });
        return {
          success: false,
          rideId,
          driverProfileId,
          reason: 'already_accepted',
          error: error.message,
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          rideId,
          driverProfileId,
          reason: data?.reason || 'unknown',
          error: data?.error,
        };
      }

      // Marcar motorista como busy
      await DriverAvailabilityService.setBusy(
        driverProfileId,
        rideId,
        strategy === 'open_board' ? 'motoboy' : 'ride'
      );

      logger.info('Offer accepted successfully', { rideId, driverProfileId, strategy });

      return {
        success: true,
        rideId,
        driverProfileId,
        reason: 'accepted',
        acceptedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('MobilityOfferService.acceptOffer', error as Error, { rideId, driverProfileId });
      return {
        success: false,
        rideId,
        driverProfileId,
        reason: 'already_accepted',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Valida elegibilidade do motorista
   */
  private static async validateDriverEligibility(
    driverProfileId: string,
    strategy: DispatchStrategy
  ): Promise<EligibilityResult> {
    const reasons: string[] = [];

    try {
      const driverData = await this.getDriverCapabilities(driverProfileId);
      if (!driverData) {
        reasons.push('Driver not found');
        return { isEligible: false, reasons };
      }

      // Buscar disponibilidade
      const availability = await DriverAvailabilityService.getStatus(driverProfileId);
      if (!availability) {
        reasons.push('Driver availability not found');
        return { isEligible: false, reasons };
      }

      // Obter configuração
      const config = MobilityDispatchConfigService.getConfig(strategy);

      // Validações obrigatórias
      if (config.requiresVerification && !driverData.is_verified) {
        reasons.push('Driver not verified');
      }

      if (driverData.is_suspended) {
        reasons.push('Driver is suspended');
      }

      if (!availability.isOnline) {
        reasons.push('Driver is offline');
      }

      if (!availability.isAvailable) {
        reasons.push('Driver is not available');
      }

      if (availability.activeRideId) {
        reasons.push('Driver has active ride');
      }

      // Validações opcionais
      if (config.requiresSubscription && !driverData.subscription_active) {
        reasons.push('Driver subscription is not active');
      }

      // Validação específica para motoboy
      if (strategy === 'open_board' && !driverData.can_do_delivery) {
        reasons.push('Driver cannot do deliveries');
      }

      if (strategy !== 'open_board' && driverData.can_do_rides === false) {
        reasons.push('Driver cannot do rides');
      }

      const trustRole =
        strategy === 'open_board' ? TRUST_ACTOR_ROLES.COURIER : TRUST_ACTOR_ROLES.DRIVER;
      const trustGate = await TrustEventService.canReceiveOperationalCall(
        driverProfileId,
        trustRole,
      );
      if (!trustGate.allowed) {
        reasons.push(trustGate.reason || 'Driver blocked by trust policy');
      }

      return {
        isEligible: reasons.length === 0,
        reasons,
      };
    } catch (error) {
      logger.error('MobilityOfferService.validateDriverEligibility', error as Error, { driverProfileId });
      reasons.push('Error validating eligibility');
      return { isEligible: false, reasons };
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Extrai bairro do endereço completo
   */
  private static extractNeighborhood(address: string): string {
    // TODO: Implementar extração inteligente de bairro
    // Por enquanto, retorna primeiras palavras
    const parts = address.split(',');
    return parts[parts.length - 2]?.trim() || 'Regiao';
  }

  /**
   * Calcula distância Haversine
   */
  private static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Estima duração baseada na distância
   */
  private static estimateDuration(distanceKm: number): number {
    // Velocidade média: 30 km/h em cidade
    const avgSpeedKmh = 30;
    return Math.ceil((distanceKm / avgSpeedKmh) * 60); // minutos
  }

  private static async getDriverCapabilities(
    driverProfileId: string
  ) {
    return getDriverOfferCapabilities(driverProfileId);
  }
}




