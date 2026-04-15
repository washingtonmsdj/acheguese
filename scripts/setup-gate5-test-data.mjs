#!/usr/bin/env node

/**
 * GATE 5: SETUP DE FIXTURES PARA TESTES OPERACIONAIS
 * 
 * Script idempotente para criar dados de teste necessários para validar Gate 5
 * 
 * Uso:
 *   node scripts/setup-gate5-test-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos');
  console.error('Configure as variáveis de ambiente no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================
// FIXTURES
// ============================================

const TEST_DRIVERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Driver 1 Gate5',
    profile_type: 'driver',
    rating: 5.0,
    can_do_delivery: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Driver 2 Gate5',
    profile_type: 'driver',
    rating: 4.8,
    can_do_delivery: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Driver 3 Gate5',
    profile_type: 'driver',
    rating: 4.5,
    can_do_delivery: false,
  },
];

const TEST_RIDES = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    passenger_id: '00000000-0000-0000-0000-000000000001', // Usar driver 1 como passageiro para simplificar
    pickup_lat: -23.5505,
    pickup_lng: -46.6333,
    dropoff_lat: -23.5606,
    dropoff_lng: -46.6434,
    status: 'pending',
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    passenger_id: '00000000-0000-0000-0000-000000000001',
    pickup_lat: -23.5505,
    pickup_lng: -46.6333,
    dropoff_lat: -23.5606,
    dropoff_lng: -46.6434,
    status: 'pending',
  },
];

// ============================================
// FUNÇÕES DE SETUP
// ============================================

async function findExistingDriverProfiles() {
  console.log('📝 Buscando perfis de motorista existentes...');
  
  // Buscar perfis de motorista que já existem
  const { data: existingProfiles, error } = await supabase
    .from('profiles')
    .select('id, user_id, name, profile_type')
    .eq('profile_type', 'driver')
    .limit(3);
  
  if (error) {
    console.error('❌ Erro ao buscar perfis:', error.message);
    throw error;
  }
  
  if (!existingProfiles || existingProfiles.length === 0) {
    console.error('❌ ERRO: Nenhum perfil de motorista encontrado no banco');
    console.error('⚠️ Crie pelo menos 3 perfis de motorista antes de executar este script');
    throw new Error('No driver profiles found');
  }
  
  console.log(`✅ Encontrados ${existingProfiles.length} perfis de motorista existentes`);
  return existingProfiles;
}

async function ensureTestDrivers(existingProfiles) {
  console.log('📝 Garantindo motoristas de teste...');
  
  const testDriverIds = [];
  
  // Usar apenas perfis existentes (não criar novos)
  const numDrivers = Math.min(existingProfiles.length, 3);
  
  for (let i = 0; i < numDrivers; i++) {
    testDriverIds.push(existingProfiles[i].id);
    console.log(`✅ Usando perfil existente: ${existingProfiles[i].id} (${existingProfiles[i].name})`);
  }
  
  // Garantir que todos os IDs têm driver_data
  for (const driverId of testDriverIds) {
    const { data: existingDriverData } = await supabase
      .from('driver_data')
      .select('profile_id')
      .eq('profile_id', driverId)
      .maybeSingle();
    
    if (!existingDriverData) {
      const { error: driverDataError } = await supabase
        .from('driver_data')
        .upsert({
          profile_id: driverId,
          rating: 5.0,
          can_do_delivery: true,
        }, {
          onConflict: 'profile_id',
        });
      
      if (driverDataError) {
        console.error(`❌ Erro ao criar driver_data ${driverId}:`, driverDataError.message);
        throw driverDataError;
      } else {
        console.log(`✅ driver_data criado para ${driverId}`);
      }
    } else {
      console.log(`✅ driver_data já existe para ${driverId}`);
    }
  }
  
  console.log(`✅ ${testDriverIds.length} motoristas de teste prontos`);
  return testDriverIds;
}

async function createTestRides(testDriverIds) {
  console.log('📝 Criando corridas de teste...');
  
  // Deletar corridas existentes primeiro
  await supabase
    .from('ride_requests')
    .delete()
    .in('id', [
      '00000000-0000-0000-0000-000000000101',
      '00000000-0000-0000-0000-000000000102',
    ]);
  
  const rides = [
    {
      id: '00000000-0000-0000-0000-000000000101',
      passenger_profile_id: testDriverIds[0],
      pickup_location: { lat: -23.5505, lng: -46.6333, address: 'Teste Pickup 1' },
      dropoff_location: { lat: -23.5606, lng: -46.6434, address: 'Teste Dropoff 1' },
      status: 'pending',
    },
    {
      id: '00000000-0000-0000-0000-000000000102',
      passenger_profile_id: testDriverIds[0],
      pickup_location: { lat: -23.5505, lng: -46.6333, address: 'Teste Pickup 2' },
      dropoff_location: { lat: -23.5606, lng: -46.6434, address: 'Teste Dropoff 2' },
      status: 'pending',
    },
  ];
  
  const { data, error } = await supabase
    .from('ride_requests')
    .insert(rides)
    .select();
  
  if (error) {
    console.error('❌ Erro ao criar corridas:', error.message);
    console.error('Código:', error.code);
    console.error('Detalhes:', error.details);
    console.error('Hint:', error.hint);
    throw error;
  }
  
  console.log(`✅ ${data?.length || 0} corridas criadas`);
  data?.forEach(ride => {
    console.log(`  - ${ride.id}`);
  });
}

async function cleanupDriverAvailability(testDriverIds) {
  console.log('🧹 Limpando driver_availability de teste...');
  
  const { error } = await supabase
    .from('driver_availability')
    .delete()
    .in('profile_id', testDriverIds);
  
  if (error) {
    console.error('❌ Erro ao limpar driver_availability:', error.message);
    throw error;
  }
  
  console.log('✅ driver_availability limpo');
}

async function verifySetup(testDriverIds) {
  console.log('🔍 Verificando setup...');
  
  // Verificar perfis
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, profile_type')
    .in('id', testDriverIds);
  
  if (profilesError) {
    console.error('❌ Erro ao verificar perfis:', profilesError.message);
    return false;
  }
  
  if (profiles.length !== testDriverIds.length) {
    console.error(`❌ Esperado ${testDriverIds.length} perfis, encontrado ${profiles.length}`);
    return false;
  }
  
  console.log(`✅ ${profiles.length} perfis verificados`);
  
  // Verificar driver_data
  const { data: driverData, error: driverDataError } = await supabase
    .from('driver_data')
    .select('profile_id')
    .in('profile_id', testDriverIds);
  
  if (driverDataError) {
    console.error('❌ Erro ao verificar driver_data:', driverDataError.message);
    return false;
  }
  
  if (driverData.length !== testDriverIds.length) {
    console.error(`❌ Esperado ${testDriverIds.length} driver_data, encontrado ${driverData.length}`);
    return false;
  }
  
  console.log(`✅ ${driverData.length} driver_data verificados`);
  
  // Salvar IDs para os testes
  console.log('\n📋 IDs dos motoristas de teste:');
  testDriverIds.forEach((id, index) => {
    console.log(`  Driver ${index + 1}: ${id}`);
  });
  
  return true;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🚀 GATE 5: Setup de Fixtures para Testes Operacionais\n');
  
  try {
    // 1. Buscar perfis de motorista existentes
    const existingProfiles = await findExistingDriverProfiles();
    
    // 2. Garantir motoristas de teste
    const testDriverIds = await ensureTestDrivers(existingProfiles);
    
    // 3. Criar corridas de teste
    await createTestRides(testDriverIds);
    
    // 4. Limpar driver_availability
    await cleanupDriverAvailability(testDriverIds);
    
    // 5. Verificar setup
    const verified = await verifySetup(testDriverIds);
    
    if (verified) {
      console.log('\n✅ Setup completo! Fixtures prontas para testes operacionais.');
      console.log('\n⚠️ IMPORTANTE: Atualize os testes para usar os IDs acima');
      console.log('\nExecute os testes com:');
      console.log('  npm test tests/operational/gate5-availability-test.test.ts');
      process.exit(0);
    } else {
      console.error('\n❌ Setup incompleto. Verifique os erros acima.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Erro durante setup:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
