/**
 * GATE 7 - PIN VERIFICATION: ENTREGA (MOTOBOY)
 *
 * Valida no runtime operacional isolado:
 * - entrega sem PIN exigido conclui normalmente
 * - entrega com PIN exigido bloqueia confirmacao sem PIN
 * - PIN correto conclui e persiste prova
 * - PIN invalido falha e incrementa tentativas
 *
 * A criacao usa quote server-owned single-use. Nenhum preco comercial e
 * enviado pelo browser/teste.
 */

import { afterEach, beforeAll, beforeEach, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RideOperationalService } from '@/core/mobility/core/RideOperationalService';
import { RideDispatchService } from '@/core/mobility/core/RideDispatchService';
import { OperationalVerificationService } from '@/core/mobility/services/OperationalVerificationService';
import { RIDE_STATUS } from '@/core/mobility/constants';
import { authenticateAsProfile, signOut } from '../helpers/auth-helper';
import { waitForRideStatus } from '../helpers/gate6-polling-helpers';
import {
  cleanupMultipleDrivers,
  setupDriverAvailable,
} from '../helpers/gate6-setup-helpers';
import {
  safeCleanupRides,
  safeCleanupVerifications,
} from '../helpers/test-cleanup-helpers';
import {
  cleanupMobilityQuoteFixtures,
  createMobilityDeliveryQuoteFixture,
} from '../helpers/mobility-price-quote-fixtures';
import { createOperationalAdminClient, describeOperational } from '../helpers/operational-env';

const fixturesPath = join(__dirname, '../fixtures/gate6-fixtures.json');
const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

let supabaseAdmin: SupabaseClient;

