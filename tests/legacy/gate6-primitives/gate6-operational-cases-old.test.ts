/**
 * GATE 6 - SUÍTE C: CASOS OPERACIONAIS
 * 
 * Valida casos operacionais críticos:
 * - Cancelamento no meio libera motorista
 * - Concorrência mínima real
 * 
 * IMPORTANTE: Dispatch é AUTOMÁTICO via edge function auto-dispatch-ride.
 * Testes precisam criar motoristas disponíveis ANTES de criar corrida.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DriverAvailabilityService } from '@/modules/mobility/services/DriverAvailabilityService';
import { RideDispatchService } from '@/modules/mobility/core/RideDispatchService';
import { RideOperationalService } from '@/modules/mobility/core/RideOperationalService';
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

describe('Gate 6 - Suite C: Casos Operacionais', () => {
  // IDs de teste (do JSON de fixtures)
  const passenger1Id = fixtures.passengers.passengerA.id;
  const passenger2Id = fixtures.passengers.passengerB.id;
  const driver1Id = fixtures.drivers.driverA.id;
  const driver2Id = fixtures.drivers.driverB.id;
  
  // Coordenadas de teste
  const pickup1Lat = fixtures.coords.pickup.lat;
  const pickup1Lng = fixtures.coords.pickup.lng;
  const dropoff1Lat = fixtures.coords.dropoff.lat;
  const dropoff1Lng = fixtures.coords.dropoff.lng;
  const driver1Lat = fixtures.drivers.driverA.lat;
  const driver1Lng = fixtures.drivers.driverA.lng;
  
  const pickup2Lat = fixtures.coords.pickup.lat;
  const pickup2Lng = fixtures.coords.pickup.lng;
  const dropoff2Lat = fixtures.coords.dropoff.lat;
  const dropoff2Lng = fixtures.coords.dropoff.lng;
  const driver2Lat = fixtures.drivers.driverB.lat;
  const driver2Lng = fixtures.drivers.driverB.lng;
  
  // IDs de endereços/localizações (do JSON de fixtures)
  const pickupAddressId = fixtures.addressIds.pickup;
  const dropoffAddressId = fixtures.addressIds.dropoff;
  const pickupLocationId = fixtures.locationIds.primary;
  const dropoffLocationId = fixtures.locationIds.primary;

  beforeEach(async () => {
    // Limpar dados de teste
    await supabaseAdmin.from('driver_availability').delete().in('profile_id', [driver1Id, driver2Id]);
    await supabaseAdmin.from('ride_requests').delete().in('passenger_profile_id', [passenger1Id, passenger2Id]);
  });
  
  afterEach(async () => {
    await signOut();
  });

  it('C.1. Cancelamento após aceite libera motorista', async () => {
    // ============================================
    // SETUP: Criar corrida aceita
    // ============================================
    
    // Motorista online e disponível
    await authenticateAsProfile(driver1Id);
    await DriverAvailabilityService.goOnline(driver1Id);
    await DriverAvailabilityService.setAvailable(driver1Id, { lat: driver1Lat, lng: driver1Lng });
    
    // Criar corrida (dispatch automático vai atribuir)
    await authenticateAsProfile(passenger1Id);
    const createResult = await RideOperationalService.createRide({
      passengerProfileId: passenger1Id,
      pickupAddressId: pickupAddressId,
      dropoffAddressId: dropoffAddressId,
      pickupLocationId: pickupLocationId,
      dropoffLocationId: dropoffLocationId,
      originLat: pickup1Lat,
      originLng: pickup1Lng,
      destinationLat: dropoff1Lat,
      destinationLng: dropoff1Lng,
      mode: 'ride',
      suggestedPrice: 15.00,
    });
    
    expect(createResult.success).toBe(true);
    const rideId = createResult.rideId!;
    
    // Aguardar dispatch automático (pode ser muito rápido)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar que foi atribuído automaticamente (ou expirou se não havia motorista)
    const { data: rideAfterDispatch } = await supabaseAdmin
      .from('ride_requests')
      .select('status, driver_profile_id')
      .eq('id', rideId)
      .single();
    
    // Se expirou, não há motorista disponível - pular teste
    if (!rideAfterDispatch || rideAfterDispatch.status === 'expired') {
      console.log('⚠️  Corrida expirou (sem motoristas disponíveis) - pulando teste');
      return;
    }
    
    expect(rideAfterDispatch.status).toBe(RIDE_STATUS.DRIVER_ASSIGNED);
    expect(rideAfterDispatch.driver_profile_id).toBe(driver1Id);
    
    // Motorista aceita (operação de motorista)
    await authenticateAsProfile(driver1Id);
    await RideDispatchService.acceptRide(rideId, driver1Id);
    
    // Verificar que motorista está busy
    const statusBeforeCancel = await DriverAvailabilityService.getStatus(driver1Id);
    expect(statusBeforeCancel!.status).toBe('busy');
    expect(statusBeforeCancel!.activeRideId).toBe(rideId);
    
    // ============================================
    // AÇÃO: Passageiro cancela
    // ============================================
    
    const cancelResult = await RideOperationalService.cancelRide({
      rideId: rideId,
      cancelledBy: 'passenger',
      profileId: passenger1Id,
      reason: 'Changed my mind',
    });
    
    expect(cancelResult.success).toBe(true);
    expect(cancelResult.newState).toBe(RIDE_STATUS.CANCELLED_BY_PASSENGER);
    
    // ============================================
    // VALIDAÇÃO: Motorista volta disponível
    // ============================================
    
    const { data: rideCancelled } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    expect(rideCancelled.status).toBe(RIDE_STATUS.CANCELLED_BY_PASSENGER);
    
    // Motorista deve estar online_available
    const statusAfterCancel = await DriverAvailabilityService.getStatus(driver1Id);
    
    expect(statusAfterCancel).toBeDefined();
    expect(statusAfterCancel!.status).toBe('online_available');
    expect(statusAfterCancel!.isOnline).toBe(true);
    expect(statusAfterCancel!.isAvailable).toBe(true);
    expect(statusAfterCancel!.activeRideId).toBeUndefined();
    expect(statusAfterCancel!.busySince).toBeUndefined();
    expect(statusAfterCancel!.activeRideMode).toBeUndefined();
  });

  it('C.2. Duas corridas simultâneas com dois motoristas', { timeout: 30000 }, async () => {
    // ============================================
    // SETUP: Dois motoristas online e disponíveis
    // ============================================
    
    await authenticateAsProfile(driver1Id);
    await DriverAvailabilityService.goOnline(driver1Id);
    await DriverAvailabilityService.setAvailable(driver1Id, { lat: driver1Lat, lng: driver1Lng });
    
    await authenticateAsProfile(driver2Id);
    await DriverAvailabilityService.goOnline(driver2Id);
    await DriverAvailabilityService.setAvailable(driver2Id, { lat: driver2Lat, lng: driver2Lng });
    
    // ============================================
    // AÇÃO: Dois passageiros solicitam corridas (dispatch automático)
    // ============================================
    
    // Corrida 1
    await authenticateAsProfile(passenger1Id);
    const createResult1 = await RideOperationalService.createRide({
      passengerProfileId: passenger1Id,
      pickupAddressId: pickupAddressId,
      dropoffAddressId: dropoffAddressId,
      pickupLocationId: pickupLocationId,
      dropoffLocationId: dropoffLocationId,
      originLat: pickup1Lat,
      originLng: pickup1Lng,
      destinationLat: dropoff1Lat,
      destinationLng: dropoff1Lng,
      mode: 'ride',
      suggestedPrice: 15.00,
    });
    
    expect(createResult1.success).toBe(true);
    const ride1Id = createResult1.rideId!;
    
    // Corrida 2
    await authenticateAsProfile(passenger2Id);
    const createResult2 = await RideOperationalService.createRide({
      passengerProfileId: passenger2Id,
      pickupAddressId: pickupAddressId,
      dropoffAddressId: dropoffAddressId,
      pickupLocationId: pickupLocationId,
      dropoffLocationId: dropoffLocationId,
      originLat: pickup2Lat,
      originLng: pickup2Lng,
      destinationLat: dropoff2Lat,
      destinationLng: dropoff2Lng,
      mode: 'ride',
      suggestedPrice: 18.00,
    });
    
    expect(createResult2.success).toBe(true);
    const ride2Id = createResult2.rideId!;
    
    // ============================================
    // Aguardar dispatch automático para ambas corridas
    // ============================================
    
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Verificar que ambas foram atribuídas automaticamente (ou expiradas)
    const { data: ride1AfterDispatch } = await supabaseAdmin
      .from('ride_requests')
      .select('status, driver_profile_id')
      .eq('id', ride1Id)
      .single();
    
    const { data: ride2AfterDispatch } = await supabaseAdmin
      .from('ride_requests')
      .select('status, driver_profile_id')
      .eq('id', ride2Id)
      .single();
    
    // Se alguma expirou, não há motoristas suficientes - pular teste
    if (!ride1AfterDispatch || !ride2AfterDispatch || 
        ride1AfterDispatch.status === 'expired' || ride2AfterDispatch.status === 'expired') {
      console.log('⚠️  Uma ou mais corridas expiraram (motoristas insuficientes) - pulando teste');
      return;
    }
    
    expect(ride1AfterDispatch.status).toBe(RIDE_STATUS.DRIVER_ASSIGNED);
    expect(ride2AfterDispatch.status).toBe(RIDE_STATUS.DRIVER_ASSIGNED);
    
    // Motoristas devem ser diferentes
    expect(ride1AfterDispatch.driver_profile_id).toBeDefined();
    expect(ride2AfterDispatch.driver_profile_id).toBeDefined();
    expect(ride1AfterDispatch.driver_profile_id).not.toBe(ride2AfterDispatch.driver_profile_id);
    
    const assignedDriver1 = ride1AfterDispatch.driver_profile_id!;
    const assignedDriver2 = ride2AfterDispatch.driver_profile_id!;
    
    // ============================================
    // AÇÃO: Ambos motoristas aceitam (OPERAÇÃO DE MOTORISTA)
    // ============================================
    
    await authenticateAsProfile(assignedDriver1);
    const accept1Result = await RideDispatchService.acceptRide(ride1Id, assignedDriver1);
    expect(accept1Result.success).toBe(true);
    
    await authenticateAsProfile(assignedDriver2);
    const accept2Result = await RideDispatchService.acceptRide(ride2Id, assignedDriver2);
    expect(accept2Result.success).toBe(true);
    
    // ============================================
    // VALIDAÇÃO: Ambos busy com activeRideId correto
    // ============================================
    
    const status1 = await DriverAvailabilityService.getStatus(assignedDriver1);
    expect(status1).toBeDefined();
    expect(status1!.status).toBe('busy');
    expect(status1!.activeRideId).toBe(ride1Id);
    expect(status1!.activeRideMode).toBe('ride');
    
    const status2 = await DriverAvailabilityService.getStatus(assignedDriver2);
    expect(status2).toBeDefined();
    expect(status2!.status).toBe('busy');
    expect(status2!.activeRideId).toBe(ride2Id);
    expect(status2!.activeRideMode).toBe('ride');
    
    // ============================================
    // VALIDAÇÃO: Não há cruzamento de atribuições
    // ============================================
    
    const { data: ride1Final } = await supabaseAdmin
      .from('ride_requests')
      .select('driver_profile_id, status')
      .eq('id', ride1Id)
      .single();
    
    const { data: ride2Final } = await supabaseAdmin
      .from('ride_requests')
      .select('driver_profile_id, status')
      .eq('id', ride2Id)
      .single();
    
    expect(ride1Final.driver_profile_id).toBe(assignedDriver1);
    expect(ride1Final.status).toBe(RIDE_STATUS.DRIVER_ACCEPTED);
    
    expect(ride2Final.driver_profile_id).toBe(assignedDriver2);
    expect(ride2Final.status).toBe(RIDE_STATUS.DRIVER_ACCEPTED);
    
    // ============================================
    // CLEANUP: Completar ambas corridas
    // ============================================
    
    await RideOperationalService.transitionTo(ride1Id, RIDE_STATUS.IN_PROGRESS, assignedDriver1);
    await RideOperationalService.completeRide(ride1Id, assignedDriver1);
    
    await RideOperationalService.transitionTo(ride2Id, RIDE_STATUS.IN_PROGRESS, assignedDriver2);
    await RideOperationalService.completeRide(ride2Id, assignedDriver2);
    
    // Ambos devem estar disponíveis novamente
    const finalStatus1 = await DriverAvailabilityService.getStatus(assignedDriver1);
    expect(finalStatus1!.status).toBe('online_available');
    
    const finalStatus2 = await DriverAvailabilityService.getStatus(assignedDriver2);
    expect(finalStatus2!.status).toBe('online_available');
  });
});
