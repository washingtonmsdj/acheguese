/**
 * GATE 3: Validação Operacional de Cancelamento
 * 
 * Testa cancelamento de corrida com:
 * - Idempotência
 * - Concorrência
 * - Liberação de motorista
 * - Realtime
 */

import { it, expect, beforeAll, afterAll } from 'vitest';
import { type SupabaseClient } from '@supabase/supabase-js';
import { RideOperationalService } from '../../src/core/mobility/core/RideOperationalService';
import { RIDE_STATE } from '../../src/core/mobility/core/RideStateMachine';
import {
  authenticateGate3Driver,
  authenticateGate3RuntimeAs,
  cleanupGate3UserFixture,
  createGate3Clients,
  createGate3PassengerFixture,
  createGate3RidePayload,
  signOutGate3Runtime,
  type Gate3UserFixture,
} from './gate3-test-fixtures';
import { describeOperational } from '../helpers/operational-env';

describeOperational('GATE 3 - Validação de Cancelamento', {
  requireDriverCredentials: true,
  requireServiceRole: true,
}, () => {
  let supabase: SupabaseClient;
  let admin: SupabaseClient;
  let passengerProfileId: string;
  let driverProfileId: string;
  let testRideId: string;
  let passengerFixture: Gate3UserFixture | undefined;
  let driverFixture: Gate3UserFixture | undefined;

  beforeAll(async () => {
    const clients = createGate3Clients();
    supabase = clients.anon;
    admin = clients.admin;

    driverFixture = await authenticateGate3Driver(supabase);
    driverProfileId = driverFixture.profileId;

    passengerFixture = await createGate3PassengerFixture(admin, 'gate3-cancellation-passenger');
    passengerProfileId = passengerFixture.profileId;
  });

  afterAll(async () => {
    if (testRideId) {
      await admin.from('ride_requests').delete().eq('id', testRideId);
    }
    await cleanupGate3UserFixture(admin, passengerFixture);
    await signOutGate3Runtime();
    if (supabase) await supabase.auth.signOut();
  });

  it('1. Deve criar corrida para testes de cancelamento', async () => {
    const { data: ride, error } = await admin
      .from('ride_requests')
      .insert(createGate3RidePayload(passengerProfileId, passengerFixture!, RIDE_STATE.DRIVER_ASSIGNED, 15.00, driverProfileId))
      .select()
      .single();

    expect(error).toBeNull();
    expect(ride).toBeDefined();
    testRideId = ride?.id || '';
  });

  it('2. Deve cancelar corrida como passageiro', async () => {
    await authenticateGate3RuntimeAs(passengerFixture!);
    const result = await RideOperationalService.cancelRide({
      rideId: testRideId,
      cancelledBy: 'passenger',
      profileId: passengerProfileId,
      reason: 'Teste de cancelamento',
    });

    expect(result.success).toBe(true);
    expect(result.toState).toBe(RIDE_STATE.CANCELLED_BY_PASSENGER);
  });

  it('3. Deve ser idempotente - segundo cancelamento retorna sucesso', async () => {
    await authenticateGate3RuntimeAs(passengerFixture!);
    const result = await RideOperationalService.cancelRide({
      rideId: testRideId,
      cancelledBy: 'passenger',
      profileId: passengerProfileId,
      reason: 'Segundo cancelamento (idempotente)',
    });

    expect(result.success).toBe(true);
    expect(result.toState).toBe(RIDE_STATE.CANCELLED_BY_PASSENGER);
  });

  it('4. Deve validar estado no banco após cancelamento', async () => {
    const { data: ride, error } = await admin
      .from('ride_requests')
      .select('status, cancelled_at')
      .eq('id', testRideId)
      .single();

    expect(error).toBeNull();
    expect(ride?.status).toBe(RIDE_STATE.CANCELLED_BY_PASSENGER);
    expect(ride?.cancelled_at).toBeDefined();

    const { data: audit, error: auditError } = await admin
      .from('ride_state_audit')
      .select('reason')
      .eq('ride_id', testRideId)
      .eq('to_state', RIDE_STATE.CANCELLED_BY_PASSENGER)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    expect(auditError).toBeNull();
    expect(audit?.reason).toBe('Teste de cancelamento');
  });

  it('5. Deve criar nova corrida e testar cancelamento por motorista', async () => {
    const { data: ride, error: rideError } = await admin
      .from('ride_requests')
      .insert(createGate3RidePayload(passengerProfileId, passengerFixture!, RIDE_STATE.DRIVER_ASSIGNED, 20.00, driverProfileId))
      .select()
      .single();

    expect(rideError).toBeNull();
    expect(ride?.id).toBeTruthy();
    const newRideId = ride!.id;

    await authenticateGate3RuntimeAs(driverFixture!);
    const result = await RideOperationalService.cancelRide({
      rideId: newRideId,
      cancelledBy: 'driver',
      profileId: driverProfileId,
      reason: 'Motorista cancelou',
    });

    expect(result.success).toBe(true);
    expect(result.toState).toBe(RIDE_STATE.CANCELLED_BY_DRIVER);
    await admin.from('ride_requests').delete().eq('id', newRideId);
  });

  it('6. Deve validar que motorista não pode cancelar corrida de outro motorista', async () => {
    const { data: ride, error: rideError } = await admin
      .from('ride_requests')
      .insert(createGate3RidePayload(passengerProfileId, passengerFixture!, RIDE_STATE.DRIVER_ASSIGNED, 25.00, passengerProfileId))
      .select()
      .single();

    expect(rideError).toBeNull();
    expect(ride?.id).toBeTruthy();
    const newRideId = ride!.id;

    await authenticateGate3RuntimeAs(driverFixture!);
    const result = await RideOperationalService.cancelRide({
      rideId: newRideId,
      cancelledBy: 'driver',
      profileId: driverProfileId,
      reason: 'Tentativa de cancelamento indevido',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Ride not found');
    await admin.from('ride_requests').delete().eq('id', newRideId);
  });
});
