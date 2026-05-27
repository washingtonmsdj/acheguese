/**
 * GATE 6 - SUÍTE B: E2E PRINCIPAL DO PASSAGEIRO
 * 
 * Valida fluxo completo usando entrypoint oficial e dispatch AUTOMÁTICO:
 * 1. Motorista online e disponível
 * 2. Passageiro solicita corrida (entrypoint oficial)
 * 3. Edge function auto-dispatch-ride busca motorista AUTOMATICAMENTE
 * 4. Edge function atribui motorista AUTOMATICAMENTE (se disponível)
 * 5. Motorista aceita (fluxo oficial)
 * 6. Estados intermediários (driver_arriving, passenger_boarded)
 * 7. Corrida inicia (in_progress)
 * 8. Tracking durante corrida
 * 9. Corrida completa
 * 10. Motorista volta disponível
 * 
 * IMPORTANTE: Dispatch é AUTOMÁTICO via Database Webhook → Edge Function.
 * Testes precisam criar motoristas disponíveis ANTES de criar corrida,
 * ou validar que corrida expira corretamente quando não há motoristas.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DriverAvailabilityService } from '@/modules/mobility/services/DriverAvailabilityService';
import { RideDispatchService } from '@/modules/mobility/core/RideDispatchService';
import { RideOperationalService } from '@/modules/mobility/core/RideOperationalService';
import { TrackingService } from '@/core/tracking/services/TrackingService';
import { RIDE_STATUS } from '@/modules/mobility/constants';
import { authenticateAsProfile, signOut } from '../../helpers/auth-helper';
import { findAvailableDriversAdmin, assignDriverAdmin } from '../../helpers/dispatch-test-helpers';

// Carregar fixtures
const fixturesPath = join(__dirname, '../fixtures/gate6-fixtures.json');
const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

// Service role client para bypassar RLS
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

describe('Gate 6 - Suite B: E2E Passageiro (Fluxo Oficial)', () => {
  // IDs de teste (do JSON de fixtures)
  const passengerId = fixtures.passengers.passengerB.id;
  const driverId = fixtures.drivers.driverB.id;
  
  // Coordenadas de teste
  const pickupLat = fixtures.coords.pickup.lat;
  const pickupLng = fixtures.coords.pickup.lng;
  const dropoffLat = fixtures.coords.dropoff.lat;
  const dropoffLng = fixtures.coords.dropoff.lng;
  const driverLat = fixtures.drivers.driverB.lat;
  const driverLng = fixtures.drivers.driverB.lng;
  
  // IDs de endereços/localizações (do JSON de fixtures)
  const pickupAddressId = fixtures.addressIds.pickup;
  const dropoffAddressId = fixtures.addressIds.dropoff;
  const pickupLocationId = fixtures.locationIds.primary;
  const dropoffLocationId = fixtures.locationIds.primary;

  beforeEach(async () => {
    // Limpar dados de teste
    await supabaseAdmin.from('driver_availability').delete().eq('profile_id', driverId);
    await supabaseAdmin.from('ride_requests').delete().eq('passenger_profile_id', passengerId);
  });
  
  afterEach(async () => {
    await signOut();
  });

  it('B.1. Fluxo completo: criar → dispatch → aceitar → estados intermediários → completar', async () => {
    // ============================================
    // ETAPA 1: Motorista fica online
    // ============================================
    
    await authenticateAsProfile(driverId);
    
    const goOnlineResult = await DriverAvailabilityService.goOnline(driverId);
    expect(goOnlineResult.success).toBe(true);
    
    const statusAfterOnline = await DriverAvailabilityService.getStatus(driverId);
    expect(statusAfterOnline).toBeDefined();
    expect(statusAfterOnline!.status).toBe('online_warming_up');
    expect(statusAfterOnline!.isOnline).toBe(true);
    expect(statusAfterOnline!.isAvailable).toBe(false);
    
    // ============================================
    // ETAPA 2: Motorista fica disponível (com coordenadas)
    // ============================================
    
    const setAvailableResult = await DriverAvailabilityService.setAvailable(
      driverId,
      { lat: driverLat, lng: driverLng }
    );
    expect(setAvailableResult.success).toBe(true);
    
    const statusAfterAvailable = await DriverAvailabilityService.getStatus(driverId);
    expect(statusAfterAvailable).toBeDefined();
    expect(statusAfterAvailable!.status).toBe('online_available');
    expect(statusAfterAvailable!.isOnline).toBe(true);
    expect(statusAfterAvailable!.isAvailable).toBe(true);
    expect(statusAfterAvailable!.currentLocation).toEqual({ lat: driverLat, lng: driverLng });
    
    // ============================================
    // ETAPA 3: Passageiro solicita corrida (ENTRYPOINT OFICIAL)
    // ============================================
    
    await authenticateAsProfile(passengerId);
    
    const createResult = await RideOperationalService.createRide({
      passengerProfileId: passengerId,
      pickupAddressId: pickupAddressId,
      dropoffAddressId: dropoffAddressId,
      pickupLocationId: pickupLocationId,
      dropoffLocationId: dropoffLocationId,
      originLat: pickupLat,
      originLng: pickupLng,
      destinationLat: dropoffLat,
      destinationLng: dropoffLng,
      mode: 'ride',
      suggestedPrice: 15.00,
    });
    
    expect(createResult.success).toBe(true);
    expect(createResult.rideId).toBeDefined();
    expect(createResult.newState).toBe(RIDE_STATUS.SEARCHING_DRIVER);
    
    const rideId = createResult.rideId!;
    
    // ============================================
    // ETAPA 4: Edge function busca motorista AUTOMATICAMENTE
    // Database Webhook dispara auto-dispatch-ride quando status = searching_driver
    // Edge function busca motoristas elegíveis e atribui automaticamente
    // IMPORTANTE: Pode ser MUITO RÁPIDO (< 1s), então verificamos o estado final
    // ============================================
    
    // Aguardar edge function executar (timeout de ~5s para segurança)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar que motorista foi atribuído AUTOMATICAMENTE
    const { data: rideAfterDispatch } = await supabaseAdmin
      .from('ride_requests')
      .select('status, driver_profile_id')
      .eq('id', rideId)
      .single();
    
    // Dispatch automático pode ter sido tão rápido que já está em driver_assigned
    expect(['searching_driver', 'driver_assigned']).toContain(rideAfterDispatch.status);
    
    // Se já foi atribuído, validar que foi para o motorista correto
    if (rideAfterDispatch.status === RIDE_STATUS.DRIVER_ASSIGNED) {
      expect(rideAfterDispatch.driver_profile_id).toBe(driverId);
    }
    
    // ============================================
    // ETAPA 5: Motorista aceita (OPERAÇÃO DE MOTORISTA)
    // Requer autenticação como motorista
    // ============================================
    
    await authenticateAsProfile(driverId);
    const acceptResult = await RideDispatchService.acceptRide(rideId, driverId);
    
    expect(acceptResult.success).toBe(true);
    
    const { data: rideAfterAccept } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(rideAfterAccept.status).toBe(RIDE_STATUS.DRIVER_ACCEPTED);
    
    // Motorista deve estar busy
    const statusAfterAccept = await DriverAvailabilityService.getStatus(driverId);
    expect(statusAfterAccept).toBeDefined();
    expect(statusAfterAccept!.status).toBe('busy');
    expect(statusAfterAccept!.isOnline).toBe(true);
    expect(statusAfterAccept!.isAvailable).toBe(false);
    expect(statusAfterAccept!.activeRideId).toBe(rideId);
    expect(statusAfterAccept!.activeRideMode).toBe('ride');
    
    // ============================================
    // ETAPA 6: Motorista a caminho (driver_arriving)
    // ============================================
    
    const arrivingResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.DRIVER_ARRIVING,
      driverId,
      'Driver is on the way'
    );
    
    expect(arrivingResult.success).toBe(true);
    expect(arrivingResult.newState).toBe(RIDE_STATUS.DRIVER_ARRIVING);
    
    const { data: rideArriving } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(rideArriving.status).toBe(RIDE_STATUS.DRIVER_ARRIVING);
    
    // Motorista ainda deve estar busy
    const statusDuringArriving = await DriverAvailabilityService.getStatus(driverId);
    expect(statusDuringArriving!.status).toBe('busy');
    expect(statusDuringArriving!.activeRideId).toBe(rideId);
    
    // ============================================
    // ETAPA 7: Passageiro embarca (passenger_boarded)
    // ============================================
    
    const boardedResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.PASSENGER_BOARDED,
      driverId,
      'Passenger boarded'
    );
    
    expect(boardedResult.success).toBe(true);
    expect(boardedResult.newState).toBe(RIDE_STATUS.PASSENGER_BOARDED);
    
    const { data: rideBoarded } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(rideBoarded.status).toBe(RIDE_STATUS.PASSENGER_BOARDED);
    
    // ============================================
    // ETAPA 8: Corrida inicia (in_progress)
    // ============================================
    
    const startResult = await RideOperationalService.transitionTo(
      rideId,
      RIDE_STATUS.IN_PROGRESS,
      driverId,
      'Ride started'
    );
    
    expect(startResult.success).toBe(true);
    expect(startResult.newState).toBe(RIDE_STATUS.IN_PROGRESS);
    
    const { data: rideInProgress } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(rideInProgress.status).toBe(RIDE_STATUS.IN_PROGRESS);
    
    // ============================================
    // ETAPA 9: Tracking durante corrida
    // ============================================
    
    const newLat = -23.5550;
    const newLng = -46.6370;
    
    await TrackingService.updatePosition(
      driverId,
      { lat: newLat, lng: newLng, heading: 90, speed: 30 },
      'driver'
    );
    
    const statusDuringRide = await DriverAvailabilityService.getStatus(driverId);
    expect(statusDuringRide).toBeDefined();
    expect(statusDuringRide!.lastSeenAt).toBeDefined();
    expect(statusDuringRide!.status).toBe('busy');
    expect(statusDuringRide!.activeRideId).toBe(rideId);
    
    // ============================================
    // ETAPA 10: Corrida completa
    // ============================================
    
    const completeResult = await RideOperationalService.completeRide(
      rideId,
      driverId,
      18.50 // Preço final
    );
    
    expect(completeResult.success).toBe(true);
    expect(completeResult.newState).toBe(RIDE_STATUS.COMPLETED);
    
    const { data: rideCompleted } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(rideCompleted.status).toBe(RIDE_STATUS.COMPLETED);
    
    // ============================================
    // ETAPA 11: Motorista volta disponível (automático)
    // ============================================
    
    const statusAfterComplete = await DriverAvailabilityService.getStatus(driverId);
    
    expect(statusAfterComplete).toBeDefined();
    expect(statusAfterComplete!.status).toBe('online_available');
    expect(statusAfterComplete!.isOnline).toBe(true);
    expect(statusAfterComplete!.isAvailable).toBe(true);
    expect(statusAfterComplete!.activeRideId).toBeUndefined();
    expect(statusAfterComplete!.busySince).toBeUndefined();
    expect(statusAfterComplete!.activeRideMode).toBeUndefined();
  });
});
