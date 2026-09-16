/**
 * GATE 6 - BLOCO A: RUNTIME REAL COM MOTORISTAS DISPONÍVEIS
 * 
 * Valida fluxo automático REAL do ambiente remoto:
 * - Motoristas disponíveis ANTES de criar corrida
 * - Auto-dispatch via edge function atribui motorista
 * - Validação de auditoria completa
 * - Polling determinístico (sem sleeps cegos)
 * 
 * Este bloco CONTA para fechamento do Gate 6.
 */

import { it, expect, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RideOperationalService } from '@/core/mobility/core/RideOperationalService';
import { RideDispatchService } from '@/core/mobility/core/RideDispatchService';
import { DriverAvailabilityService } from '@/core/mobility/services/DriverAvailabilityService';
import { RIDE_STATUS } from '@/core/mobility/constants';
import { authenticateAsProfile, signOut } from '../helpers/auth-helper';
import {
  waitForRideStatus,
  getRideAuditTrail,
  waitForDriverStatus,
} from '../helpers/gate6-polling-helpers';
import {
  setupDriverAvailable,
  cleanupMultipleDrivers,
} from '../helpers/gate6-setup-helpers';
import {
  safeCleanupRides,
  safeCleanupVerifications,
} from '../helpers/test-cleanup-helpers';
import { createOperationalAdminClient, describeOperational } from '../helpers/operational-env';
import {
  cleanupMobilityRideQuoteFixtures,
  createMobilityRideQuoteFixture,
} from '../helpers/mobility-price-quote-fixtures';

const fixturesPath = join(__dirname, '../fixtures/gate6-fixtures.json');
const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

