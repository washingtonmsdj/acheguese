/**
 * useDriverOffers - Hook para motoristas receberem ofertas de corrida.
 *
 * G73: oferta pre-aceite pertence exclusivamente ao MobilityOfferService.
 * Nenhum detalhe da ride_requests e carregado diretamente antes do aceite.
 */
import { logger } from '@/shared/utils/logger';
import { useEffect, useState, useCallback } from 'react';
import { RideOperationalService } from '@/core/mobility/core/RideOperationalService';
import { MobilityOfferService } from '@/core/mobility/services/MobilityOfferService';
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

export function useDriverOffers(options: UseDriverOffersOptions) {
  const { driverProfileId, enabled = true, onNewOffer } = options;

  const [currentOffer, setCurrentOffer] = useState<RideOffer | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOffer = useCallback(async (expectedRideId?: string) => {
    if (!driverProfileId) return;

    try {
      const brokerOffer = await MobilityOfferService.getExclusiveOffer(driverProfileId);
      if (!brokerOffer || (expectedRideId && brokerOffer.rideId !== expectedRideId)) {
        if (expectedRideId) {
          logger.warn('Assigned ride is not available through canonical offer broker', {
            rideId: expectedRideId,
            driverProfileId,
          });
        }
        return;
      }

      const offer: RideOffer = {
        rideId: brokerOffer.rideId,
        pickupAddress: brokerOffer.originNeighborhood,
        dropoffAddress: brokerOffer.destinationNeighborhood,
        suggestedPrice: brokerOffer.suggestedPrice,
        distance: brokerOffer.estimatedDistance,
        offeredAt: brokerOffer.offeredAt,
        expiresAt: brokerOffer.expiresAt,
      };

      setCurrentOffer(offer);
      onNewOffer?.(offer);

      logger.info('New ride offer loaded from canonical broker', {
        rideId: brokerOffer.rideId,
        driverProfileId,
      });
    } catch (err) {
      logger.error('Error loading ride offer from canonical broker', err as Error);
    }
  }, [driverProfileId, onNewOffer]);

  useRideRealtime({
    userType: 'driver',
    userId: driverProfileId,
    enabled: enabled && !!driverProfileId,
    onEvent: (event) => {
      if (event.type === 'driver_assigned' && event.driverProfileId === driverProfileId) {
        void loadOffer(event.rideId);
      } else if (event.type === 'expired' || event.type === 'cancelled') {
        if (currentOffer?.rideId === event.rideId) {
          setCurrentOffer(null);
        }
      }
    },
  });

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
    void loadOffer();
  }, [enabled, driverProfileId, loadOffer]);

  return {
    currentOffer,
    isAccepting,
    error,
    acceptOffer,
    rejectOffer,
  };
}