describeOperational('Gate 7 - PIN Verification: Entrega', {
  requireServiceRole: true,
}, () => {
  const requesterId = fixtures.passengers.passengerC?.id || fixtures.passengers.passengerB.id;
  const driverCandidates = [
    fixtures.drivers.driverC,
    fixtures.drivers.driverB,
    fixtures.drivers.driverA,
  ].filter(Boolean) as Array<{ id: string; lat: number; lng: number }>;

  let driverId = fixtures.drivers.driverB.id;
  let driverLat = fixtures.drivers.driverB.lat;
  let driverLng = fixtures.drivers.driverB.lng;

  const createdRideIds: string[] = [];
  const pricingRuleIds: string[] = [];

  const pickupLat = fixtures.coords.pickup.lat;
  const pickupLng = fixtures.coords.pickup.lng;
  const dropoffLat = fixtures.coords.dropoff.lat;
  const dropoffLng = fixtures.coords.dropoff.lng;
  const pickupAddressId = fixtures.addressIds.pickup;
  const dropoffAddressId = fixtures.addressIds.dropoff;
  const pickupLocationId = fixtures.locationIds.primary;
  const dropoffLocationId = fixtures.locationIds.primary;

  async function issueDeliveryQuote() {
    const fixture = await createMobilityDeliveryQuoteFixture(supabaseAdmin, {
      passengerProfileId: requesterId,
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
    return fixture;
  }

  async function createDelivery(input: {
    recipientName: string;
    packageDescription: string;
    packageSize: 'small' | 'medium' | 'large';
    recipientPhone?: string;
  }) {
    const quote = await issueDeliveryQuote();
    const result = await RideOperationalService.createDelivery({
      priceQuoteId: quote.quoteId,
      sourceType: 'passenger',
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      packageDescription: input.packageDescription,
      packageSize: input.packageSize,
    });

    expect(result.success, result.error).toBe(true);
    expect(result.rideId).toBeDefined();
    const rideId = result.rideId!;
    createdRideIds.push(rideId);
    return rideId;
  }

  async function moveToInDelivery(rideId: string) {
    const dispatch = await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ASSIGNED], 10_000);
    expect(dispatch.success, dispatch.error).toBe(true);

    await authenticateAsProfile(driverId);
    const accepted = await RideDispatchService.acceptRide(rideId, driverId);
    expect(accepted.success, accepted.error).toBe(true);
    expect((await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5_000)).success).toBe(true);

    const arriving = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.DRIVER_ARRIVING,
      driverId,
    );
    expect(arriving.success, arriving.error).toBe(true);
    expect((await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ARRIVING], 5_000)).success).toBe(true);

    const pickup = await RideOperationalService.confirmPickup(rideId, driverId);
    expect(pickup.success, pickup.error).toBe(true);
    expect((await waitForRideStatus(rideId, [RIDE_STATUS.PICKUP_CONFIRMED], 5_000)).success).toBe(true);

    const started = await RideOperationalService.startDelivery(rideId, driverId);
    expect(started.success, started.error).toBe(true);
    expect((await waitForRideStatus(rideId, [RIDE_STATUS.IN_DELIVERY], 5_000)).success).toBe(true);
  }

  beforeAll(async () => {
    supabaseAdmin = createOperationalAdminClient();

    for (const candidate of driverCandidates) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, profile_type')
        .eq('id', candidate.id)
        .maybeSingle();
      if (!profile || profile.profile_type !== 'driver') continue;

      const { data: driverData } = await supabaseAdmin
        .from('driver_data')
        .select('can_do_delivery')
        .eq('profile_id', candidate.id)
        .maybeSingle();
      if (driverData?.can_do_delivery === false) continue;

      driverId = candidate.id;
      driverLat = candidate.lat;
      driverLng = candidate.lng;
      break;
    }
  });

  beforeEach(async () => {
    createdRideIds.length = 0;
    pricingRuleIds.length = 0;

    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_rides: false, requires_pin_for_deliveries: false })
      .in('id', [requesterId, driverId]);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { data: staleRides } = await supabaseAdmin
      .from('ride_requests')
      .select('id')
      .eq('passenger_profile_id', requesterId);
    const staleRideIds = (staleRides ?? []).map((ride) => ride.id);
    if (staleRideIds.length > 0) {
      await safeCleanupRides(staleRideIds, 20_000);
      await safeCleanupVerifications(staleRideIds);
    }

    await supabaseAdmin.from('driver_availability').delete().eq('profile_id', driverId);
  }, 30_000);

  afterEach(async () => {
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_rides: false, requires_pin_for_deliveries: false })
      .in('id', [requesterId, driverId]);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (createdRideIds.length > 0) {
      await safeCleanupRides(createdRideIds, 15_000);
      await safeCleanupVerifications(createdRideIds);
    }

    await cleanupMobilityQuoteFixtures(supabaseAdmin, pricingRuleIds);
    await cleanupMultipleDrivers([driverId]);
    await signOut();
  }, 30_000);

  it('D.1. entrega sem PIN exigido conclui normalmente', { timeout: 60_000 }, async () => {
    const setup = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setup.success) throw new Error(`Setup falhou: ${setup.error}`);

    await authenticateAsProfile(requesterId);
    const rideId = await createDelivery({
      recipientName: 'Joao Silva',
      recipientPhone: '11999999999',
      packageDescription: 'Documentos',
      packageSize: 'small',
    });

    const { data: verification } = await supabaseAdmin
      .from('operational_verifications')
      .select('id')
      .eq('ride_id', rideId)
      .maybeSingle();
    expect(verification).toBeNull();

    await moveToInDelivery(rideId);

    const proof = {
      photo_url: 'https://example.com/proof.jpg',
      code: '1234',
      observation: 'Entregue ao porteiro',
    };
    const confirmed = await RideOperationalService.confirmDelivery(rideId, driverId, proof);
    expect(confirmed.success, confirmed.error).toBe(true);
    expect((await waitForRideStatus(rideId, [RIDE_STATUS.COMPLETED], 5_000)).success).toBe(true);

    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .select('proof_of_delivery, final_price, suggested_price')
      .eq('id', rideId)
      .single();
    expect(ride.proof_of_delivery?.photo_url).toBe(proof.photo_url);
    expect(Number(ride.final_price)).toBe(Number(ride.suggested_price));
  });

  it('D.2. entrega com PIN exigido bloqueia confirmacao sem PIN', { timeout: 60_000 }, async () => {
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_deliveries: true })
      .eq('id', requesterId);

    const setup = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setup.success) throw new Error(`Setup falhou: ${setup.error}`);

    await authenticateAsProfile(requesterId);
    const rideId = await createDelivery({
      recipientName: 'Maria Santos',
      packageDescription: 'Eletronicos',
      packageSize: 'medium',
    });

    const { data: verification } = await supabaseAdmin
      .from('operational_verifications')
      .select('is_required, required_by, status')
      .eq('ride_id', rideId)
      .single();
    expect(verification.is_required).toBe(true);
    expect(verification.required_by).toBe('sender');
    expect(verification.status).toBe('pending');

    await moveToInDelivery(rideId);

    const confirmed = await RideOperationalService.confirmDelivery(rideId, driverId, {
      photo_url: 'https://example.com/proof.jpg',
      code: '1234',
    });
    expect(confirmed.success).toBe(false);
    expect(confirmed.error).toContain('PIN required');

    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    expect(ride.status).toBe(RIDE_STATUS.IN_DELIVERY);
  });

  it('D.3. PIN correto conclui e persiste prova', { timeout: 60_000 }, async () => {
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_deliveries: true })
      .eq('id', requesterId);

    const setup = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setup.success) throw new Error(`Setup falhou: ${setup.error}`);

    await authenticateAsProfile(requesterId);
    const rideId = await createDelivery({
      recipientName: 'Pedro Costa',
      packageDescription: 'Roupas',
      packageSize: 'large',
    });

    const pinResult = await OperationalVerificationService.refreshRequesterPIN(rideId);
    expect(pinResult.success).toBe(true);
    expect(pinResult.data?.pin).toMatch(/^\d{4}$/);
    const pin = pinResult.data!.pin;

    await moveToInDelivery(rideId);

    const proof = {
      photo_url: 'https://example.com/proof.jpg',
      code: '1234',
      observation: 'Entregue ao destinatario',
    };
    const confirmed = await RideOperationalService.confirmDelivery(rideId, driverId, proof, pin);
    expect(confirmed.success, confirmed.error).toBe(true);
    expect((await waitForRideStatus(rideId, [RIDE_STATUS.COMPLETED], 5_000)).success).toBe(true);

    const { data: verificationFinal } = await supabaseAdmin
      .from('operational_verifications')
      .select('status, verified_at, verified_by, verification_attempts')
      .eq('ride_id', rideId)
      .single();
    expect(verificationFinal.status).toBe('verified');
    expect(verificationFinal.verified_at).toBeTruthy();
    expect(verificationFinal.verified_by).toBe(driverId);
    expect(verificationFinal.verification_attempts).toBe(1);

    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .select('proof_of_delivery, final_price, suggested_price')
      .eq('id', rideId)
      .single();
    expect(ride.proof_of_delivery?.photo_url).toBe(proof.photo_url);
    expect(ride.proof_of_delivery?.code).toBe(proof.code);
    expect(Number(ride.final_price)).toBe(Number(ride.suggested_price));
  });

  it('D.4. PIN invalido falha e incrementa tentativas', { timeout: 60_000 }, async () => {
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_deliveries: true })
      .eq('id', requesterId);

    const setup = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setup.success) throw new Error(`Setup falhou: ${setup.error}`);

    await authenticateAsProfile(requesterId);
    const rideId = await createDelivery({
      recipientName: 'Ana Lima',
      packageDescription: 'Livros',
      packageSize: 'small',
    });

    const pinResult = await OperationalVerificationService.refreshRequesterPIN(rideId);
    expect(pinResult.success).toBe(true);
    expect(pinResult.data?.pin).toMatch(/^\d{4}$/);
    const validPin = pinResult.data!.pin;
    const invalidPin = validPin === '9999' ? '0000' : '9999';

    await moveToInDelivery(rideId);

    const confirmed = await RideOperationalService.confirmDelivery(
      rideId,
      driverId,
      {
        photo_url: 'https://example.com/proof.jpg',
        code: '1234',
      },
      invalidPin,
    );
    expect(confirmed.success).toBe(false);
    expect(confirmed.error).toContain('Invalid PIN');

    const { data: verificationFinal } = await supabaseAdmin
      .from('operational_verifications')
      .select('status, verification_attempts, last_attempt_at')
      .eq('ride_id', rideId)
      .single();
    expect(verificationFinal.status).toBe('pending');
    expect(verificationFinal.verification_attempts).toBe(1);
    expect(verificationFinal.last_attempt_at).toBeTruthy();

    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    expect(ride.status).toBe(RIDE_STATUS.IN_DELIVERY);
  });
});
