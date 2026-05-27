/**
 * GATE 6 - DIAGNÓSTICO MÍNIMO: createRide()
 * 
 * Reprodução mínima para diagnosticar por que createRide() falha.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RideOperationalService } from '@/modules/mobility/core/RideOperationalService';
import { supabase } from '@/integrations/supabase';

// Carregar fixtures
const fixturesPath = join(__dirname, '../fixtures/gate6-fixtures.json');
const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

// Service role client para limpeza e setup
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

describe('DIAGNÓSTICO: createRide()', () => {
  const passengerId = fixtures.passengers.passengerA.id;
  const pickupAddressId = fixtures.addressIds.pickup;
  const dropoffAddressId = fixtures.addressIds.dropoff;
  const pickupLocationId = fixtures.locationIds.primary;
  const dropoffLocationId = fixtures.locationIds.primary;
  const pickupLat = fixtures.coords.pickup.lat;
  const pickupLng = fixtures.coords.pickup.lng;
  const dropoffLat = fixtures.coords.dropoff.lat;
  const dropoffLng = fixtures.coords.dropoff.lng;

  beforeEach(async () => {
    // Limpar corridas anteriores
    await supabaseAdmin
      .from('ride_requests')
      .delete()
      .eq('passenger_profile_id', passengerId);
    
    // ✅ AUTENTICAR como o passageiro
    console.log('\n🔐 Autenticando como passageiro...');
    
    // Buscar user_id do passageiro
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('id', passengerId)
      .single();
    
    if (!profile?.user_id) {
      throw new Error(`Passageiro ${passengerId} não tem user_id`);
    }
    
    // Buscar email do usuário
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
    
    if (!user?.email) {
      throw new Error(`User ${profile.user_id} não tem email`);
    }
    
    console.log(`   Email: ${user.email}`);
    
    // ✅ RESETAR senha para garantir que é TestPass123!
    await supabaseAdmin.auth.admin.updateUserById(profile.user_id, {
      password: 'TestPass123!',
    });
    
    // Autenticar no client padrão
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: 'TestPass123!',
    });
    
    if (signInError) {
      throw new Error(`Falha ao autenticar: ${signInError.message}`);
    }
    
    console.log(`   ✅ Autenticado como ${user.email}`);
  });
  
  afterEach(async () => {
    // Deslogar após o teste
    await supabase.auth.signOut();
  });

  it('Deve criar corrida com campos canônicos', async () => {
    console.log('\n📊 DIAGNÓSTICO createRide()');
    console.log('=====================================');
    console.log('INPUT:');
    console.log(`  passengerProfileId: ${passengerId}`);
    console.log(`  pickupAddressId: ${pickupAddressId}`);
    console.log(`  dropoffAddressId: ${dropoffAddressId}`);
    console.log(`  pickupLocationId: ${pickupLocationId}`);
    console.log(`  dropoffLocationId: ${dropoffLocationId}`);
    console.log(`  originLat: ${pickupLat}`);
    console.log(`  originLng: ${pickupLng}`);
    console.log(`  destinationLat: ${dropoffLat}`);
    console.log(`  destinationLng: ${dropoffLng}`);
    console.log(`  mode: ride`);
    console.log(`  suggestedPrice: 15.00`);
    
    console.log('\n1️⃣ Chamando createRide()...');
    const result = await RideOperationalService.createRide({
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
    
    console.log('\nRESULTADO createRide():');
    console.log(`  success: ${result.success}`);
    console.log(`  rideId: ${result.rideId || 'N/A'}`);
    console.log(`  newState: ${result.newState || 'N/A'}`);
    console.log(`  error: ${result.error || 'N/A'}`);
    
    if (!result.success) {
      console.log('\n❌ ERRO BRUTO:');
      console.log(JSON.stringify(result, null, 2));
      
      // Tentar buscar erro do Supabase diretamente
      console.log('\n🔍 Tentando INSERT direto para ver erro bruto...');
      const { data, error } = await supabaseAdmin
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
          status: 'requested',
          suggested_price: 15.00,
        })
        .select();
      
      if (error) {
        console.log('\n❌ ERRO BRUTO DO SUPABASE:');
        console.log(`  code: ${error.code}`);
        console.log(`  message: ${error.message}`);
        console.log(`  details: ${error.details}`);
        console.log(`  hint: ${error.hint}`);
        console.log('\nERRO COMPLETO:');
        console.log(JSON.stringify(error, null, 2));
      } else {
        console.log('\n✅ INSERT direto funcionou!');
        console.log(`  rideId: ${data?.[0]?.id}`);
      }
    }
    
    console.log('=====================================\n');
    
    expect(result.success).toBe(true);
    expect(result.rideId).toBeDefined();
    expect(result.newState).toBe('searching_driver');
  });
});
