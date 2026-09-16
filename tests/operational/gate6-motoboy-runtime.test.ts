/**
 * GATE 6 MOTOBOY - RUNTIME REAL COM AUTO-DISPATCH
 *
 * Valida no alvo operacional isolado:
 * - criacao via quote server-owned single-use
 * - auto-dispatch e sequencia completa de estados
 * - proof of delivery e preco terminal derivado da quote
 * - failed delivery com custodia preservada
 * - expiracao sem motoboy disponivel
 */

import { afterEach, beforeEach, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RideOperationalService } from '@/core/mobility/core/RideOperationalService';
import { RideDispatchService } from '@/core/mobility/core/RideDispatchService';
import { DriverAvailabilityService } from '@/core/mobility/services/DriverAvailabilityService';
import { RIDE_STATUS } from '@/core/mobility/constants';
import { authenticateAsProfile, signOut } from '../helpers/auth-helper';
import {
  getRideAuditTrail,
  validateNoDriversAvailable,
  waitForAuditTransition,
  waitForDriverStatus,
  waitForRideStatus,
} from '../helpers/gate6-polling-helpers';
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

describeOperational('Gate 6 Motoboy - Runtime Real', {
  requireServiceRole: true,
}, () => {
  const requesterId = fixtures.passengers.passengerB.id;
  const driverId = fixtures.drivers.driverB.id;
  const createdRideIds: string[] = [];
  const pricingRuleIds: string[] = [];

  const pickupLat = fixtures.coords.pickup.lat;
  const pickupLng = fixtures.coords.pickup.lng;
  const dropoffLat = fixtures.coords.dropoff.lat;
  const dropoffLng = fixtures.coords.dropoff.lng;
  const driverLat = fixtures.drivers.driverB.lat;
  const driverLng = fixtures.drivers.driverB.lng;

  const pickupAddressId = fixtures.addressIds.pickup;
  const dropoffAddressId = fixtures.addressIds.dropoff;
  const pickupLocationId = fixtures.locationIds.primary;
  const dropoffLocationId = fixtures.locationIds.primary;
  const operationalTimeoutMs = 90_000;

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
    recipientPhone?: string;
    packageDescription: string;
    packageSize: 'small' | 'medium' | 'large';
    deliveryNotes?: string;
  }) {
    const quote = await issueDeliveryQuote();
    const result = await RideOperationalService.createDelivery({
      priceQuoteId: quote.quoteId,
      sourceType: 'passenger',
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      packageDescription: input.packageDescription,
      packageSize: input.packageSize,
      deliveryNotes: input.deliveryNotes,
    });

    expect(result.success, result.error).toBe(true);
    expect(result.rideId).toBeDefined();
    const rideId = result.rideId!;
    createdRideIds.push(rideId);
    return { rideId, quoteAmount: quote.amount };
  }

  async function moveDeliveryToInDelivery(rideId: string) {
    const dispatch = await waitForRideStatus(
      rideId,
      [RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.DRIVER_ACCEPTED],
      10_000,
    );
    expect(dispatch.success, dispatch.error).toBe(true);

    await authenticateAsProfile(driverId);
    const accepted = await RideDispatchService.acceptRide(rideId, driverId);
    expect(accepted.success, accepted.error).toBe(true);
    expect((await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5_000)).success).toBe(true);

    const arriving = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.DRIVER_ARRIVING,
      driverId,
      'Motoboy a caminho da coleta',
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

  beforeEach(async () => {
    supabaseAdmin = createOperationalAdminClient();
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
      await safeCleanupRides(createdRideIds, 20_000);
      await safeCleanupVerifications(createdRideIds);
    }

    await cleanupMobilityQuoteFixtures(supabaseAdmin, pricingRuleIds);
    await cleanupMultipleDrivers([driverId]);
    await signOut();
  }, 30_000);

  it('M.1. cria, coleta e conclui usando o preco da quote', { timeout: operationalTimeoutMs }, async () => {
    const setup = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setup.success) throw new Error(`Setup de motoboy falhou: ${setup.error}`);

    await authenticateAsProfile(requesterId);
    const { rideId, quoteAmount } = await createDelivery({
      recipientName: 'Joao Silva',
      recipientPhone: '11999999999',
      packageDescription: 'Documentos',
      packageSize: 'small',
      deliveryNotes: 'Entregar na portaria',
    });

    const { data: createdRide } = await supabaseAdmin
      .from('ride_requests')
      .select('ride_mode, recipient_name, package_description, suggested_price, pricing_quote_id')
      .eq('id', rideId)
      .single();
    expect(createdRide.ride_mode).toBe('motoboy');
    expect(createdRide.recipient_name).toBe('Joao Silva');
    expect(createdRide.package_description).toBe('Documentos');
    expect(Number(createdRide.suggested_price)).toBe(quoteAmount);
    expect(createdRide.pricing_quote_id).toBeTruthy();

    await moveDeliveryToInDelivery(rideId);

    const statusDuringDelivery = await DriverAvailabilityService.getStatus(driverId);
    expect(statusDuringDelivery?.status).toBe('busy');
    expect(statusDuringDelivery?.activeRideId).toBe(rideId);

    const proof = {
      photo_url: 'https://example.com/proof.jpg',
      code: '1234',
      observation: 'Entregue ao porteiro',
    };
    const completed = await RideOperationalService.confirmDelivery(rideId, driverId, proof);
    expect(completed.success, completed.error).toBe(true);
    expect((await waitForRideStatus(rideId, [RIDE_STATUS.COMPLETED], 5_000)).success).toBe(true);

    const { data: rideAfterDelivery } = await supabaseAdmin
      .from('ride_requests')
      .select('proof_of_delivery, delivered_at, final_price, suggested_price')
      .eq('id', rideId)
      .single();

    expect(rideAfterDelivery.proof_of_delivery?.photo_url).toBe(proof.photo_url);
    expect(rideAfterDelivery.proof_of_delivery?.code).toBe(proof.code);
    expect(rideAfterDelivery.proof_of_delivery?.observation).toBe(proof.observation);
    expect(rideAfterDelivery.proof_of_delivery?.signed_at).toBeTruthy();
    expect(rideAfterDelivery.delivered_at).toBeTruthy();
    expect(Number(rideAfterDelivery.final_price)).toBe(quoteAmount);
    expect(Number(rideAfterDelivery.final_price)).toBe(Number(rideAfterDelivery.suggested_price));

    const finalStatus = await DriverAvailabilityService.getStatus(driverId);
    expect(finalStatus?.status).toBe('online_available');
    expect(finalStatus?.isAvailable).toBe(true);
    expect(finalStatus?.activeRideId).toBeUndefined();

    const actualStates = (await getRideAuditTrail(rideId)).map((transition) => transition.to_state);
    for (const state of [
      'requested',
      'searching_driver',
      'driver_assigned',
      'driver_accepted',
      'driver_arriving',
      'pickup_confirmed',
      'in_delivery',
      'delivered',
      'completed',
    ]) {
      expect(actualStates).toContain(state);
    }
  });

  it('M.2. preserva custodia e metadata quando a entrega falha', { timeout: operationalTimeoutMs }, async () => {
    const setup = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setup.success) throw new Error(`Setup falhou: ${setup.error}`);

    await authenticateAsProfile(requesterId);
    const { rideId } = await createDelivery({
      recipientName: 'Maria Santos',
      recipientPhone: '11988888888',
      packageDescription: 'Eletronicos',
      packageSize: 'medium',
    });

    await moveDeliveryToInDelivery(rideId);

    const failedMetadata = {
      failure_reason: 'recipient_unavailable' as const,
      item_destination: 'return_to_sender' as const,
      item_current_holder: 'driver' as const,
      timestamp: new Date().toISOString(),
      resolution_status: 'pending' as const,
      resolution_notes: 'Destinatario nao atendeu apos 3 tentativas',
      attempted_delivery_count: 3,
    };

    const failed = await RideOperationalService.failDelivery(rideId, driverId, failedMetadata);
    expect(failed.success, failed.error).toBe(true);
    expect((await waitForRideStatus(rideId, [RIDE_STATUS.FAILED_DELIVERY], 5_000)).success).toBe(true);

    const { data: rideAfterFail } = await supabaseAdmin
      .from('ride_requests')
      .select('failed_delivery_metadata, failed_delivery_at, failed_delivery_reason')
      .eq('id', rideId)
      .single();

    expect(rideAfterFail.failed_delivery_metadata?.failure_reason).toBe('recipient_unavailable');
    expect(rideAfterFail.failed_delivery_metadata?.item_destination).toBe('return_to_sender');
    expect(rideAfterFail.failed_delivery_metadata?.item_current_holder).toBe('driver');
    expect(rideAfterFail.failed_delivery_metadata?.resolution_status).toBe('pending');
    expect(rideAfterFail.failed_delivery_metadata?.attempted_delivery_count).toBe(3);
    expect(rideAfterFail.failed_delivery_at).toBeTruthy();
    expect(rideAfterFail.failed_delivery_reason).toBe('recipient_unavailable');

    const failedTransition = (await getRideAuditTrail(rideId)).find(
      (transition) => transition.to_state === 'failed_delivery',
    );
    expect(failedTransition?.changed_by).toBe(driverId);
    expect(failedTransition?.reason).toBe('recipient_unavailable');

    const statusAfterFail = await DriverAvailabilityService.getStatus(driverId);
    expect(statusAfterFail?.status).toBe('busy');
    expect(statusAfterFail?.activeRideId).toBe(rideId);
  });

  it('M.3. expira sem motoboy disponivel', { timeout: operationalTimeoutMs }, async () => {
    await supabaseAdmin
      .from('driver_availability')
      .update({ is_online: false, is_available: false, active_ride_id: null })
      .eq('profile_id', driverId);
    await new Promise((resolve) => setTimeout(resolve, 2_000));

    const preCondition = await validateNoDriversAvailable([driverId]);
    if (!preCondition.valid) throw new Error(`PRE-CONDICAO FALHOU: ${preCondition.error}`);

    await authenticateAsProfile(requesterId);
    const { rideId } = await createDelivery({
      recipientName: 'Pedro Costa',
      packageDescription: 'Roupas',
      packageSize: 'large',
    });

    const expired = await waitForRideStatus(rideId, [RIDE_STATUS.EXPIRED], 10_000);
    expect(expired.success, expired.error).toBe(true);

    const transition = await waitForAuditTransition(rideId, RIDE_STATUS.EXPIRED, 5_000);
    expect(transition.success, transition.error).toBe(true);
    expect(transition.transition?.changed_by).toBe('system');
    expect(transition.transition?.reason).toBe('No eligible drivers found');

    const states = (await getRideAuditTrail(rideId)).map((item) => item.to_state);
    expect(states).toContain('requested');
    expect(states).toContain('searching_driver');
    expect(states).toContain('expired');
  });
});
