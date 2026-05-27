/**
 * DEBUG: createRide() - Diagnóstico Cirúrgico
 * 
 * Objetivo: Provar estado exato após createRide()
 */

import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RideOperationalService } from '@/modules/mobility/core/RideOperationalService';
import { authenticateAsProfile } from '../helpers/auth-helper';

const fixturesPath = join(__dirname, '../fixtures/gate6-fixtures.json');
const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

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

describe('DEBUG: createRide()', () => {
  it('Deve mostrar estado exato após createRide()', async () => {
    const passengerId = fixtures.passengers.passengerA.id;
    const pickupAddressId = fixtures.addressIds.pickup;
    const dropoffAddressId = fixtures.addressIds.dropoff;
    const pickupLocationId = fixtures.locationIds.primary;
    const dropoffLocationId = fixtures.locationIds.primary;
    const pickupLat = fixtures.coords.pickup.lat;
    const pickupLng = fixtures.coords.pickup.lng;
    const dropoffLat = fixtures.coords.dropoff.lat;
    const dropoffLng = fixtures.coords.dropoff.lng;

    // Limpar
    await supabaseAdmin
      .from('ride_requests')
      .delete()
      .eq('passenger_profile_id', passengerId);

    console.log('\n🔍 DEBUG: createRide()');
    console.log('=' .repeat(80));
    
    // Autenticar como passageiro
    console.log('\n1️⃣ Autenticando como passageiro...');
    await authenticateAsProfile(passengerId);
    console.log(`   ✅ Autenticado como passageiro: ${passengerId}`);
    
    // Criar corrida
    console.log('\n2️⃣ Chamando RideOperationalService.createRide()...');
    console.log('   Payload:');
    console.log(`     passengerProfileId: ${passengerId}`);
    console.log(`     pickupAddressId: ${pickupAddressId}`);
    console.log(`     dropoffAddressId: ${dropoffAddressId}`);
    console.log(`     pickupLocationId: ${pickupLocationId}`);
    console.log(`     dropoffLocationId: ${dropoffLocationId}`);
    console.log(`     originLat: ${pickupLat}`);
    console.log(`     originLng: ${pickupLng}`);
    console.log(`     destinationLat: ${dropoffLat}`);
    console.log(`     destinationLng: ${dropoffLng}`);
    console.log(`     mode: ride`);
    console.log(`     suggestedPrice: 15.00`);
    
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
    
    console.log('\n3️⃣ Resultado de createRide():');
    console.log(`   success: ${result.success}`);
    console.log(`   rideId: ${result.rideId || 'N/A'}`);
    console.log(`   newState: ${result.newState || 'N/A'}`);
    console.log(`   error: ${result.error || 'N/A'}`);
    
    if (!result.success || !result.rideId) {
      console.log('\n❌ ERRO: createRide() falhou');
      console.log('   Resultado completo:', JSON.stringify(result, null, 2));
      throw new Error('createRide() falhou');
    }
    
    // Buscar estado IMEDIATAMENTE após o insert
    console.log('\n4️⃣ Buscando estado IMEDIATAMENTE após createRide()...');
    const { data: rideImmediate, error: immediateError } = await supabaseAdmin
      .from('ride_requests')
      .select('id, status, driver_profile_id, created_at, updated_at')
      .eq('id', result.rideId)
      .single();
    
    if (immediateError) {
      console.log('   ❌ Erro ao buscar:', immediateError);
      throw immediateError;
    }
    
    console.log('   Estado IMEDIATO:');
    console.log(`     id: ${rideImmediate.id}`);
    console.log(`     status: ${rideImmediate.status}`);
    console.log(`     driver_profile_id: ${rideImmediate.driver_profile_id || 'NULL'}`);
    console.log(`     created_at: ${rideImmediate.created_at}`);
    console.log(`     updated_at: ${rideImmediate.updated_at}`);
    
    // Aguardar 1 segundo e buscar novamente
    console.log('\n5️⃣ Aguardando 1s e buscando novamente...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: rideAfter, error: afterError } = await supabaseAdmin
      .from('ride_requests')
      .select('id, status, driver_profile_id, created_at, updated_at')
      .eq('id', result.rideId)
      .single();
    
    if (afterError) {
      console.log('   ❌ Erro ao buscar:', afterError);
      throw afterError;
    }
    
    console.log('   Estado APÓS 1s:');
    console.log(`     id: ${rideAfter.id}`);
    console.log(`     status: ${rideAfter.status}`);
    console.log(`     driver_profile_id: ${rideAfter.driver_profile_id || 'NULL'}`);
    console.log(`     created_at: ${rideAfter.created_at}`);
    console.log(`     updated_at: ${rideAfter.updated_at}`);
    
    // Comparar
    if (rideImmediate.status !== rideAfter.status) {
      console.log('\n🚨 MUDANÇA DE STATUS DETECTADA!');
      console.log(`   De: "${rideImmediate.status}" → Para: "${rideAfter.status}"`);
      console.log('   Isso indica automação ou trigger no banco!');
    } else {
      console.log('\n✅ Status permaneceu estável');
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Limpar
    await supabaseAdmin.from('ride_requests').delete().eq('id', result.rideId);
    
    // Validação
    expect(result.success).toBe(true);
    expect(result.rideId).toBeDefined();
  });
});
