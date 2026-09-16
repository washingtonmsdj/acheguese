/**
 * GATE 7 - PIN VERIFICATION: CORRIDA (RIDE)
 *
 * Runtime real em alvo operacional isolado. A criação usa quote server-owned
 * single-use; este gate valida PIN/lifecycle, não política comercial.
 */

import { it, expect, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RideOperationalService } from '@/core/mobility/core/RideOperationalService';
import { RideDispatchService } from '@/core/mobility/core/RideDispatchService';
import { OperationalVerificationService } from '@/core/mobility/services/OperationalVerificationService';
import { RIDE_STATUS } from '@/core/mobility/constants';
import { authenticateAsProfile, signOut } from '../helpers/auth-helper';
import { waitForRideStatus, getRideAuditTrail } from '../helpers/gate6-polling-helpers';
import { setupDriverAvailable, cleanupMultipleDrivers } from '../helpers/gate6-setup-helpers';
import { safeCleanupRides, safeCleanupVerifications } from '../helpers/test-cleanup-helpers';
import { createOperationalAdminClient, describeOperational } from '../helpers/operational-env';
import {
  cleanupMobilityRideQuoteFixtures,
  createMobilityRideQuoteFixture,
} from '../helpers/mobility-price-quote-fixtures';

const fixturesPath = join(__dirname, '../fixtures/gate6-fixtures.json');
const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

let supabaseAdmin: SupabaseClient;

describeOperational('Gate 7 - PIN Verification: Corrida', {
  requireServiceRole: true,
}, () => {
  const passengerId = fixtures.passengers.passengerA.id;
  const driverId = fixtures.drivers.driverA.id;
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
  const createdRideIds: string[] = [];
  const pricingRuleIds: string[] = [];

  async function createTestRide() {
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
    return RideOperationalService.createRide({ priceQuoteId: fixture.quoteId });
  }

  async function setupAcceptedArrivingRide(requirePin: boolean) {
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_rides: requirePin })
      .eq('id', passengerId);

    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setupResult.success) throw new Error(`Setup falhou: ${setupResult.error}`);

    await authenticateAsProfile(passengerId);
    const createResult = await createTestRide();
    expect(createResult.success).toBe(true);
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);

    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ASSIGNED], 10000);
    await authenticateAsProfile(driverId);
    const acceptResult = await RideDispatchService.acceptRide(rideId, driverId);
    expect(acceptResult.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);

    const arriving = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.DRIVER_ARRIVING,
      driverId,
    );
    expect(arriving.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ARRIVING], 5000);
    return rideId;
  }

  beforeEach(async () => {
    supabaseAdmin = createOperationalAdminClient();
    createdRideIds.length = 0;
    pricingRuleIds.length = 0;

    await supabaseAdmin
      .from('profiles')
      .update({
        requires_pin_for_rides: false,
        requires_pin_for_deliveries: false,
      })
      .in('id', [passengerId, driverId]);

    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: staleRides } = await supabaseAdmin
      .from('ride_requests')
      .select('id')
      .eq('passenger_profile_id', passengerId);
    const staleRideIds = (staleRides ?? []).map((ride) => ride.id);
    if (staleRideIds.length > 0) {
      await safeCleanupRides(staleRideIds, 20000);
      await safeCleanupVerifications(staleRideIds);
    }

    await supabaseAdmin.from('driver_availability').delete().eq('profile_id', driverId);
  }, 30000);

  afterEach(async () => {
    await supabaseAdmin
      .from('profiles')
      .update({
        requires_pin_for_rides: false,
        requires_pin_for_deliveries: false,
      })
      .in('id', [passengerId, driverId]);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (createdRideIds.length > 0) {
      await safeCleanupRides(createdRideIds, 20000);
      await safeCleanupVerifications(createdRideIds);
    }

    await cleanupMobilityRideQuoteFixtures(supabaseAdmin, pricingRuleIds);
    await cleanupMultipleDrivers([driverId]);
    await signOut();
  }, 30000);

  it('R.1. Corrida sem PIN exigido continua fluxo normal', { timeout: 30000 }, async () => {
    const rideId = await setupAcceptedArrivingRide(false);

    const { data: verification } = await supabaseAdmin
      .from('operational_verifications')
      .select('*')
      .eq('ride_id', rideId)
      .maybeSingle();
    expect(verification).toBeNull();

    const boarded = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.PASSENGER_BOARDED,
      driverId,
    );
    expect(boarded.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.PASSENGER_BOARDED], 5000);

    const progress = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.IN_PROGRESS,
      driverId,
    );
    expect(progress.success).toBe(true);
  });

  it('R.2. Corrida com PIN exigido bloqueia embarque sem PIN', { timeout: 30000 }, async () => {
    const rideId = await setupAcceptedArrivingRide(true);

    const { data: verification } = await supabaseAdmin
      .from('operational_verifications')
      .select('*')
      .eq('ride_id', rideId)
      .single();
    expect(verification.is_required).toBe(true);
    expect(verification.required_by).toBe('passenger');
    expect(verification.status).toBe('pending');

    const boarded = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.PASSENGER_BOARDED,
      driverId,
    );
    expect(boarded.success).toBe(false);
    expect(boarded.error).toContain('PIN verification required');

    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    expect(ride.status).toBe(RIDE_STATUS.DRIVER_ARRIVING);

    const auditTrail = await getRideAuditTrail(rideId);
    expect(auditTrail.find(t => t.to_state === 'passenger_boarded')).toBeUndefined();
  });

  it('R.3. Corrida com PIN correto permite embarque', { timeout: 30000 }, async () => {
    const rideId = await setupAcceptedArrivingRide(true);

    const pinResult = await OperationalVerificationService.refreshRequesterPIN(rideId);
    expect(pinResult.success).toBe(true);
    expect(pinResult.data?.pin).toMatch(/^\d{4}$/);

    const boarded = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.PASSENGER_BOARDED,
      driverId,
      'Passenger boarded',
      pinResult.data!.pin,
    );
    expect(boarded.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.PASSENGER_BOARDED], 5000);

    const { data: verification } = await supabaseAdmin
      .from('operational_verifications')
      .select('*')
      .eq('ride_id', rideId)
      .single();
    expect(verification.status).toBe('verified');
    expect(verification.verified_at).toBeTruthy();
    expect(verification.verified_by).toBe(driverId);
    expect(verification.verification_attempts).toBe(1);
  });

  it('R.4. Corrida com PIN inválido falha e audita', { timeout: 30000 }, async () => {
    const rideId = await setupAcceptedArrivingRide(true);

    const pinResult = await OperationalVerificationService.refreshRequesterPIN(rideId);
    expect(pinResult.success).toBe(true);

    const wrongPin = pinResult.data!.pin === '9999' ? '0000' : '9999';
    const boarded = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.PASSENGER_BOARDED,
      driverId,
      'Passenger boarded',
      wrongPin,
    );
    expect(boarded.success).toBe(false);
    expect(boarded.error).toContain('Invalid PIN');

    const { data: verification } = await supabaseAdmin
      .from('operational_verifications')
      .select('*')
      .eq('ride_id', rideId)
      .single();
    expect(verification.status).toBe('pending');
    expect(verification.verification_attempts).toBe(1);
    expect(verification.last_attempt_at).toBeTruthy();

    const auditTrail = await getRideAuditTrail(rideId);
    expect(auditTrail.find(t => t.reason?.includes('PIN verification failed'))).toBeDefined();
  });
});
