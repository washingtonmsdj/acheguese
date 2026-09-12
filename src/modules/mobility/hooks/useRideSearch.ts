/**
 * useRideSearch - Hook para passageiros acompanharem busca de motorista
 *
 * Monitora o progresso da busca em tempo real e notifica quando
 * motorista e encontrado, aceita ou corrida expira.
 */
import { logger } from '@/shared/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isCancelledRideStatus,
  isDriverOwnedOpenRideStatus,
  isPreAcceptRideStatus,
} from '@/core/mobility/core/RideLifecycleStatus';
import { RIDE_STATE } from '@/core/mobility/core/RideStateMachine';
import { getRideById } from '@/core/mobility/services/mobility.queries';
import { useRideRealtime } from './useRideRealtime';

export interface RideSearchStatus {
  rideId: string;
  rideState?: string;
  status:
    | 'searching'
    | 'driver_found'
    | 'driver_accepted'
    | 'in_progress'
    | 'completed'
    | 'expired'
    | 'cancelled'
    | 'failed';
  driverProfileId?: string;
  message: string;
  timestamp: string;
}

interface UseRideSearchOptions {
  rideId?: string;
  enabled?: boolean;
  onStatusChange?: (status: RideSearchStatus) => void;
}

type SearchStatusInput = Pick<RideSearchStatus, 'status'> & {
  message?: string;
};

function classifyRideSearchStatus(status: string | null | undefined): SearchStatusInput | null {
  if (!status) return null;

  if (status === RIDE_STATE.COMPLETED) {
    return { status: 'completed', message: 'Corrida concluida.' };
  }

  if (status === RIDE_STATE.EXPIRED) {
    return { status: 'expired' };
  }

  if (status === RIDE_STATE.FAILED) {
    return { status: 'failed', message: 'Corrida encerrada por falha.' };
  }

  if (isCancelledRideStatus(status)) {
    return { status: 'cancelled' };
  }

  // Atribuicao e apenas uma oferta: o motorista ainda nao e participante aceito.
  if (status === RIDE_STATE.DRIVER_ASSIGNED) {
    return { status: 'driver_found' };
  }

  // Qualquer estado operacional apos aceite encerra a tela de busca.
  if (isDriverOwnedOpenRideStatus(status)) {
    if (status === RIDE_STATE.IN_PROGRESS || status === RIDE_STATE.PASSENGER_BOARDED) {
      return { status: 'in_progress', message: 'Corrida iniciada.' };
    }
    return { status: 'driver_accepted' };
  }

  if (isPreAcceptRideStatus(status)) {
    return { status: 'searching' };
  }

  return null;
}

export function useRideSearch(options: UseRideSearchOptions) {
  const { rideId, enabled = true, onStatusChange } = options;

  const [searchStatus, setSearchStatus] = useState<RideSearchStatus | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const updateStatus = useCallback((
    status: RideSearchStatus['status'],
    driverProfileId?: string,
    message?: string,
    rideState?: string,
  ) => {
    const newStatus: RideSearchStatus = {
      rideId: rideId || '',
      rideState,
      status,
      driverProfileId,
      message: message || getDefaultMessage(status),
      timestamp: new Date().toISOString(),
    };

    setSearchStatus(newStatus);
    setIsSearching(status === 'searching' || status === 'driver_found');
    onStatusChangeRef.current?.(newStatus);

    logger.info('Ride search status updated', newStatus);
  }, [rideId]);

  const updateFromRideState = useCallback((
    rideState: string | null | undefined,
    driverProfileId?: string,
  ) => {
    const next = classifyRideSearchStatus(rideState);
    if (!next) return;
    updateStatus(next.status, driverProfileId, next.message, rideState ?? undefined);
  }, [updateStatus]);

  useRideRealtime({
    rideId,
    userType: 'passenger',
    enabled: enabled && !!rideId,
    onEvent: (event) => {
      updateFromRideState(event.newState, event.driverProfileId);
    },
  });

  useEffect(() => {
    if (!enabled || !rideId) return;

    let isCurrent = true;

    const loadInitialStatus = async () => {
      try {
        const ride = await getRideById(rideId);
        if (!isCurrent) return;
        if (!ride) {
          logger.warn('Failed to load ride status', { rideId });
          return;
        }

        updateFromRideState(ride.status, ride.driver_profile_id);
      } catch (err) {
        if (isCurrent) {
          logger.error('Error loading ride status', err as Error);
        }
      }
    };

    void loadInitialStatus();

    return () => {
      isCurrent = false;
    };
  }, [enabled, rideId, updateFromRideState]);

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
    case 'in_progress':
      return 'Corrida iniciada.';
    case 'completed':
      return 'Corrida concluida.';
    case 'expired':
      return 'Nao encontramos motorista disponivel. Tente novamente.';
    case 'cancelled':
      return 'Corrida cancelada.';
    case 'failed':
      return 'Corrida encerrada por falha.';
    default:
      return '';
  }
}
