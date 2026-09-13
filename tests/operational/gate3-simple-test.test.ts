/**
 * GATE 3: Teste Simples de Cancelamento
 *
 * Valida as regras puras de cancelamento sem depender de schema/runtime remoto.
 */

import { describe, it, expect } from 'vitest';
import { RideStateMachine, RIDE_STATE } from '../../src/core/mobility/core/RideStateMachine';

describe('GATE 3 - Regras de cancelamento', () => {
  it('passageiro pode cancelar em estados iniciais', () => {
    expect(RideStateMachine.canPassengerCancel(RIDE_STATE.REQUESTED)).toBe(true);
    expect(RideStateMachine.canPassengerCancel(RIDE_STATE.SEARCHING_DRIVER)).toBe(true);
    expect(RideStateMachine.canPassengerCancel(RIDE_STATE.DRIVER_ASSIGNED)).toBe(true);
    expect(RideStateMachine.canPassengerCancel(RIDE_STATE.DRIVER_ACCEPTED)).toBe(true);
    expect(RideStateMachine.canPassengerCancel(RIDE_STATE.DRIVER_ARRIVING)).toBe(true);
  });

  it('passageiro não pode cancelar após embarcar', () => {
    expect(RideStateMachine.canPassengerCancel(RIDE_STATE.PASSENGER_BOARDED)).toBe(false);
    expect(RideStateMachine.canPassengerCancel(RIDE_STATE.IN_PROGRESS)).toBe(false);
  });

  it('passageiro não pode cancelar após coleta de entrega', () => {
    expect(RideStateMachine.canPassengerCancel(RIDE_STATE.PICKUP_CONFIRMED)).toBe(false);
    expect(RideStateMachine.canPassengerCancel(RIDE_STATE.IN_DELIVERY)).toBe(false);
  });

  it('motorista pode cancelar até os estados permitidos antes da execução terminal', () => {
    expect(RideStateMachine.canDriverCancel(RIDE_STATE.DRIVER_ASSIGNED)).toBe(true);
    expect(RideStateMachine.canDriverCancel(RIDE_STATE.DRIVER_ACCEPTED)).toBe(true);
    expect(RideStateMachine.canDriverCancel(RIDE_STATE.DRIVER_ARRIVING)).toBe(true);
    expect(RideStateMachine.canDriverCancel(RIDE_STATE.PASSENGER_BOARDED)).toBe(true);
    expect(RideStateMachine.canDriverCancel(RIDE_STATE.PICKUP_CONFIRMED)).toBe(true);
  });

  it('motorista não pode cancelar durante execução de corrida ou entrega', () => {
    expect(RideStateMachine.canDriverCancel(RIDE_STATE.IN_PROGRESS)).toBe(false);
    expect(RideStateMachine.canDriverCancel(RIDE_STATE.IN_DELIVERY)).toBe(false);
  });

  it('estados finais são não canceláveis para passageiro e motorista', () => {
    const finalStates = [
      RIDE_STATE.COMPLETED,
      RIDE_STATE.CANCELLED_BY_PASSENGER,
      RIDE_STATE.CANCELLED_BY_DRIVER,
      RIDE_STATE.EXPIRED,
      RIDE_STATE.FAILED,
    ] as const;

    for (const state of finalStates) {
      expect(RideStateMachine.canPassengerCancel(state)).toBe(false);
      expect(RideStateMachine.canDriverCancel(state)).toBe(false);
    }
  });
});
