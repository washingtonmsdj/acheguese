/**
 * Hook para operações de corrida via motor operacional
 */

import { useState } from "react";
import { RideOperationalService } from "@/core/mobility/core/RideOperationalService";
import type { CreateRideInput } from "@/core/mobility/core/RideOperationalService";
import { RIDE_STATE, type RideState } from "@/core/mobility/core/RideStateMachine";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";

export function useRideOperations() {
  const [loading, setLoading] = useState(false);

  const createRide = async (input: CreateRideInput) => {
    setLoading(true);
    try {
      const result = await RideOperationalService.createRide(input);
      
      if (!result.success) {
        toast.error(result.error || 'Erro ao criar corrida');
        return null;
      }

      toast.success('Corrida criada! Buscando motorista...');
      return result.rideId;
    } catch (error) {
      logger.error('useRideOperations.createRide', error as Error);
      toast.error('Erro ao criar corrida');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const acceptRide = async (rideId: string, driverProfileId: string) => {
    setLoading(true);
    try {
      const result = await RideOperationalService.acceptRide(rideId, driverProfileId);
      
      if (!result.success) {
        if (result.error?.includes('already')) {
          toast.error('Corrida já foi aceita por outro motorista');
        } else if (result.error?.includes('expired')) {
          toast.error('Corrida expirou');
        } else if (result.error?.includes('busy')) {
          toast.error('Você já tem uma corrida ativa');
        } else {
          toast.error(result.error || 'Erro ao aceitar corrida');
        }
        return false;
      }

      toast.success('Corrida aceita!');
      return true;
    } catch (error) {
      logger.error('useRideOperations.acceptRide', error as Error);
      toast.error('Erro ao aceitar corrida');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const startRide = async (rideId: string, driverProfileId: string) => {
    setLoading(true);
    try {
      const result = await RideOperationalService.transitionTo(
        rideId,
        RIDE_STATE.IN_PROGRESS,
        driverProfileId,
        'Driver started ride'
      );
      
      if (!result.success) {
        toast.error(result.error || 'Erro ao iniciar corrida');
        return false;
      }

      toast.success('Corrida iniciada!');
      return true;
    } catch (error) {
      logger.error('useRideOperations.startRide', error as Error);
      toast.error('Erro ao iniciar corrida');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completeRide = async (
    rideId: string,
    driverProfileId: string,
    finalPrice?: number
  ) => {
    setLoading(true);
    try {
      const result = await RideOperationalService.completeRide(
        rideId,
        driverProfileId,
        finalPrice
      );
      
      if (!result.success) {
        toast.error(result.error || 'Erro ao completar corrida');
        return false;
      }

      toast.success('Corrida completada!');
      return true;
    } catch (error) {
      logger.error('useRideOperations.completeRide', error as Error);
      toast.error('Erro ao completar corrida');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async (
    rideId: string,
    cancelledBy: 'passenger' | 'driver',
    profileId: string,
    reason?: string
  ) => {
    setLoading(true);
    try {
      const result = await RideOperationalService.cancelRide({
        rideId,
        cancelledBy,
        profileId,
        reason,
      });
      
      if (!result.success) {
        toast.error(result.error || 'Erro ao cancelar corrida');
        return false;
      }

      toast.success('Corrida cancelada');
      return true;
    } catch (error) {
      logger.error('useRideOperations.cancelRide', error as Error);
      toast.error('Erro ao cancelar corrida');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const transitionTo = async (
    rideId: string,
    toState: RideState,
    actor: string,
    reason?: string
  ) => {
    setLoading(true);
    try {
      const result = await RideOperationalService.transitionTo(
        rideId,
        toState,
        actor,
        reason
      );
      
      if (!result.success) {
        toast.error(result.error || 'Erro ao atualizar corrida');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('useRideOperations.transitionTo', error as Error);
      toast.error('Erro ao atualizar corrida');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createRide,
    acceptRide,
    startRide,
    completeRide,
    cancelRide,
    transitionTo,
  };
}
