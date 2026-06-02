/**
 * GATE 7 - PIN VERIFICATION: CORRIDA (RIDE)
 * 
 * Valida verificação operacional por PIN no runtime real:
 * - Corrida sem PIN exigido continua fluxo normal
 * - Corrida com PIN exigido bloqueia embarque sem PIN
 * - Corrida com PIN correto permite embarque
 * - Corrida com PIN inválido falha e audita
 * 
 * Este teste CONTA para fechamento do Gate 7.
 */

import { it, expect, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RideOperationalService } from '@/core/mobility/core/RideOperationalService';
import { RideDispatchService } from '@/core/mobility/core/RideDispatchService';
import { OperationalVerificationService } from '@/modules/mobility/services/OperationalVerificationService';
import { RIDE_STATUS } from '@/core/mobility/constants';
import { authenticateAsProfile, signOut } from '../helpers/auth-helper';
import { 
  waitForRideStatus, 
  getRideAuditTrail,
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

// Carregar fixtures
const fixturesPath = join(__dirname, '../fixtures/gate6-fixtures.json');
const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

// Service role client para validações
let supabaseAdmin: SupabaseClient;

describeOperational('Gate 7 - PIN Verification: Corrida', {
  requireServiceRole: true,
}, () => {
  // IDs de teste
  const passengerId = fixtures.passengers.passengerA.id;
  const driverId = fixtures.drivers.driverA.id;
  const createdRideIds: string[] = [];
  
  // Coordenadas
  const pickupLat = fixtures.coords.pickup.lat;
  const pickupLng = fixtures.coords.pickup.lng;
  const dropoffLat = fixtures.coords.dropoff.lat;
  const dropoffLng = fixtures.coords.dropoff.lng;
  const driverLat = fixtures.drivers.driverA.lat;
  const driverLng = fixtures.drivers.driverA.lng;
  
  // IDs de endereços
  const pickupAddressId = fixtures.addressIds.pickup;
  const dropoffAddressId = fixtures.addressIds.dropoff;
  const pickupLocationId = fixtures.locationIds.primary;
  const dropoffLocationId = fixtures.locationIds.primary;

  beforeEach(async () => {
    supabaseAdmin = createOperationalAdminClient();
    createdRideIds.length = 0;

    // ISOLAMENTO CRÍTICO: Resetar configurações de PIN PRIMEIRO
    await supabaseAdmin
      .from('profiles')
      .update({ 
        requires_pin_for_rides: false,
        requires_pin_for_deliveries: false 
      })
      .in('id', [passengerId, driverId]);
    
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

    await supabaseAdmin.from('driver_availability').delete().eq('profile_id', driverId);
  }, 30000);
  
  afterEach(async () => {
    // ISOLAMENTO CRÍTICO: Resetar configurações de PIN PRIMEIRO
    await supabaseAdmin
      .from('profiles')
      .update({ 
        requires_pin_for_rides: false,
        requires_pin_for_deliveries: false 
      })
      .in('id', [passengerId, driverId]);
    
    // Aguardar propagação
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (createdRideIds.length > 0) {
      console.log('⏳ Aguardando quiescência de', createdRideIds.length, 'rides...');
      await safeCleanupRides(createdRideIds, 20000);
      await safeCleanupVerifications(createdRideIds);
    }
    
    await cleanupMultipleDrivers([driverId]);
    await signOut();
  }, 30000);

  it('R.1. Corrida sem PIN exigido continua fluxo normal', { timeout: 30000 }, async () => {
    // ============================================
    // SETUP: Garantir que passageiro NÃO exige PIN
    // ============================================
    
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_rides: false })
      .eq('id', passengerId);
    
    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setupResult.success) {
      throw new Error(`Setup falhou: ${setupResult.error}`);
    }
    
    console.log('✅ Motorista disponível');
    
    // ============================================
    // ETAPA 1: Criar corrida SEM exigir PIN
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
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);
    
    console.log('✅ Corrida criada:', rideId);
    
    // ============================================
    // ETAPA 2: Validar que operational_verifications NÃO foi criado
    // ============================================
    
    const { data: verification } = await supabaseAdmin
      .from('operational_verifications')
      .select('*')
      .eq('ride_id', rideId)
      .single();
    
    expect(verification).toBeNull();
    
    console.log('✅ Nenhuma verificação criada (correto)');
    
    // ============================================
    // ETAPA 3: Aguardar auto-dispatch
    // ============================================
    
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ASSIGNED], 10000);
    
    // ============================================
    // ETAPA 4: Motorista aceita
    // ============================================
    
    await authenticateAsProfile(driverId);
    await RideDispatchService.acceptRide(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);
    
    // ============================================
    // ETAPA 5: Transição para passenger_boarded SEM PIN
    // ============================================
    
    const arrivingResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.DRIVER_ARRIVING,
      driverId
    );
    expect(arrivingResult.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ARRIVING], 5000);
    
    // Transição para passenger_boarded SEM fornecer PIN
    const boardedResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.PASSENGER_BOARDED,
      driverId
    );
    
    expect(boardedResult.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.PASSENGER_BOARDED], 5000);
    
    console.log('✅ Transição para passenger_boarded funcionou normalmente (sem PIN)');
    
    // ============================================
    // ETAPA 6: Continuar fluxo normal
    // ============================================
    
    const progressResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.IN_PROGRESS,
      driverId
    );
    expect(progressResult.success).toBe(true);
    
    console.log('✅ Fluxo completo sem PIN validado');
  });

  it('R.2. Corrida com PIN exigido bloqueia embarque sem PIN', { timeout: 30000 }, async () => {
    // ============================================
    // SETUP: Motorista disponível
    // ============================================
    
    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setupResult.success) {
      throw new Error(`Setup falhou: ${setupResult.error}`);
    }
    
    // ============================================
    // ETAPA 1: Configurar passageiro para exigir PIN
    // ============================================
    
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_rides: true })
      .eq('id', passengerId);
    
    console.log('✅ Passageiro configurado para exigir PIN');
    
    // ============================================
    // ETAPA 2: Criar corrida (PIN será exigido automaticamente)
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
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);
    
    console.log('✅ Corrida criada:', rideId);
    
    // ============================================
    // ETAPA 3: Validar que verificação foi criada automaticamente
    // ============================================
    
    // Aguardar um pouco para garantir que verificação foi criada
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: verification } = await supabaseAdmin
      .from('operational_verifications')
      .select('*')
      .eq('ride_id', rideId)
      .single();
    
    expect(verification).toBeDefined();
    expect(verification.is_required).toBe(true);
    expect(verification.required_by).toBe('passenger');
    expect(verification.status).toBe('pending');
    expect(verification.pin_hash).toBeDefined();
    
    // Obter PIN gerado (apenas para teste - em produção não seria exposto)
    const generatedPIN = verification.pin_hash; // Não temos acesso ao PIN em texto puro
    
    console.log('✅ Verificação criada automaticamente pelo fluxo oficial');
    
    // ============================================
    // ETAPA 4: Aguardar auto-dispatch e aceitar
    // ============================================
    
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ASSIGNED], 10000);
    
    await authenticateAsProfile(driverId);
    await RideDispatchService.acceptRide(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);
    
    await RideOperationalService.transitionTo(rideId, RIDE_STATUS.DRIVER_ARRIVING, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ARRIVING], 5000);
    
    // ============================================
    // ETAPA 5: Tentar transição para passenger_boarded SEM PIN
    // ============================================
    
    const boardedResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.PASSENGER_BOARDED,
      driverId
      // Sem fornecer PIN
    );
    
    expect(boardedResult.success).toBe(false);
    expect(boardedResult.error).toContain('PIN verification required');
    
    console.log('✅ Transição bloqueada sem PIN:', boardedResult.error);
    
    // ============================================
    // ETAPA 6: Validar que estado não mudou
    // ============================================
    
    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(ride.status).toBe(RIDE_STATUS.DRIVER_ARRIVING);
    
    console.log('✅ Estado permaneceu driver_arriving (bloqueado)');
    
    // ============================================
    // ETAPA 7: Validar auditoria
    // ============================================
    
    const auditTrail = await getRideAuditTrail(rideId);
    
    // Não deve ter transição para passenger_boarded
    const boardedTransition = auditTrail.find(t => t.to_state === 'passenger_boarded');
    expect(boardedTransition).toBeUndefined();
    
    console.log('✅ Auditoria validada: sem transição para passenger_boarded');
    
    // Cleanup: Remover configuração
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_rides: false })
      .eq('id', passengerId);
  });

  it('R.3. Corrida com PIN correto permite embarque', { timeout: 30000 }, async () => {
    // ============================================
    // SETUP
    // ============================================
    
    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setupResult.success) {
      throw new Error(`Setup falhou: ${setupResult.error}`);
    }
    
    // ============================================
    // ETAPA 1: Configurar passageiro para exigir PIN
    // ============================================
    
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_rides: true })
      .eq('id', passengerId);
    
    console.log('✅ Passageiro configurado para exigir PIN');
    
    // ============================================
    // ETAPA 2: Criar corrida (PIN será exigido automaticamente)
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
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);
    
    console.log('✅ Corrida criada:', rideId);
    
    // ============================================
    // ETAPA 3: Obter PIN gerado automaticamente
    // ============================================
    
    // Aguardar um pouco para garantir que verificação foi criada
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: verification } = await supabaseAdmin
      .from('operational_verifications')
      .select('*')
      .eq('ride_id', rideId)
      .single();
    
    expect(verification).toBeDefined();
    expect(verification.is_required).toBe(true);
    expect(verification.required_by).toBe('passenger');
    
    // Para teste, vamos gerar um PIN conhecido e atualizar o hash
    const testPIN = '1234';
    const bcrypt = require('bcryptjs');
    const pinHash = await bcrypt.hash(testPIN, 10);
    
    await supabaseAdmin
      .from('operational_verifications')
      .update({ pin_hash: pinHash })
      .eq('id', verification.id);
    
    console.log('✅ PIN de teste configurado:', testPIN);
    
    // ============================================
    // ETAPA 4: Aguardar auto-dispatch e aceitar
    // ============================================
    
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ASSIGNED], 10000);
    
    await authenticateAsProfile(driverId);
    await RideDispatchService.acceptRide(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);
    
    await RideOperationalService.transitionTo(rideId, RIDE_STATUS.DRIVER_ARRIVING, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ARRIVING], 5000);
    
    // ============================================
    // ETAPA 5: Transição para passenger_boarded COM PIN CORRETO
    // ============================================
    
    const boardedResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.PASSENGER_BOARDED,
      driverId,
      'Passenger boarded',
      testPIN // PIN correto
    );
    
    expect(boardedResult.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.PASSENGER_BOARDED], 5000);
    
    console.log('✅ Transição permitida com PIN correto');
    
    // ============================================
    // ETAPA 6: Validar que verificação foi marcada como verified
    // ============================================
    
    const { data: verificationFinal } = await supabaseAdmin
      .from('operational_verifications')
      .select('*')
      .eq('ride_id', rideId)
      .single();
    
    expect(verificationFinal.status).toBe('verified');
    expect(verificationFinal.verified_at).toBeTruthy();
    expect(verificationFinal.verified_by).toBe(driverId);
    expect(verificationFinal.verification_attempts).toBe(1);
    
    console.log('✅ Verificação marcada como verified');
    
    // ============================================
    // ETAPA 7: Continuar fluxo normal
    // ============================================
    
    const progressResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.IN_PROGRESS,
      driverId
    );
    expect(progressResult.success).toBe(true);
    
    console.log('✅ Fluxo completo com PIN validado');
    
    // Cleanup: Remover configuração
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_rides: false })
      .eq('id', passengerId);
  });

  it('R.4. Corrida com PIN inválido falha e audita', { timeout: 30000 }, async () => {
    // ============================================
    // SETUP
    // ============================================
    
    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setupResult.success) {
      throw new Error(`Setup falhou: ${setupResult.error}`);
    }
    
    // ============================================
    // ETAPA 1: Configurar passageiro para exigir PIN
    // ============================================
    
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_rides: true })
      .eq('id', passengerId);
    
    console.log('✅ Passageiro configurado para exigir PIN');
    
    // ============================================
    // ETAPA 2: Criar corrida (PIN será exigido automaticamente)
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
    const rideId = createResult.rideId!;
    createdRideIds.push(rideId);
    
    console.log('✅ Corrida criada:', rideId);
    
    // ============================================
    // ETAPA 3: Aguardar verificação ser criada
    // ============================================
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: verification } = await supabaseAdmin
      .from('operational_verifications')
      .select('*')
      .eq('ride_id', rideId)
      .single();
    
    expect(verification).toBeDefined();
    expect(verification.is_required).toBe(true);
    
    console.log('✅ Verificação criada automaticamente');
    
    // ============================================
    // ETAPA 4: Aguardar auto-dispatch e aceitar
    // ============================================
    
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ASSIGNED], 10000);
    
    await authenticateAsProfile(driverId);
    await RideDispatchService.acceptRide(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);
    
    await RideOperationalService.transitionTo(rideId, RIDE_STATUS.DRIVER_ARRIVING, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ARRIVING], 5000);
    
    // ============================================
    // ETAPA 5: Transição para passenger_boarded COM PIN INVÁLIDO
    // ============================================
    
    const boardedResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.PASSENGER_BOARDED,
      driverId,
      'Passenger boarded',
      '9999' // PIN inválido
    );
    
    expect(boardedResult.success).toBe(false);
    expect(boardedResult.error).toContain('Invalid PIN');
    
    console.log('✅ Transição bloqueada com PIN inválido:', boardedResult.error);
    
    // ============================================
    // ETAPA 6: Validar que tentativas foram incrementadas
    // ============================================
    
    const { data: verificationAfter } = await supabaseAdmin
      .from('operational_verifications')
      .select('*')
      .eq('ride_id', rideId)
      .single();
    
    expect(verificationAfter.status).toBe('pending');
    expect(verificationAfter.verification_attempts).toBe(1);
    expect(verificationAfter.last_attempt_at).toBeTruthy();
    
    console.log('✅ Tentativas incrementadas:', verificationAfter.verification_attempts);
    
    // ============================================
    // ETAPA 7: Validar auditoria
    // ============================================
    
    const auditTrail = await getRideAuditTrail(rideId);
    
    // Deve ter registro de falha de PIN
    const pinFailure = auditTrail.find(t => 
      t.reason?.includes('PIN verification failed')
    );
    expect(pinFailure).toBeDefined();
    
    console.log('✅ Auditoria registrou falha de PIN');
    
    // Cleanup
    await supabaseAdmin
      .from('profiles')
      .update({ requires_pin_for_rides: false })
      .eq('id', passengerId);
  });
});


