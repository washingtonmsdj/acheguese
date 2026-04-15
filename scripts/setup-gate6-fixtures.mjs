#!/usr/bin/env node

/**
 * GATE 6: SETUP DE FIXTURES ROBUSTAS
 * 
 * REGRA CRÍTICA: Cria 3 motoristas DISTINTOS e 2 passageiros DISTINTOS.
 * Se não houver suficientes, CRIA novos perfis reais.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuração
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas:');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('🚀 Iniciando setup de fixtures do Gate 6...\n');

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function findOrCreateLocation() {
  console.log('📍 Buscando location de teste...');
  
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name')
    .in('type', ['city', 'district'])
    .limit(1);
  
  if (error) throw error;
  
  if (locations && locations.length > 0) {
    console.log(`   ✅ Location encontrada: ${locations[0].name} (${locations[0].id})`);
    return locations[0].id;
  }
  
  throw new Error('Nenhuma location encontrada. Execute migrations primeiro.');
}

async function findOrCreateAddress(locationId, type) {
  console.log(`📮 Buscando/criando address de ${type}...`);
  
  const { data: existing } = await supabase
    .from('addresses')
    .select('id')
    .eq('location_id', locationId)
    .limit(1)
    .maybeSingle();
  
  if (existing) {
    console.log(`   ✅ Address encontrado: ${existing.id}`);
    return existing.id;
  }
  
  const coords = type === 'pickup' 
    ? { lat: -23.5505, lng: -46.6333 }
    : { lat: -23.5600, lng: -46.6400 };
  
  const { data: newAddress, error } = await supabase
    .from('addresses')
    .insert({
      location_id: locationId,
      street: `Rua Teste ${type}`,
      number: type === 'pickup' ? '100' : '200',
      neighborhood: 'Bairro Teste',
      city: 'Salvador',
      state: 'BA',
      country: 'Brasil',
      postal_code: type === 'pickup' ? '40000-000' : '40000-001',
      lat: coords.lat,
      lng: coords.lng,
    })
    .select('id')
    .single();
  
  if (error) throw error;
  
  console.log(`   ✅ Address criado: ${newAddress.id}`);
  return newAddress.id;
}

async function createAuthUser(email, password) {
  // Verificar se usuário já existe
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const existing = users.find(u => u.email === email);
  
  if (existing) {
    return existing.id;
  }
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  if (error) throw error;
  return data.user.id;
}

async function ensureDistinctPassengers(locationId, count) {
  console.log(`👤 Garantindo ${count} passageiros DISTINTOS...`);
  
  // Buscar passageiros existentes
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('profile_type', 'personal')
    .limit(count * 2);
  
  // Filtrar apenas não-motoristas
  const { data: drivers } = await supabase
    .from('driver_data')
    .select('profile_id');
  
  const driverIds = new Set(drivers?.map(d => d.profile_id) || []);
  const nonDrivers = (existing || []).filter(p => !driverIds.has(p.id));
  
  const needed = count - nonDrivers.length;
  
  if (needed > 0) {
    console.log(`   📝 Criando ${needed} passageiro(s) adicional(is)...`);
    
    for (let i = 0; i < needed; i++) {
      const suffix = randomBytes(4).toString('hex');
      const email = `gate6-passenger-${suffix}@test.ordax.com`;
      const username = `gate6-passenger-${suffix}`;
      
      const userId = await createAuthUser(email, 'TestPass123!');
      
      // Verificar se já existe perfil para este user_id
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existingProfile) {
        nonDrivers.push({ id: existingProfile.id, username: existingProfile.username });
        console.log(`      ✅ Passageiro reutilizado: ${existingProfile.username} (${existingProfile.id})`);
        continue;
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          username,
          name: `Gate6 Passenger ${suffix}`,
          location_id: locationId,
          profile_type: 'personal',
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      nonDrivers.push({ id: profile.id, username });
      console.log(`      ✅ Passageiro criado: ${username} (${profile.id})`);
    }
  }
  
  const selected = nonDrivers.slice(0, count);
  console.log(`   ✅ ${count} passageiros distintos garantidos`);
  selected.forEach((p, i) => {
    console.log(`      ${i + 1}. ${p.username || 'sem username'} (${p.id})`);
  });
  
  return selected.map(p => p.id);
}

async function ensureDistinctDrivers(locationId, count) {
  console.log(`🚗 Garantindo ${count} motoristas DISTINTOS...`);
  
  // Buscar motoristas existentes
  const { data: existing } = await supabase
    .from('driver_data')
    .select('profile_id, profiles!inner(username)')
    .eq('is_verified', true)
    .limit(count * 2);
  
  const needed = count - (existing?.length || 0);
  
  const allDrivers = [...(existing || [])];
  
  if (needed > 0) {
    console.log(`   📝 Criando ${needed} motorista(s) adicional(is)...`);
    
    for (let i = 0; i < needed; i++) {
      const suffix = randomBytes(4).toString('hex');
      const email = `gate6-driver-${suffix}@test.ordax.com`;
      const username = `gate6-driver-${suffix}`;
      
      const userId = await createAuthUser(email, 'TestPass123!');
      
      // Verificar se já existe perfil para este user_id
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existingProfile) {
        // Verificar se tem driver_data
        const { data: driverData } = await supabase
          .from('driver_data')
          .select('profile_id')
          .eq('profile_id', existingProfile.id)
          .maybeSingle();
        
        if (!driverData) {
          // Criar driver_data
          await supabase
            .from('driver_data')
            .insert({
              profile_id: existingProfile.id,
              rating: 4.5 + Math.random() * 0.5,
              can_do_delivery: true,
              is_verified: true,
            });
        }
        
        allDrivers.push({ 
          profile_id: existingProfile.id, 
          profiles: { username: existingProfile.username } 
        });
        console.log(`      ✅ Motorista reutilizado: ${existingProfile.username} (${existingProfile.id})`);
        continue;
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          username,
          name: `Gate6 Driver ${suffix}`,
          location_id: locationId,
          profile_type: 'personal',
        })
        .select('id')
        .single();
      
      if (profileError) throw profileError;
      
      const { error: driverError } = await supabase
        .from('driver_data')
        .insert({
          profile_id: profile.id,
          rating: 4.5 + Math.random() * 0.5,
          can_do_delivery: true,
          is_verified: true,
        });
      
      if (driverError) throw driverError;
      
      allDrivers.push({ 
        profile_id: profile.id, 
        profiles: { username } 
      });
      console.log(`      ✅ Motorista criado: ${username} (${profile.id})`);
    }
  }
  
  const selected = allDrivers.slice(0, count);
  console.log(`   ✅ ${count} motoristas distintos garantidos`);
  selected.forEach((d, i) => {
    console.log(`      ${i + 1}. ${d.profiles?.username || 'sem username'} (${d.profile_id})`);
  });
  
  return selected.map(d => d.profile_id);
}

async function cleanupDriverAvailability(driverIds) {
  console.log('🧹 Limpando driver_availability (RESTRITO às fixtures do Gate 6)...');
  
  const { error } = await supabase
    .from('driver_availability')
    .delete()
    .in('profile_id', driverIds);
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  console.log(`   ✅ Limpeza concluída (${driverIds.length} motoristas)`);
}

async function cleanupRideRequests(passengerIds) {
  console.log('🧹 Limpando ride_requests (RESTRITO às fixtures do Gate 6)...');
  
  const { error } = await supabase
    .from('ride_requests')
    .delete()
    .in('passenger_profile_id', passengerIds);
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  console.log(`   ✅ Limpeza concluída (${passengerIds.length} passageiros)`);
}

// ============================================
// MAIN
// ============================================

async function main() {
  try {
    // 1. Location
    const locationId = await findOrCreateLocation();
    
    // 2. Addresses
    const pickupAddressId = await findOrCreateAddress(locationId, 'pickup');
    const dropoffAddressId = await findOrCreateAddress(locationId, 'dropoff');
    
    // 3. Passageiros DISTINTOS (cria se necessário)
    const passengerIds = await ensureDistinctPassengers(locationId, 2);
    const [passengerAId, passengerBId] = passengerIds;
    
    // 4. Motoristas DISTINTOS (cria se necessário)
    const driverIds = await ensureDistinctDrivers(locationId, 3);
    const [driverAId, driverBId, driverCId] = driverIds;
    
    // Validação crítica: IDs devem ser DISTINTOS
    if (driverAId === driverBId || driverBId === driverCId || driverAId === driverCId) {
      throw new Error('ERRO CRÍTICO: Motoristas não são distintos!');
    }
    
    if (passengerAId === passengerBId) {
      throw new Error('ERRO CRÍTICO: Passageiros não são distintos!');
    }
    
    // 5. Cleanup RESTRITO
    await cleanupDriverAvailability(driverIds);
    await cleanupRideRequests(passengerIds);
    
    // 6. Gerar JSON de fixtures
    const fixtures = {
      locationIds: {
        primary: locationId,
      },
      addressIds: {
        pickup: pickupAddressId,
        dropoff: dropoffAddressId,
      },
      passengers: {
        passengerA: { id: passengerAId },
        passengerB: { id: passengerBId },
      },
      drivers: {
        driverA: { id: driverAId, lat: -23.5510, lng: -46.6340 },
        driverB: { id: driverBId, lat: -23.5520, lng: -46.6350 },
        driverC: { id: driverCId, lat: -23.5600, lng: -46.6500 },
      },
      coords: {
        pickup: { lat: -23.5505, lng: -46.6333 },
        dropoff: { lat: -23.5600, lng: -46.6400 },
      },
    };
    
    const fixturesDir = `${__dirname}/../tests/fixtures`;
    mkdirSync(fixturesDir, { recursive: true });
    
    const fixturesPath = `${fixturesDir}/gate6-fixtures.json`;
    writeFileSync(fixturesPath, JSON.stringify(fixtures, null, 2));
    
    console.log('\n✅ Setup concluído com sucesso!');
    console.log(`📄 Fixtures salvas em: ${fixturesPath}`);
    console.log('\n📊 Resumo:');
    console.log(`   Location: ${locationId}`);
    console.log(`   Addresses: 2`);
    console.log(`   Passageiros DISTINTOS: 2`);
    console.log(`     - passengerA: ${passengerAId}`);
    console.log(`     - passengerB: ${passengerBId}`);
    console.log(`   Motoristas DISTINTOS: 3`);
    console.log(`     - driverA: ${driverAId}`);
    console.log(`     - driverB: ${driverBId}`);
    console.log(`     - driverC: ${driverCId}`);
    console.log('\n✅ VALIDAÇÃO: Todos os IDs são DISTINTOS');
    console.log('\n🧪 Execute os testes com:');
    console.log('   npm test -- tests/operational/gate6');
    
  } catch (error) {
    console.error('\n❌ Erro no setup:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