let supabaseAdmin: SupabaseClient;
describeOperational('Gate 6 - Bloco A: Runtime Real COM Motoristas', {
  requireServiceRole: true,
}, () => {
  const passengerId = fixtures.passengers.passengerA.id;
  const driverId = fixtures.drivers.driverA.id;
  const createdRideIds: string[] = [];
  const pricingRuleIds: string[] = [];
  const pickupLat = fixtures.coords.pickup.lat;
  const pickupLng = fixtures.coords.pickup.lng;
  const dropoffLat = fixtures.coords.dropoff.lat;
  const dropoffLng = fixtures.coords.dropoff.lng;
  const driverLat = fixtures.drivers.driverA.lat;
  const driverLng = fixtures.drivers.driverA.lng;
  const pickupAddressId = fixtures.addressIds.pickup;
  const dropoffAddressId = fixtures.addressIds.dropoff;
  const pickupLocationId = fixtures.locationIds.primary;
  const dropoffLocationId = fixtures.locationIds.primary;

  async function issueRideQuote(): Promise<string> {
    const fixture = await createMobilityRideQuoteFixture(supabaseAdmin, {
      passengerProfileId: passengerId,
      pickupAddressId,
      dropoffAddressId,
      pickupLocationId,
      dropoffLocationId,
      originLat: pickupLat,
      originLng: pickupLng,
      destinationLat: dropoffLat,
      destinationLng: dropoffLng,
    });
    pricingRuleIds.push(fixture.ruleId);
    return fixture.quoteId;
  }

  beforeEach(async () => {
    supabaseAdmin = createOperationalAdminClient();
    createdRideIds.length = 0;
    pricingRuleIds.length = 0;

    await supabaseAdmin.from('driver_availability').delete().eq('profile_id', driverId);

    const { data: staleRides } = await supabaseAdmin
      .from('ride_requests')
      .select('id')
      .eq('passenger_profile_id', passengerId);
    const staleRideIds = (staleRides ?? []).map((ride) => ride.id);
    if (staleRideIds.length > 0) {
      await safeCleanupRides(staleRideIds, 20000);
      await safeCleanupVerifications(staleRideIds);
    }
  });

  afterEach(async () => {
    if (createdRideIds.length > 0) {
      await safeCleanupRides(createdRideIds, 20000);
      await safeCleanupVerifications(createdRideIds);
    }
    await cleanupMobilityRideQuoteFixtures(supabaseAdmin, pricingRuleIds);
    await cleanupMultipleDrivers([driverId]);
    await signOut();
  });

  it('A.1. Fluxo completo: motorista disponível → auto-dispatch → aceitar → completar', { timeout: 90000 }, async () => {
    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setupResult.success) {
      throw new Error(`Setup de motorista falhou: ${setupResult.error}`);
    }
    console.log('✅ Motorista disponível validado:', setupResult.state);

    await authenticateAsProfile(passengerId);
    const priceQuoteId = await issueRideQuote();
    const createResult = await RideOperationalService.createRide({ priceQuoteId });

    expect(createResult.success).toBe(true);
    expect(createResult.rideId).toBeDefined();
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);
    console.log('✅ Corrida criada:', rideId);

    const dispatchResult = await waitForRideStatus(
      rideId,
      [RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.DRIVER_ACCEPTED],
      10000,
    );
    if (!dispatchResult.success) {
      throw new Error(`Auto-dispatch falhou: ${dispatchResult.error}`);
    }
    console.log(`✅ Auto-dispatch completou em ${dispatchResult.elapsedMs}ms. Status: ${dispatchResult.currentStatus}`);

    const { data: rideAfterDispatch } = await supabaseAdmin
      .from('ride_requests')
      .select('driver_profile_id')
      .eq('id', rideId)
      .single();
    expect(rideAfterDispatch.driver_profile_id).toBe(driverId);

    const auditTrail = await getRideAuditTrail(rideId);
    expect(auditTrail.length).toBeGreaterThanOrEqual(2);
    const requestedTransition = auditTrail.find(t => t.to_state === 'requested');
    expect(requestedTransition).toBeDefined();
    expect(requestedTransition!.changed_by).toBe(passengerId);
    const searchingTransition = auditTrail.find(t => t.to_state === 'searching_driver');
    expect(searchingTransition).toBeDefined();
    expect(searchingTransition!.changed_by).toBe('system');
    const assignedTransition = auditTrail.find(t => t.to_state === 'driver_assigned');
    expect(assignedTransition).toBeDefined();
    expect(assignedTransition!.changed_by).toBe('system');
    expect(assignedTransition!.reason).toBeTruthy();

    await authenticateAsProfile(driverId);
    const acceptResult = await RideDispatchService.acceptRide(rideId, driverId);
    expect(acceptResult.success).toBe(true);
    const acceptedResult = await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);
    expect(acceptedResult.success).toBe(true);

    const driverStatus = await DriverAvailabilityService.getStatus(driverId);
    expect(driverStatus).toBeDefined();
    expect(driverStatus!.status).toBe('busy');
    expect(driverStatus!.activeRideId).toBe(rideId);

    const arrivingResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.DRIVER_ARRIVING,
      driverId,
      'Driver is on the way',
    );
    expect(arrivingResult.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ARRIVING], 5000);

    const boardedResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.PASSENGER_BOARDED,
      driverId,
      'Passenger boarded',
    );
    expect(boardedResult.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.PASSENGER_BOARDED], 5000);

    const progressResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.IN_PROGRESS,
      driverId,
      'Ride started',
    );
    expect(progressResult.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.IN_PROGRESS], 5000);

    const statusDuringRide = await DriverAvailabilityService.getStatus(driverId);
    expect(statusDuringRide!.status).toBe('busy');
    expect(statusDuringRide!.activeRideId).toBe(rideId);

    const completeResult = await RideOperationalService.completeRide(rideId, driverId);
    expect(completeResult.success).toBe(true);
    const completedResult = await waitForRideStatus(rideId, [RIDE_STATUS.COMPLETED], 5000);
    expect(completedResult.success).toBe(true);

    const finalStatus = await DriverAvailabilityService.getStatus(driverId);
    expect(finalStatus).toBeDefined();
    expect(finalStatus!.status).toBe('online_available');
    expect(finalStatus!.isAvailable).toBe(true);
    expect(finalStatus!.activeRideId).toBeUndefined();

    const finalAuditTrail = await getRideAuditTrail(rideId);
    const expectedStates = [
      'requested',
      'searching_driver',
      'driver_assigned',
      'driver_accepted',
      'driver_arriving',
      'passenger_boarded',
      'in_progress',
      'completed',
    ];
    const actualStates = finalAuditTrail.map(t => t.to_state);
    expectedStates.forEach(state => expect(actualStates).toContain(state));
  });

  it('A.2. Cancelamento após aceite libera motorista', { timeout: 90000 }, async () => {
    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setupResult.success) {
      throw new Error(`Setup falhou: ${setupResult.error}`);
    }

    await authenticateAsProfile(passengerId);
    const priceQuoteId = await issueRideQuote();
    const createResult = await RideOperationalService.createRide({ priceQuoteId });

    expect(createResult.success).toBe(true);
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);

    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ASSIGNED], 10000);

    await authenticateAsProfile(driverId);
    await RideDispatchService.acceptRide(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);

    const statusBeforeCancel = await DriverAvailabilityService.getStatus(driverId);
    expect(statusBeforeCancel!.status).toBe('busy');
    expect(statusBeforeCancel!.activeRideId).toBe(rideId);

    await authenticateAsProfile(passengerId);
    const cancelResult = await RideOperationalService.cancelRide({
      rideId,
      cancelledBy: 'passenger',
      profileId: passengerId,
      reason: 'Changed my mind',
    });
    expect(cancelResult.success).toBe(true);

    await waitForRideStatus(rideId, [RIDE_STATUS.CANCELLED_BY_PASSENGER], 5000);
    const driverReleaseResult = await waitForDriverStatus(driverId, 'online_available', 10000);
    if (!driverReleaseResult.success) {
      throw new Error(`Motorista não foi liberado: ${driverReleaseResult.error}`);
    }

    const statusAfterCancel = await DriverAvailabilityService.getStatus(driverId);
    expect(statusAfterCancel).toBeDefined();
    expect(statusAfterCancel!.status).toBe('online_available');
    expect(statusAfterCancel!.isAvailable).toBe(true);
    expect(statusAfterCancel!.activeRideId).toBeUndefined();
  });
});
