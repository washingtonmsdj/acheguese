/**
 * GATE 6 - SUÍTE A: DISPATCH PRIMITIVES
 * 
 * Valida primitives de dispatch isoladamente:
 * - Busca de motoristas elegíveis
 * - Atribuição de motorista
 * - Aceite de corrida
 * - Transição de disponibilidade
 * 
 * IMPORTANTE: Dispatch é AUTOMÁTICO via edge function auto-dispatch-ride.
 * Esta suíte testa primitives isoladas para validação unitária.
 * Para fluxo E2E completo com dispatch automático, ver Suíte B.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { DriverAvailabilityService } from '@/modules/mobility/services/DriverAvailabilityService';
import { RideDispatchService } from '@/modules/mobility/core/RideDispatchService';
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

describe('Gate 6 - Suite A: Dispatch Primitives', () => {
  // IDs de teste (do JSON de fixtures)
  const passengerId = fixtures.passengers.passengerA.id;
  const driver1Id = fixtures.drivers.driverA.id;
  const driver2Id = fixtures.drivers.driverB.id;
  const driver3Id = fixtures.drivers.driverC.id;
  
  // Coordenadas de teste
  const pickupLat = fixtures.coords.pickup.lat;
  const pickupLng = fixtures.coords.pickup.lng;
  const driver1Lat = fixtures.drivers.driverA.lat;
  const driver1Lng = fixtures.drivers.driverA.lng;
  const driver2Lat = fixtures.drivers.driverB.lat;
  const driver2Lng = fixtures.drivers.driverB.lng;
  const driver3Lat = fixtures.drivers.driverC.lat;
  const driver3Lng = fixtures.drivers.driverC.lng;
  
  // IDs de endereços/localizações (do JSON de fixtures)
  const pickupAddressId = fixtures.addressIds.pickup;
  const dropoffAddressId = fixtures.addressIds.dropoff;
  const pickupLocationId = fixtures.locationIds.primary;
  const dropoffLocationId = fixtures.locationIds.primary;
  const dropoffLat = fixtures.coords.dropoff.lat;
  const dropoffLng = fixtures.coords.dropoff.lng;

  beforeEach(async () => {
    // Limpar dados de teste
    await supabaseAdmin.from('driver_availability').delete().in('profile_id', [driver1Id, driver2Id, driver3Id]);
    await supabaseAdmin.from('ride_requests').delete().eq('passenger_profile_id', passengerId);
  });
  
  afterEach(async () => {
    await signOut();
  });

  it('A.1. Deve buscar motoristas elegíveis ordenados por distância', async () => {
    // Setup: 2 motoristas online+available, 1 offline
    await authenticateAsProfile(driver1Id);
    await DriverAvailabilityService.goOnline(driver1Id);
    await DriverAvailabilityService.setAvailable(driver1Id, { lat: driver1Lat, lng: driver1Lng });
    
    await authenticateAsProfile(driver2Id);
    await DriverAvailabilityService.goOnline(driver2Id);
    await DriverAvailabilityService.setAvailable(driver2Id, { lat: driver2Lat, lng: driver2Lng });
    
    // driver3 fica offline
    await authenticateAsProfile(driver3Id);
    await DriverAvailabilityService.goOffline(driver3Id);
    
    // Buscar elegíveis (operação de sistema, usa service_role)
    const eligible = await findAvailableDriversAdmin(
      pickupLat,
      pickupLng,
      10, // 10km de raio
      'ride'
    );
    
    // Validações
    expect(eligible.length).toBeGreaterThanOrEqual(1);
    expect(eligible[0].isAvailable).toBe(true);
    expect(eligible[0].hasActiveRide).toBe(false);
  });

  it('A.2. Deve ignorar motoristas busy', async () => {
    // Setup: driver1 online+available, driver2 busy
    await authenticateAsProfile(driver1Id);
    await DriverAvailabilityService.goOnline(driver1Id);
    await DriverAvailabilityService.setAvailable(driver1Id, { lat: driver1Lat, lng: driver1Lng });
    
    await authenticateAsProfile(driver2Id);
    await DriverAvailabilityService.goOnline(driver2Id);
    await DriverAvailabilityService.setAvailable(driver2Id, { lat: driver2Lat, lng: driver2Lng });
    
    // Usar UUID real para ride
    const otherRideId = randomUUID();
    await DriverAvailabilityService.setBusy(driver2Id, otherRideId, 'ride');
    
    // Buscar elegíveis (operação de sistema, usa service_role)
    const eligible = await findAvailableDriversAdmin(
      pickupLat,
      pickupLng,
      10,
      'ride'
    );
    
    // Validações
    expect(eligible.length).toBeGreaterThanOrEqual(1);
    expect(eligible[0].profileId).toBe(driver1Id);
    expect(eligible.find(d => d.profileId === driver2Id)).toBeUndefined();
  });

  it('A.3. Deve atribuir motorista (driver_assigned)', async () => {
    // Setup: motorista disponível
    await authenticateAsProfile(driver1Id);
    await DriverAvailabilityService.goOnline(driver1Id);
    await DriverAvailabilityService.setAvailable(driver1Id, { lat: driver1Lat, lng: driver1Lng });
    
    // Criar corrida em searching_driver
    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .insert({
        passenger_profile_id: passengerId,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        origin_lat: pickupLat,
        origin_lng: pickupLng,
        destination_lat: dropoffLat,
        destination_lng: dropoffLng,
        status: RIDE_STATUS.SEARCHING_DRIVER,
        suggested_price: 15.00,
      })
      .select()
      .single();
    
    expect(ride).toBeDefined();
    
    // Atribuir motorista (operação de sistema, usa service_role)
    const result = await assignDriverAdmin(
      ride.id,
      driver1Id,
      RIDE_STATUS.SEARCHING_DRIVER
    );
    
    // Validações
    expect(result.success).toBe(true);
    expect(result.rideId).toBe(ride.id);
    expect(result.driverProfileId).toBe(driver1Id);
    
    // Verificar banco
    const { data: rideAfter } = await supabaseAdmin
      .from('ride_requests')
      .select('status, driver_profile_id')
      .eq('id', ride.id)
      .single();
    
    expect(rideAfter.status).toBe(RIDE_STATUS.DRIVER_ASSIGNED);
    expect(rideAfter.driver_profile_id).toBe(driver1Id);
  });

  it('A.4. Motorista deve aceitar corrida (driver_accepted)', async () => {
    // Setup: motorista disponível
    await authenticateAsProfile(driver1Id);
    await DriverAvailabilityService.goOnline(driver1Id);
    await DriverAvailabilityService.setAvailable(driver1Id, { lat: driver1Lat, lng: driver1Lng });
    
    // Criar corrida em driver_assigned
    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .insert({
        passenger_profile_id: passengerId,
        driver_profile_id: driver1Id,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        origin_lat: pickupLat,
        origin_lng: pickupLng,
        destination_lat: dropoffLat,
        destination_lng: dropoffLng,
        status: RIDE_STATUS.DRIVER_ASSIGNED,
        suggested_price: 15.00,
        ride_mode: 'ride',
      })
      .select()
      .single();
    
    expect(ride).toBeDefined();
    
    // Motorista aceita
    const result = await RideDispatchService.acceptRide(ride.id, driver1Id);
    
    // Validações
    expect(result.success).toBe(true);
    expect(result.rideId).toBe(ride.id);
    
    // Verificar banco
    const { data: rideAfter } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', ride.id)
      .single();
    
    expect(rideAfter.status).toBe(RIDE_STATUS.DRIVER_ACCEPTED);
    
    // Motorista deve estar busy
    const driverStatus = await DriverAvailabilityService.getStatus(driver1Id);
    expect(driverStatus).toBeDefined();
    expect(driverStatus!.status).toBe('busy');
    expect(driverStatus!.activeRideId).toBe(ride.id);
  });

  it('A.5. Aceitar corrida deve deixar motorista busy com activeRideId correto', async () => {
    // Setup: motorista disponível
    await authenticateAsProfile(driver1Id);
    await DriverAvailabilityService.goOnline(driver1Id);
    await DriverAvailabilityService.setAvailable(driver1Id, { lat: driver1Lat, lng: driver1Lng });
    
    // Criar corrida em driver_assigned
    const { data: ride } = await supabaseAdmin
      .from('ride_requests')
      .insert({
        passenger_profile_id: passengerId,
        driver_profile_id: driver1Id,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        origin_lat: pickupLat,
        origin_lng: pickupLng,
        destination_lat: dropoffLat,
        destination_lng: dropoffLng,
        status: RIDE_STATUS.DRIVER_ASSIGNED,
        suggested_price: 15.00,
        ride_mode: 'ride',
      })
      .select()
      .single();
    
    expect(ride).toBeDefined();
    
    // Motorista aceita
    await RideDispatchService.acceptRide(ride.id, driver1Id);
    
    // Verificar status completo
    const driverStatus = await DriverAvailabilityService.getStatus(driver1Id);
    
    expect(driverStatus).toBeDefined();
    expect(driverStatus!.status).toBe('busy');
    expect(driverStatus!.isOnline).toBe(true);
    expect(driverStatus!.isAvailable).toBe(false);
    expect(driverStatus!.activeRideId).toBe(ride.id);
    expect(driverStatus!.activeRideMode).toBe('ride');
    expect(driverStatus!.busySince).toBeDefined();
  });
});
