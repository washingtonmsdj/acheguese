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
import { RideOperationalService } from '@/modules/mobility/core/RideOperationalService';
import { RideDispatchService } from '@/modules/mobility/core/RideDispatchService';
import { DriverAvailabilityService } from '@/modules/mobility/services/DriverAvailabilityService';
import { RIDE_STATUS } from '@/modules/mobility/constants';
import { authenticateAsProfile, signOut } from '../helpers/auth-helper';
import { 
  waitForRideStatus, 
  waitForAuditTransition,
  getRideAuditTrail,
  waitForDriverStatus,
} from '../helpers/gate6-polling-helpers';
import { 
  setupDriverAvailable,
  cleanupMultipleDrivers,
} from '../helpers/gate6-setup-helpers';
import { createOperationalAdminClient, describeOperational } from '../helpers/operational-env';

// Carregar fixtures
const fixturesPath = join(__dirname, '../fixtures/gate6-fixtures.json');
const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

// Service role client para validações
let supabaseAdmin: SupabaseClient;
describeOperational('Gate 6 - Bloco A: Runtime Real COM Motoristas', {
  requireServiceRole: true,
}, () => {
  // IDs de teste
  const passengerId = fixtures.passengers.passengerA.id;
  const driverId = fixtures.drivers.driverA.id;
  
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
    // Limpar dados de teste
    await supabaseAdmin.from('driver_availability').delete().eq('profile_id', driverId);
    await supabaseAdmin.from('ride_requests').delete().eq('passenger_profile_id', passengerId);
  });
  
  afterEach(async () => {
    await cleanupMultipleDrivers([driverId]);
    await signOut();
  });

  it('A.1. Fluxo completo: motorista disponível → auto-dispatch → aceitar → completar', { timeout: 90000 }, async () => {
    // ============================================
    // SETUP: Motorista disponível (VALIDADO NO BANCO)
    // ============================================
    
    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    
    if (!setupResult.success) {
      throw new Error(`Setup de motorista falhou: ${setupResult.error}`);
    }
    
    console.log('✅ Motorista disponível validado:', setupResult.state);
    
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
    console.log('✅ Corrida criada:', rideId);
    
    // ============================================
    // ETAPA 2: Aguardar auto-dispatch (POLLING DETERMINÍSTICO)
    // ============================================
    
    const dispatchResult = await waitForRideStatus(
      rideId,
      [RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.DRIVER_ACCEPTED],
      10000 // 10s timeout
    );
    
    if (!dispatchResult.success) {
      throw new Error(`Auto-dispatch falhou: ${dispatchResult.error}`);
    }
    
    console.log(`✅ Auto-dispatch completou em ${dispatchResult.elapsedMs}ms. Status: ${dispatchResult.currentStatus}`);
    
    // Validar que motorista foi atribuído
    const { data: rideAfterDispatch } = await supabaseAdmin
      .from('ride_requests')
      .select('driver_profile_id')
      .eq('id', rideId)
      .single();
    
    expect(rideAfterDispatch.driver_profile_id).toBe(driverId);
    
    // ============================================
    // ETAPA 3: Validar auditoria do auto-dispatch
    // ============================================
    
    const auditTrail = await getRideAuditTrail(rideId);
    
    expect(auditTrail.length).toBeGreaterThanOrEqual(2);
    
    // Validar transição: none → requested
    const requestedTransition = auditTrail.find(t => t.to_state === 'requested');
    expect(requestedTransition).toBeDefined();
    expect(requestedTransition!.changed_by).toBe(passengerId);
    
    // Validar transição: requested → searching_driver
    const searchingTransition = auditTrail.find(t => t.to_state === 'searching_driver');
    expect(searchingTransition).toBeDefined();
    expect(searchingTransition!.changed_by).toBe('system');
    
    // Validar transição: searching_driver → driver_assigned
    const assignedTransition = auditTrail.find(t => t.to_state === 'driver_assigned');
    expect(assignedTransition).toBeDefined();
    expect(assignedTransition!.changed_by).toBe('system');
    // Reason pode variar: "auto-dispatch" ou "Driver assigned (attempt X, distance: Ykm)"
    expect(assignedTransition!.reason).toBeTruthy();
    
    console.log('✅ Auditoria validada:', auditTrail.map(t => `${t.from_state} → ${t.to_state} (${t.reason})`).join(', '));
    
    // ============================================
    // ETAPA 4: Motorista aceita
    // ============================================
    
    await authenticateAsProfile(driverId);
    
    const acceptResult = await RideDispatchService.acceptRide(rideId, driverId);
    expect(acceptResult.success).toBe(true);
    
    const acceptedResult = await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);
    expect(acceptedResult.success).toBe(true);
    
    console.log('✅ Motorista aceitou corrida');
    
    // Validar que motorista está busy
    const driverStatus = await DriverAvailabilityService.getStatus(driverId);
    expect(driverStatus).toBeDefined();
    expect(driverStatus!.status).toBe('busy');
    expect(driverStatus!.activeRideId).toBe(rideId);
    
    // ============================================
    // ETAPA 5: Estados intermediários (SEQUÊNCIA OFICIAL DA STATE MACHINE)
    // requested → searching_driver → driver_assigned → driver_accepted → 
    // driver_arriving → passenger_boarded → in_progress
    // ============================================
    
    // driver_arriving
    const arrivingResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.DRIVER_ARRIVING,
      driverId,
      'Driver is on the way'
    );
    expect(arrivingResult.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ARRIVING], 5000);
    
    // passenger_boarded
    const boardedResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.PASSENGER_BOARDED,
      driverId,
      'Passenger boarded'
    );
    expect(boardedResult.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.PASSENGER_BOARDED], 5000);
    
    // in_progress
    const progressResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.IN_PROGRESS,
      driverId,
      'Ride started'
    );
    expect(progressResult.success).toBe(true);
    await waitForRideStatus(rideId, [RIDE_STATUS.IN_PROGRESS], 5000);
    
    console.log('✅ Estados intermediários completados');
    
    // Motorista ainda deve estar busy
    const statusDuringRide = await DriverAvailabilityService.getStatus(driverId);
    expect(statusDuringRide!.status).toBe('busy');
    expect(statusDuringRide!.activeRideId).toBe(rideId);
    
    // ============================================
    // ETAPA 6: Completar corrida
    // ============================================
    
    const completeResult = await RideOperationalService.completeRide(rideId, driverId, 18.50);
    expect(completeResult.success).toBe(true);
    
    const completedResult = await waitForRideStatus(rideId, [RIDE_STATUS.COMPLETED], 5000);
    expect(completedResult.success).toBe(true);
    
    console.log('✅ Corrida completada');
    
    // ============================================
    // ETAPA 8: Motorista volta disponível
    // ============================================
    
    const finalStatus = await DriverAvailabilityService.getStatus(driverId);
    expect(finalStatus).toBeDefined();
    expect(finalStatus!.status).toBe('online_available');
    expect(finalStatus!.isAvailable).toBe(true);
    expect(finalStatus!.activeRideId).toBeUndefined();
    
    console.log('✅ Motorista voltou disponível');
    
    // ============================================
    // VALIDAÇÃO FINAL: Auditoria completa
    // ============================================
    
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
    
    expectedStates.forEach(state => {
      expect(actualStates).toContain(state);
    });
    
    console.log('✅ Fluxo completo validado. Timeline:', finalAuditTrail.map(t => 
      `${t.to_state} (${t.changed_by})`
    ).join(' → '));
  });

  it('A.2. Cancelamento após aceite libera motorista', { timeout: 90000 }, async () => {
    // Setup motorista
    const setupResult = await setupDriverAvailable(driverId, driverLat, driverLng);
    if (!setupResult.success) {
      throw new Error(`Setup falhou: ${setupResult.error}`);
    }
    
    // Criar corrida
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
    
    const rideId = createResult.rideId!;
    
    // Aguardar auto-dispatch
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ASSIGNED], 10000);
    
    // Motorista aceita
    await authenticateAsProfile(driverId);
    await RideDispatchService.acceptRide(rideId, driverId);
    await waitForRideStatus(rideId, [RIDE_STATUS.DRIVER_ACCEPTED], 5000);
    
    // Validar busy
    const statusBeforeCancel = await DriverAvailabilityService.getStatus(driverId);
    expect(statusBeforeCancel!.status).toBe('busy');
    expect(statusBeforeCancel!.activeRideId).toBe(rideId);
    
    // Passageiro cancela
    await authenticateAsProfile(passengerId);
    const cancelResult = await RideOperationalService.cancelRide({
      rideId,
      cancelledBy: 'passenger',
      profileId: passengerId,
      reason: 'Changed my mind',
    });
    
    expect(cancelResult.success).toBe(true);
    
    // Aguardar cancelamento
    await waitForRideStatus(rideId, [RIDE_STATUS.CANCELLED_BY_PASSENGER], 5000);
    
    // Aguardar motorista ser liberado (polling determinístico)
    // Timeout aumentado de 5s para 10s devido a handlePostTransition assíncrono
    const driverReleaseResult = await waitForDriverStatus(driverId, 'online_available', 10000);
    
    if (!driverReleaseResult.success) {
      throw new Error(`Motorista não foi liberado: ${driverReleaseResult.error}`);
    }
    
    console.log(`✅ Motorista liberado em ${driverReleaseResult.elapsedMs}ms`);
    
    // Validar que motorista voltou disponível
    const statusAfterCancel = await DriverAvailabilityService.getStatus(driverId);
    expect(statusAfterCancel).toBeDefined();
    expect(statusAfterCancel!.status).toBe('online_available');
    expect(statusAfterCancel!.isAvailable).toBe(true);
    expect(statusAfterCancel!.activeRideId).toBeUndefined();
    
    console.log('✅ Cancelamento liberou motorista corretamente');
  });
});
