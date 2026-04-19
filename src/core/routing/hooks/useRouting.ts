/**
 * useRouting - Hook para consumir RoutingService
 * 
 * Hook React para cálculo de rotas, ETA e distâncias.
 * Abstrai service e fornece interface reativa.
 * 
 * @module core/routing/hooks
 */
import { logger } from '@/shared/utils/logger';
import { useState, useCallback } from 'react';
import type {
  RouteRequest,
  RouteResponse,
  ETARequest,
  ETAResponse,
  TransportProfile,
} from '../types';
import type { Coordinates } from '@/core/maps/types';
import { routingService } from '../instance';
interface UseRoutingState {
  loading: boolean;
  error: string | null;
}

interface UseRoutingResult {
  calculateRoute: (request: RouteRequest) => Promise<RouteResponse | null>;
  calculateETA: (request: ETARequest) => Promise<ETAResponse | null>;
  calculateSimpleETA: (
    origin: Coordinates,
    destination: Coordinates,
    profile?: TransportProfile
  ) => Promise<ETAResponse | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook para consumir RoutingService
 * 
 * @example
 * ```tsx
 * const { calculateETA, loading, error } = useRouting();
 * 
 * const handleCalculate = async () => {
 *   const eta = await calculateSimpleETA(origin, destination, 'car');
 *   logger.debug(eta?.durationSeconds);
 * };
 * ```
 */
export function useRouting(): UseRoutingResult {
  const [state, setState] = useState<UseRoutingState>({
    loading: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const calculateRoute = useCallback(
    async (request: RouteRequest): Promise<RouteResponse | null> => {
      setState({ loading: true, error: null });

      try {
        const response = await routingService.calculateRoute(request);
        setState({ loading: false, error: null });
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro ao calcular rota';
        setState({ loading: false, error: errorMessage });
        return null;
      }
    },
    []
  );

  const calculateETA = useCallback(
    async (request: ETARequest): Promise<ETAResponse | null> => {
      setState({ loading: true, error: null });

      try {
        const response = await routingService.calculateETA(request);
        setState({ loading: false, error: null });
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro ao calcular ETA';
        setState({ loading: false, error: errorMessage });
        return null;
      }
    },
    []
  );

  const calculateSimpleETA = useCallback(
    async (
      origin: Coordinates,
      destination: Coordinates,
      profile?: TransportProfile
    ): Promise<ETAResponse | null> => {
      setState({ loading: true, error: null });

      try {
        const response = await routingService.calculateSimpleETA(
          origin,
          destination,
          profile
        );
        setState({ loading: false, error: null });
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro ao calcular ETA';
        setState({ loading: false, error: errorMessage });
        return null;
      }
    },
    []
  );

  return {
    calculateRoute,
    calculateETA,
    calculateSimpleETA,
    loading: state.loading,
    error: state.error,
    clearError,
  };
}
