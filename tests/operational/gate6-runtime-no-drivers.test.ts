/**
 * GATE 6 - BLOCO B: RUNTIME REAL SEM MOTORISTAS DISPONÍVEIS
 * 
 * Valida comportamento de expiração automática:
 * - Sem motoristas disponíveis
 * - Auto-dispatch via edge function expira corrida
 * - Validação de auditoria: "No eligible drivers found"
 * - Polling determinístico
 * 
 * Este bloco CONTA para fechamento do Gate 6.
 */

import { it, expect, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RideOperationalService } from '@/core/mobility/core/RideOperationalService';
import { RIDE_STATUS } from '@/core/mobility/constants';
import { authenticateAsProfile, signOut } from '../helpers/auth-helper';
import { 
  waitForRideStatus, 
  waitForAuditTransition,
  getRideAuditTrail,
  validateNoDriversAvailable,
} from '../helpers/gate6-polling-helpers';
import { cleanupMultipleDrivers } from '../helpers/gate6-setup-helpers';
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

describeOperational('Gate 6 - Bloco B: Runtime Real SEM Motoristas', {
  requireServiceRole: true,
}, () => {
  const passengerId = fixtures.passengers.passengerB.id;
  const allDriverIds = [
    fixtures.drivers.driverA.id,
    fixtures.drivers.driverB.id,
    fixtures.drivers.driverC.id,
  ];
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

    await supabaseAdmin
      .from('profiles')
      .update({
        requires_pin_for_rides: false,
        requires_pin_for_deliveries: false,
      })
      .in('id', [passengerId, ...allDriverIds]);

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
    
    await supabaseAdmin
      .from('driver_availability')
      .update({ 
        is_online: false, 
        is_available: false,
        active_ride_id: null,
      })
      .in('profile_id', allDriverIds);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: drivers } = await supabaseAdmin
      .from('driver_availability')
      .select('profile_id, is_online, is_available')
      .in('profile_id', allDriverIds);
    
    const anyOnline = drivers?.some(d => d.is_online);
    if (anyOnline) {
      console.warn('⚠️  Alguns motoristas ainda online após cleanup forçado');
    }
  }, 30000);
  
  afterEach(async () => {
    await supabaseAdmin
      .from('profiles')
      .update({
        requires_pin_for_rides: false,
        requires_pin_for_deliveries: false,
      })
      .in('id', [passengerId, ...allDriverIds]);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (createdRideIds.length > 0) {
      console.log('⏳ Aguardando quiescência de', createdRideIds.length, 'rides...');
      await safeCleanupRides(createdRideIds, 20000);
      await safeCleanupVerifications(createdRideIds);
    }

    await cleanupMobilityRideQuoteFixtures(supabaseAdmin, pricingRuleIds);
    await cleanupMultipleDrivers(allDriverIds);
    await signOut();
  }, 30000);

  it('B.1. Corrida sem motoristas disponíveis → auto-dispatch expira', { timeout: 30000 }, async () => {
    const preCondition = await validateNoDriversAvailable(allDriverIds);
    
    if (!preCondition.valid) {
      throw new Error(`PRÉ-CONDIÇÃO FALHOU: ${preCondition.error}`);
    }
    
    console.log(`✅ PRÉ-CONDIÇÃO VALIDADA: 0 motoristas disponíveis`);
    
    await authenticateAsProfile(passengerId);
    const priceQuoteId = await issueRideQuote();
    
    const createResult = await RideOperationalService.createRide({ priceQuoteId });
    
    expect(createResult.success).toBe(true);
    expect(createResult.rideId).toBeDefined();
    
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);
    console.log('✅ Corrida criada:', rideId);
    
    const expireResult = await waitForRideStatus(
      rideId,
      [RIDE_STATUS.EXPIRED],
      10000
    );
    
    if (!expireResult.success) {
      throw new Error(`Corrida não expirou: ${expireResult.error}`);
    }
    
    console.log(`✅ Corrida expirou em ${expireResult.elapsedMs}ms`);
    
    const expiredTransition = await waitForAuditTransition(
      rideId,
      RIDE_STATUS.EXPIRED,
      5000
    );
    
    if (!expiredTransition.success) {
      throw new Error(`Transição para expired não encontrada: ${expiredTransition.error}`);
    }
    
    expect(expiredTransition.transition!.changed_by).toBe('system');
    expect(expiredTransition.transition!.reason).toBe('No eligible drivers found');
    
    console.log('✅ Auditoria validada:', {
      from: expiredTransition.transition!.from_state,
      to: expiredTransition.transition!.to_state,
      by: expiredTransition.transition!.changed_by,
      reason: expiredTransition.transition!.reason,
    });
    
    const auditTrail = await getRideAuditTrail(rideId);
    const actualStates = auditTrail.map(t => t.to_state);
    expect(actualStates).toContain('requested');
    expect(actualStates).toContain('searching_driver');
    expect(actualStates).toContain('expired');
    
    const searchingToExpired = auditTrail.find(
      t => t.from_state === 'searching_driver' && t.to_state === 'expired'
    );
    
    expect(searchingToExpired).toBeDefined();
    expect(searchingToExpired!.changed_by).toBe('system');
    expect(searchingToExpired!.reason).toBe('No eligible drivers found');
    
    console.log('✅ Timeline validada:', auditTrail.map(t => 
      `${t.from_state} → ${t.to_state} (${t.changed_by})`
    ).join(' | '));
  }, 30000);

  it('B.2. Múltiplas corridas sem motoristas → todas expiram', { timeout: 30000 }, async () => {
    const preCondition = await validateNoDriversAvailable(allDriverIds);
    
    if (!preCondition.valid) {
      throw new Error(`PRÉ-CONDIÇÃO FALHOU: ${preCondition.error}`);
    }
    
    console.log(`✅ PRÉ-CONDIÇÃO VALIDADA: 0 motoristas disponíveis`);
    
    const rideIds: string[] = [];
    await authenticateAsProfile(passengerId);
    
    for (let i = 0; i < 3; i++) {
      const priceQuoteId = await issueRideQuote();
      const createResult = await RideOperationalService.createRide({ priceQuoteId });
      
      expect(createResult.success).toBe(true);
      const createdRideId = createResult.rideId!;
      rideIds.push(createdRideId);
      createdRideIds.push(createdRideId);
    }
    
    console.log(`✅ ${rideIds.length} corridas criadas`);
    
    const expireResults = await Promise.all(
      rideIds.map(id => waitForRideStatus(id, [RIDE_STATUS.EXPIRED], 10000))
    );
    
    expireResults.forEach((result, i) => {
      expect(result.success).toBe(true);
      console.log(`✅ Corrida ${i + 1} expirou em ${result.elapsedMs}ms`);
    });
    
    for (const rideId of rideIds) {
      const auditTrail = await getRideAuditTrail(rideId);
      const expiredTransition = auditTrail.find(t => t.to_state === 'expired');
      expect(expiredTransition).toBeDefined();
      expect(expiredTransition!.changed_by).toBe('system');
      expect(expiredTransition!.reason).toBe('No eligible drivers found');
    }
    
    console.log('✅ Todas corridas expiraram corretamente com auditoria válida');
  });
});
