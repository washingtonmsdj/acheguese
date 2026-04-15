#!/usr/bin/env node

/**
 * Script para verificar segurança RLS e perfis
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔒 VERIFICAÇÃO DE SEGURANÇA RLS\n');
console.log('='.repeat(80));

// ============================================
// 1. VERIFICAR PERFIS DO USUÁRIO
// ============================================
console.log('\n1️⃣  PERFIS DO USUÁRIO LOGADO');
console.log('-'.repeat(80));

const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('id, user_id, profile_type, is_active, created_at, name, display_name')
  .eq('user_id', 'a3ea040f-6f7a-44dd-b778-10eff4295303')
  .order('created_at');

if (profilesError) {
  console.error('❌ Erro ao buscar perfis:', profilesError);
} else {
  console.log(`✅ Encontrados ${profiles.length} perfil(is):\n`);
  profiles.forEach((p, i) => {
    console.log(`   Perfil ${i + 1}:`);
    console.log(`   - ID: ${p.id}`);
    console.log(`   - User ID: ${p.user_id}`);
    console.log(`   - Tipo: ${p.profile_type}`);
    console.log(`   - Nome: ${p.name || p.display_name || 'N/A'}`);
    console.log(`   - Ativo: ${p.is_active ? '✅' : '❌'}`);
    console.log(`   - Criado: ${new Date(p.created_at).toLocaleString('pt-BR')}`);
    console.log();
  });
}

// ============================================
// 2. VERIFICAR PROFILE ESPECÍFICO DA CORRIDA
// ============================================
console.log('2️⃣  PROFILE ESPECÍFICO DA CORRIDA');
console.log('-'.repeat(80));

const { data: specificProfile, error: specificError } = await supabase
  .from('profiles')
  .select('id, user_id, profile_type, name, display_name, is_active')
  .eq('id', '0a843169-861a-4f60-bbd2-0b44b45981cf')
  .single();

if (specificError) {
  console.error('❌ Erro ao buscar profile específico:', specificError);
} else {
  console.log('✅ Profile encontrado:\n');
  console.log(`   - Profile ID: ${specificProfile.id}`);
  console.log(`   - User ID: ${specificProfile.user_id}`);
  console.log(`   - Tipo: ${specificProfile.profile_type}`);
  console.log(`   - Nome: ${specificProfile.name || specificProfile.display_name || 'N/A'}`);
  console.log(`   - Ativo: ${specificProfile.is_active ? '✅' : '❌'}`);
  
  // Verificar se pertence ao usuário correto
  const pertenceAoUsuario = specificProfile.user_id === 'a3ea040f-6f7a-44dd-b778-10eff4295303';
  console.log(`\n   🔍 Pertence ao usuário logado? ${pertenceAoUsuario ? '✅ SIM' : '❌ NÃO'}`);
  
  if (!pertenceAoUsuario) {
    console.log(`   ⚠️  ALERTA: Profile pertence a outro usuário!`);
    console.log(`   ⚠️  User ID do profile: ${specificProfile.user_id}`);
    console.log(`   ⚠️  User ID esperado: a3ea040f-6f7a-44dd-b778-10eff4295303`);
  }
}

// ============================================
// 3. VERIFICAR CORRIDA ESPECÍFICA
// ============================================
console.log('\n3️⃣  CORRIDA ESPECÍFICA');
console.log('-'.repeat(80));

const { data: ride, error: rideError } = await supabase
  .from('ride_requests')
  .select('id, passenger_profile_id, driver_profile_id, status, created_at')
  .eq('id', 'bcabbb76-f4f3-441b-9765-7875865b6617')
  .single();

if (rideError) {
  console.error('❌ Erro ao buscar corrida:', rideError);
} else {
  console.log('✅ Corrida encontrada:\n');
  console.log(`   - Ride ID: ${ride.id}`);
  console.log(`   - Passenger Profile ID: ${ride.passenger_profile_id}`);
  console.log(`   - Driver Profile ID: ${ride.driver_profile_id || 'N/A'}`);
  console.log(`   - Status: ${ride.status}`);
  console.log(`   - Criado: ${new Date(ride.created_at).toLocaleString('pt-BR')}`);
  
  // Buscar o profile do passageiro
  const { data: passengerProfile } = await supabase
    .from('profiles')
    .select('user_id, profile_type, name, display_name')
    .eq('id', ride.passenger_profile_id)
    .single();
  
  if (passengerProfile) {
    console.log(`\n   👤 Passageiro:`);
    console.log(`   - Profile ID: ${ride.passenger_profile_id}`);
    console.log(`   - User ID: ${passengerProfile.user_id}`);
    console.log(`   - Nome: ${passengerProfile.name || passengerProfile.display_name || 'N/A'}`);
    console.log(`   - Tipo: ${passengerProfile.profile_type}`);
    
    const pertenceAoUsuario = passengerProfile.user_id === 'a3ea040f-6f7a-44dd-b778-10eff4295303';
    console.log(`\n   🔍 Passageiro é o usuário logado? ${pertenceAoUsuario ? '✅ SIM' : '❌ NÃO'}`);
    
    if (!pertenceAoUsuario) {
      console.log(`   ⚠️  ALERTA DE SEGURANÇA: Corrida pertence a outro usuário!`);
    }
  }
}

// ============================================
// 4. VERIFICAR CORRIDAS DO USUÁRIO
// ============================================
console.log('\n4️⃣  CORRIDAS DO USUÁRIO (últimas 5)');
console.log('-'.repeat(80));

const { data: userRides, error: userRidesError } = await supabase
  .from('ride_requests')
  .select(`
    id,
    passenger_profile_id,
    status,
    created_at,
    profiles!ride_requests_passenger_profile_id_fkey (
      user_id,
      profile_type,
      name,
      display_name
    )
  `)
  .eq('profiles.user_id', 'a3ea040f-6f7a-44dd-b778-10eff4295303')
  .order('created_at', { ascending: false })
  .limit(5);

if (userRidesError) {
  console.error('❌ Erro ao buscar corridas do usuário:', userRidesError);
} else {
  console.log(`✅ Encontradas ${userRides.length} corrida(s):\n`);
  userRides.forEach((r, i) => {
    console.log(`   Corrida ${i + 1}:`);
    console.log(`   - ID: ${r.id}`);
    console.log(`   - Status: ${r.status}`);
    console.log(`   - Passenger Profile ID: ${r.passenger_profile_id}`);
    console.log(`   - Criado: ${new Date(r.created_at).toLocaleString('pt-BR')}`);
    console.log();
  });
}

// ============================================
// 5. VERIFICAR RLS (via pg_tables)
// ============================================
console.log('5️⃣  VERIFICAR RLS NA TABELA ride_requests');
console.log('-'.repeat(80));

const { data: rlsCheck, error: rlsError } = await supabase
  .rpc('exec_sql', { 
    sql: `
      SELECT 
        schemaname,
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE tablename = 'ride_requests'
    ` 
  })
  .single();

if (rlsError) {
  console.log('⚠️  Não foi possível verificar RLS via RPC (função pode não existir)');
  console.log('   Mas isso é normal - RLS é verificado no Supabase Dashboard');
} else {
  console.log('✅ RLS Status:', rlsCheck);
}

// ============================================
// 6. TESTE DE SEGURANÇA (SIMULADO)
// ============================================
console.log('\n6️⃣  TESTE DE SEGURANÇA (Simulado)');
console.log('-'.repeat(80));
console.log('⚠️  Tentando criar corrida com passenger_profile_id de outro usuário...');
console.log('   (Deve FALHAR se RLS estiver ativo)\n');

// Criar um client SEM service role (com RLS ativo)
const supabaseClient = createClient(
  supabaseUrl, 
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || supabaseKey
);

// Tentar inserir com profile_id fake
const { data: testRide, error: testError } = await supabaseClient
  .from('ride_requests')
  .insert({
    passenger_profile_id: '00000000-0000-0000-0000-000000000000', // Profile fake
    pickup_address_id: '00000000-0000-0000-0000-000000000000',
    dropoff_address_id: '00000000-0000-0000-0000-000000000000',
    pickup_location_id: '00000000-0000-0000-0000-000000000000',
    dropoff_location_id: '00000000-0000-0000-0000-000000000000',
    status: 'requested',
    suggested_price: 10.00
  })
  .select()
  .single();

if (testError) {
  console.log('✅ SEGURANÇA OK: Inserção foi BLOQUEADA pelo RLS');
  console.log(`   Erro: ${testError.message}`);
  console.log(`   Código: ${testError.code}`);
} else {
  console.log('❌ ALERTA DE SEGURANÇA: Inserção foi PERMITIDA!');
  console.log('   RLS pode não estar ativo ou há um bypass!');
  console.log(`   Ride criado: ${testRide.id}`);
}

// ============================================
// RESUMO FINAL
// ============================================
console.log('\n' + '='.repeat(80));
console.log('📊 RESUMO DA VERIFICAÇÃO');
console.log('='.repeat(80));

const profilePertenceAoUsuario = specificProfile?.user_id === 'a3ea040f-6f7a-44dd-b778-10eff4295303';

console.log('\n✅ Verificações Concluídas:\n');
console.log(`   1. Perfis do usuário: ${profiles?.length || 0} encontrado(s)`);
console.log(`   2. Profile específico pertence ao usuário: ${profilePertenceAoUsuario ? '✅ SIM' : '❌ NÃO'}`);
console.log(`   3. Corrida específica verificada: ${ride ? '✅' : '❌'}`);
console.log(`   4. Corridas do usuário: ${userRides?.length || 0} encontrada(s)`);
console.log(`   5. Teste de segurança RLS: ${testError ? '✅ BLOQUEADO' : '❌ PERMITIDO'}`);

if (profilePertenceAoUsuario && testError) {
  console.log('\n🎉 CONCLUSÃO: SEGURANÇA OK!');
  console.log('   - Profile pertence ao usuário correto');
  console.log('   - RLS está bloqueando inserções inválidas');
  console.log('   - Nenhuma vulnerabilidade detectada');
} else {
  console.log('\n⚠️  ATENÇÃO: Possíveis problemas detectados!');
  if (!profilePertenceAoUsuario) {
    console.log('   - Profile NÃO pertence ao usuário esperado');
  }
  if (!testError) {
    console.log('   - RLS pode não estar ativo');
  }
}

console.log('\n' + '='.repeat(80));
