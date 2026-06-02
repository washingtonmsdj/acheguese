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

// Carregar fixtures
const fixturesPath = join(__dirname, '../fixtures/gate6-fixtures.json');
const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

let supabaseAdmin: SupabaseClient;

describeOperational('Gate 6 - Bloco B: Runtime Real SEM Motoristas', {
  requireServiceRole: true,
}, () => {
  // IDs de teste
  const passengerId = fixtures.passengers.passengerB.id;
  const allDriverIds = [
    fixtures.drivers.driverA.id,
    fixtures.drivers.driverB.id,
    fixtures.drivers.driverC.id,
  ];
  const createdRideIds: string[] = [];
  
  // Coordenadas
  const pickupLat = fixtures.coords.pickup.lat;
  const pickupLng = fixtures.coords.pickup.lng;
  const dropoffLat = fixtures.coords.dropoff.lat;
  const dropoffLng = fixtures.coords.dropoff.lng;
  
  // IDs de endereços
  const pickupAddressId = fixtures.addressIds.pickup;
  const dropoffAddressId = fixtures.addressIds.dropoff;
  const pickupLocationId = fixtures.locationIds.primary;
  const dropoffLocationId = fixtures.locationIds.primary;

  beforeEach(async () => {
    supabaseAdmin = createOperationalAdminClient();
    createdRideIds.length = 0;

    // Resetar flags de PIN antes do cleanup de dados
    await supabaseAdmin
      .from('profiles')
      .update({
        requires_pin_for_rides: false,
        requires_pin_for_deliveries: false,
      })
      .in('id', [passengerId, ...allDriverIds]);

    // Aguardar propagação
    await new Promise(resolve => setTimeout(resolve, 500));

    // Limpar rides antigas do passageiro com quiescência
    const { data: staleRides } = await supabaseAdmin
      .from('ride_requests')
      .select('id')
      .eq('passenger_profile_id', passengerId);

    const staleRideIds = (staleRides ?? []).map((ride) => ride.id);
    if (staleRideIds.length > 0) {
      await safeCleanupRides(staleRideIds, 20000);
      await safeCleanupVerifications(staleRideIds);
    }
    
    // GARANTIR que NÃO há motoristas disponíveis
    // Forçar offline no banco diretamente
    await supabaseAdmin
      .from('driver_availability')
      .update({ 
        is_online: false, 
        is_available: false,
        active_ride_id: null,
      })
      .in('profile_id', allDriverIds);
    
    // Aguardar propagação do cleanup (prevenir race condition)
    // Motorista do teste anterior pode ainda estar sendo liberado
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Validar que todos estão offline
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
    // Resetar flags de PIN antes do cleanup de dados
    await supabaseAdmin
      .from('profiles')
      .update({
        requires_pin_for_rides: false,
        requires_pin_for_deliveries: false,
      })
      .in('id', [passengerId, ...allDriverIds]);

    // Aguardar propagação
    await new Promise(resolve => setTimeout(resolve, 500));

    if (createdRideIds.length > 0) {
      console.log('⏳ Aguardando quiescência de', createdRideIds.length, 'rides...');
      await safeCleanupRides(createdRideIds, 20000);
      await safeCleanupVerifications(createdRideIds);
    }

    await cleanupMultipleDrivers(allDriverIds);
    await signOut();
  }, 30000);

  it('B.1. Corrida sem motoristas disponíveis → auto-dispatch expira', { timeout: 30000 }, async () => {
    // ============================================
    // PRÉ-CONDIÇÃO: Garantir que NÃO há motoristas disponíveis
    // ============================================
    
    const preCondition = await validateNoDriversAvailable(allDriverIds);
    
    if (!preCondition.valid) {
      throw new Error(`PRÉ-CONDIÇÃO FALHOU: ${preCondition.error}`);
    }
    
    console.log(`✅ PRÉ-CONDIÇÃO VALIDADA: 0 motoristas disponíveis`);
    
    // ============================================
    // ETAPA 1: Passageiro cria corrida
    // ============================================
    
    await authenticateAsProfile(passengerId);
    
    const createResult = await RideOperationalService.createRide({
      passengerProfileId: passengerId,
      pickupAddressId,
      dropoffAddressId,
      pickupLocationId,
      dropoffLocationId,
      originLat: pickupLat,
      originLng: pickupLng,
      destinationLat: dropoffLat,
      destinationLng: dropoffLng,
      mode: 'ride',
      suggestedPrice: 15.00,
    });
    
    expect(createResult.success).toBe(true);
    expect(createResult.rideId).toBeDefined();
    
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);
    console.log('✅ Corrida criada:', rideId);
    
    // ============================================
    // ETAPA 2: Aguardar auto-dispatch EXPIRAR (POLLING)
    // ============================================
    
    const expireResult = await waitForRideStatus(
      rideId,
      [RIDE_STATUS.EXPIRED],
      10000 // 10s timeout
    );
    
    if (!expireResult.success) {
      throw new Error(`Corrida não expirou: ${expireResult.error}`);
    }
    
    console.log(`✅ Corrida expirou em ${expireResult.elapsedMs}ms`);
    
    // ============================================
    // ETAPA 3: Validar auditoria do auto-dispatch
    // ============================================
    
    const expiredTransition = await waitForAuditTransition(
      rideId,
      RIDE_STATUS.EXPIRED,
      5000
    );
    
    if (!expiredTransition.success) {
      throw new Error(`Transição para expired não encontrada: ${expiredTransition.error}`);
    }
    
    // Validar campos da transição
    expect(expiredTransition.transition!.changed_by).toBe('system');
    expect(expiredTransition.transition!.reason).toBe('No eligible drivers found');
    
    console.log('✅ Auditoria validada:', {
      from: expiredTransition.transition!.from_state,
      to: expiredTransition.transition!.to_state,
      by: expiredTransition.transition!.changed_by,
      reason: expiredTransition.transition!.reason,
    });
    
    // ============================================
    // VALIDAÇÃO FINAL: Timeline completa
    // ============================================
    
    const auditTrail = await getRideAuditTrail(rideId);
    
    // Validar estados essenciais do fluxo (ordem de created_at pode empatar em ambiente remoto)
    const actualStates = auditTrail.map(t => t.to_state);
    expect(actualStates).toContain('requested');
    expect(actualStates).toContain('searching_driver');
    expect(actualStates).toContain('expired');
    
    // Validar que searching_driver → expired foi feito por system
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
    // ============================================
    // PRÉ-CONDIÇÃO: Garantir que NÃO há motoristas disponíveis
    // ============================================
    
    const preCondition = await validateNoDriversAvailable(allDriverIds);
    
    if (!preCondition.valid) {
      throw new Error(`PRÉ-CONDIÇÃO FALHOU: ${preCondition.error}`);
    }
    
    console.log(`✅ PRÉ-CONDIÇÃO VALIDADA: 0 motoristas disponíveis`);
    
    // ============================================
    // ETAPA 1: Criar 3 corridas sem motoristas disponíveis
    // ============================================
    
    // Criar 3 corridas sem motoristas disponíveis
    const rideIds: string[] = [];
    
    await authenticateAsProfile(passengerId);
    
    for (let i = 0; i < 3; i++) {
      const createResult = await RideOperationalService.createRide({
        passengerProfileId: passengerId,
        pickupAddressId,
        dropoffAddressId,
        pickupLocationId,
        dropoffLocationId,
        originLat: pickupLat,
        originLng: pickupLng,
        destinationLat: dropoffLat,
        destinationLng: dropoffLng,
        mode: 'ride',
        suggestedPrice: 15.00 + i,
      });
      
      expect(createResult.success).toBe(true);
      const createdRideId = createResult.rideId!;
      rideIds.push(createdRideId);
      createdRideIds.push(createdRideId);
    }
    
    console.log(`✅ ${rideIds.length} corridas criadas`);
    
    // Aguardar todas expirarem
    const expireResults = await Promise.all(
      rideIds.map(id => waitForRideStatus(id, [RIDE_STATUS.EXPIRED], 10000))
    );
    
    // Validar que todas expiraram
    expireResults.forEach((result, i) => {
      expect(result.success).toBe(true);
      console.log(`✅ Corrida ${i + 1} expirou em ${result.elapsedMs}ms`);
    });
    
    // Validar auditoria de todas
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



