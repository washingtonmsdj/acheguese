/**
 * useDriverOffers - Hook para motoristas receberem ofertas de corrida
 *
 * Monitora corridas atribuidas ao motorista em tempo real
 * e permite aceitar/rejeitar ofertas.
 */
import { logger } from '@/shared/utils/logger';
import { useEffect, useState, useCallback } from 'react';
import { RideOperationalService } from '../core/RideOperationalService';
import { getRideWithAddresses, getRidesByDriverProfile } from '../services/mobility.queries';
import { useRideRealtime } from './useRideRealtime';

interface RideOffer {
  rideId: string;
  pickupAddress: string;
  dropoffAddress: string;
  suggestedPrice: number;
  distance: number;
  offeredAt: string;
  expiresAt: string;
}

interface UseDriverOffersOptions {
  driverProfileId?: string;
  enabled?: boolean;
  onNewOffer?: (offer: RideOffer) => void;
}

interface RideOfferDetails {
  id: string;
  status: string;
  driver_profile_id: string | null;
  suggested_price: number | null;
  created_at: string;
  origin?: string | null;
  destination?: string | null;
  pickup_address?: {
    street?: string | null;
    city?: string | null;
  } | null;
  dropoff_address?: {
    street?: string | null;
    city?: string | null;
  } | null;
}

export function useDriverOffers(options: UseDriverOffersOptions) {
  const { driverProfileId, enabled = true, onNewOffer } = options;

  const [currentOffer, setCurrentOffer] = useState<RideOffer | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useRideRealtime({
    userType: 'driver',
    userId: driverProfileId,
    enabled: enabled && !!driverProfileId,
    onEvent: (event) => {
      if (event.type === 'driver_assigned' && event.driverProfileId === driverProfileId) {
        loadOffer(event.rideId);
      } else if (event.type === 'expired' || event.type === 'cancelled') {
        if (currentOffer?.rideId === event.rideId) {
          setCurrentOffer(null);
        }
      }
    },
  });

  const loadOffer = useCallback(async (rideId: string) => {
    if (!driverProfileId) return;

    try {
      const ride = (await getRideWithAddresses(rideId)) as RideOfferDetails | null;
      if (!ride || ride.driver_profile_id !== driverProfileId || ride.status !== 'driver_assigned') {
        logger.warn('Failed to load ride offer', { rideId, driverProfileId });
        return;
      }

      const pickupAddress = [ride.pickup_address?.street, ride.pickup_address?.city]
        .filter(Boolean)
        .join(', ') || ride.origin || 'Origem nao informada';

      const dropoffAddress = [ride.dropoff_address?.street, ride.dropoff_address?.city]
        .filter(Boolean)
        .join(', ') || ride.destination || 'Destino nao informado';

      const offer: RideOffer = {
        rideId: ride.id,
        pickupAddress,
        dropoffAddress,
        suggestedPrice: ride.suggested_price || 0,
        distance: 0,
        offeredAt: ride.created_at,
        expiresAt: new Date(new Date(ride.created_at).getTime() + 30000).toISOString(),
      };

      setCurrentOffer(offer);
      onNewOffer?.(offer);

      logger.info('New ride offer loaded', { rideId, driverProfileId });
    } catch (err) {
      logger.error('Error loading ride offer', err as Error);
    }
  }, [driverProfileId, onNewOffer]);

  const acceptOffer = useCallback(async (rideId: string) => {
    if (!driverProfileId) {
      setError('Driver profile ID not found');
      return { success: false };
    }

    setIsAccepting(true);
    setError(null);

    try {
      const result = await RideOperationalService.acceptRide(rideId, driverProfileId);

      if (result.success) {
        setCurrentOffer(null);
        logger.info('Ride offer accepted', { rideId, driverProfileId });
      } else {
        setError(result.error || 'Failed to accept ride');
        logger.warn('Failed to accept ride offer', { rideId, error: result.error });
      }

      return result;
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      logger.error('Error accepting ride offer', err as Error);
      return { success: false, error: errorMsg };
    } finally {
      setIsAccepting(false);
    }
  }, [driverProfileId]);

  const rejectOffer = useCallback((rideId: string) => {
    if (currentOffer?.rideId === rideId) {
      setCurrentOffer(null);
      logger.info('Ride offer rejected', { rideId, driverProfileId });
    }
  }, [currentOffer, driverProfileId]);

  useEffect(() => {
    if (!enabled || !driverProfileId) return;

    const checkPendingOffer = async () => {
      try {
        const rides = (await getRidesByDriverProfile(driverProfileId)) as Array<{
          id?: string;
          status?: string;
        }>;

        const pendingRide = rides.find((item) => item.status === 'driver_assigned');
        if (pendingRide?.id) {
          loadOffer(pendingRide.id);
        }
      } catch (err) {
        logger.error('Error checking pending offer', err as Error);
      }
    };

    checkPendingOffer();
  }, [enabled, driverProfileId, loadOffer]);

  return {
    currentOffer,
    isAccepting,
    error,
    acceptOffer,
    rejectOffer,
  };
}