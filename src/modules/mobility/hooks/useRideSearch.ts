/**
 * useRideSearch - Hook para passageiros acompanharem busca de motorista
 *
 * Monitora o progresso da busca em tempo real e notifica quando
 * motorista e encontrado, aceita ou corrida expira.
 */

import { useEffect, useState, useCallback } from 'react';
import { logger } from '@/shared/utils/logger';
import { getRideById } from '../services/mobility.queries';
import { useRideRealtime } from './useRideRealtime';

interface RideSearchStatus {
  rideId: string;
  status: 'searching' | 'driver_found' | 'driver_accepted' | 'expired' | 'cancelled';
  driverProfileId?: string;
  message: string;
  timestamp: string;
}

interface UseRideSearchOptions {
  rideId?: string;
  passengerProfileId?: string;
  enabled?: boolean;
  onStatusChange?: (status: RideSearchStatus) => void;
}

interface RideStatusRow {
  status?: string;
  driver_profile_id?: string;
}

export function useRideSearch(options: UseRideSearchOptions) {
  const { rideId, passengerProfileId, enabled = true, onStatusChange } = options;

  const [searchStatus, setSearchStatus] = useState<RideSearchStatus | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const updateStatus = useCallback((
    status: RideSearchStatus['status'],
    driverProfileId?: string,
    message?: string,
  ) => {
    const newStatus: RideSearchStatus = {
      rideId: rideId || '',
      status,
      driverProfileId,
      message: message || getDefaultMessage(status),
      timestamp: new Date().toISOString(),
    };

    setSearchStatus(newStatus);
    setIsSearching(status === 'searching' || status === 'driver_found');
    onStatusChange?.(newStatus);

    logger.info('Ride search status updated', newStatus);
  }, [rideId, onStatusChange]);

  useRideRealtime({
    rideId,
    userType: 'passenger',
    userId: passengerProfileId,
    enabled: enabled && !!rideId && !!passengerProfileId,
    onEvent: (event) => {
      switch (event.type) {
        case 'driver_assigned':
          updateStatus('driver_found', event.driverProfileId);
          break;
        case 'driver_accepted':
          updateStatus('driver_accepted', event.driverProfileId);
          break;
        case 'expired':
          updateStatus('expired');
          break;
        case 'cancelled':
          updateStatus('cancelled');
          break;
      }
    },
  });

  useEffect(() => {
    if (!enabled || !rideId) return;

    const loadInitialStatus = async () => {
      try {
        const ride = (await getRideById(rideId)) as RideStatusRow | null;
        if (!ride) {
          logger.warn('Failed to load ride status', { rideId });
          return;
        }

        if (ride.status === 'searching_driver') {
          updateStatus('searching');
        } else if (ride.status === 'driver_assigned') {
          updateStatus('driver_found', ride.driver_profile_id);
        } else if (ride.status === 'driver_accepted') {
          updateStatus('driver_accepted', ride.driver_profile_id);
        } else if (ride.status === 'expired') {
          updateStatus('expired');
        } else if (ride.status?.includes('cancelled')) {
          updateStatus('cancelled');
        }
      } catch (err) {
        logger.error('Error loading ride status', err as Error);
      }
    };

    loadInitialStatus();
  }, [enabled, rideId, updateStatus]);

  return {
    searchStatus,
    isSearching,
  };
}

function getDefaultMessage(status: RideSearchStatus['status']): string {
  switch (status) {
    case 'searching':
      return 'Procurando motorista disponivel...';
    case 'driver_found':
      return 'Motorista encontrado! Aguardando confirmacao...';
    case 'driver_accepted':
      return 'Motorista confirmou! Preparando corrida...';
    case 'expired':
      return 'Nao encontramos motorista disponivel. Tente novamente.';
    case 'cancelled':
      return 'Corrida cancelada.';
    default:
      return '';
  }
}