/**
 * GATE 6 - DIAGNÓSTICO MÍNIMO: setAvailable()
 * 
 * Reprodução mínima para diagnosticar por que setAvailable() falha.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DriverAvailabilityService } from '@/modules/mobility/services/DriverAvailabilityService';
import { supabase } from '@/integrations/supabase';

// Carregar fixtures
const fixturesPath = join(__dirname, '../fixtures/gate6-fixtures.json');
const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf-8'));

// Service role client para setup
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

describe('DIAGNÓSTICO: setAvailable()', () => {
  const driverId = fixtures.drivers.driverA.id;
  const lat = fixtures.drivers.driverA.lat;
  const lng = fixtures.drivers.driverA.lng;
  
  beforeEach(async () => {
    // ✅ AUTENTICAR como o motorista
    console.log('\n🔐 Autenticando como motorista...');
    
    // Buscar user_id do motorista
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('id', driverId)
      .single();
    
    if (!profile?.user_id) {
      throw new Error(`Motorista ${driverId} não tem user_id`);
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
  it('Deve aceitar coordenadas e marcar motorista como disponível', async () => {
    const driverId = fixtures.drivers.driverA.id;
    const lat = fixtures.drivers.driverA.lat;
    const lng = fixtures.drivers.driverA.lng;
    
    console.log('\n📊 DIAGNÓSTICO setAvailable()');
    console.log('=====================================');
    console.log('INPUT:');
    console.log(`  driverId: ${driverId}`);
    console.log(`  lat: ${lat}`);
    console.log(`  lng: ${lng}`);
    
    // Primeiro: goOnline
    console.log('\n1️⃣ Chamando goOnline()...');
    const onlineResult = await DriverAvailabilityService.goOnline(driverId);
    console.log('RESULTADO goOnline():');
    console.log(`  success: ${onlineResult.success}`);
    console.log(`  message: ${onlineResult.message || 'N/A'}`);
    console.log(`  error: ${onlineResult.error || 'N/A'}`);
    
    expect(onlineResult.success).toBe(true);
    
    // Segundo: setAvailable com coordenadas
    console.log('\n2️⃣ Chamando setAvailable()...');
    const availableResult = await DriverAvailabilityService.setAvailable(
      driverId,
      { lat, lng }
    );
    
    console.log('RESULTADO setAvailable():');
    console.log(`  success: ${availableResult.success}`);
    console.log(`  message: ${availableResult.message || 'N/A'}`);
    console.log(`  error: ${availableResult.error || 'N/A'}`);
    
    if (!availableResult.success) {
      console.log('\n❌ ERRO BRUTO:');
      console.log(JSON.stringify(availableResult, null, 2));
    }
    
    // Terceiro: getStatus para confirmar
    console.log('\n3️⃣ Verificando status final...');
    const status = await DriverAvailabilityService.getStatus(driverId);
    
    console.log('STATUS FINAL:');
    console.log(`  status: ${status?.status || 'N/A'}`);
    console.log(`  isOnline: ${status?.isOnline || 'N/A'}`);
    console.log(`  isAvailable: ${status?.isAvailable || 'N/A'}`);
    console.log(`  currentLocation: ${JSON.stringify(status?.currentLocation) || 'N/A'}`);
    console.log('=====================================\n');
    
    expect(availableResult.success).toBe(true);
    expect(status?.status).toBe('online_available');
    expect(status?.isAvailable).toBe(true);
    expect(status?.currentLocation).toEqual({ lat, lng });
  });
});
