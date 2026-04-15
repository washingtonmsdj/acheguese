#!/usr/bin/env node

/**
 * DIAGNÓSTICO: VERDADE OPERACIONAL DO DISPATCH REMOTO
 * 
 * Descobre se dispatch é automático ou manual no banco remoto.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('🔍 DIAGNÓSTICO: VERDADE OPERACIONAL DO DISPATCH REMOTO\n');
console.log('=' .repeat(80));

// ============================================
// 1. TRIGGERS EM ride_requests
// ============================================
console.log('\n1️⃣ TRIGGERS EM ride_requests:\n');

const { data: triggers, error: triggersError } = await supabase.rpc('exec_sql', {
  query: `
    SELECT 
      trigger_name,
      event_manipulation,
      action_statement,
      action_timing
    FROM information_schema.triggers
    WHERE event_object_table = 'ride_requests'
    ORDER BY trigger_name;
  `
});

if (triggersError) {
  console.log('⚠️ Não foi possível buscar triggers (função exec_sql não existe)');
  console.log('   Tentando abordagem alternativa...\n');
} else if (triggers && triggers.length > 0) {
  triggers.forEach(t => {
    console.log(`📌 ${t.trigger_name}`);
    console.log(`   Evento: ${t.event_manipulation}`);
    console.log(`   Timing: ${t.action_timing}`);
    console.log(`   Action: ${t.action_statement}`);
    console.log('');
  });
} else {
  console.log('✅ Nenhum trigger encontrado em ride_requests\n');
}

// ============================================
// 2. BUSCAR FUNÇÕES RELACIONADAS A DISPATCH
// ============================================
console.log('2️⃣ FUNÇÕES SQL RELACIONADAS A DISPATCH:\n');

// Tentar buscar via query direta
const { data: functions, error: functionsError } = await supabase.rpc('exec_sql', {
  query: `
    SELECT 
      routine_name,
      routine_type
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND (
        routine_name ILIKE '%dispatch%'
        OR routine_name ILIKE '%assign%'
      )
    ORDER BY routine_name;
  `
});

if (functionsError) {
  console.log('⚠️ Não foi possível buscar funções\n');
} else if (functions && functions.length > 0) {
  functions.forEach(f => {
    console.log(`📌 ${f.routine_name} (${f.routine_type})`);
  });
  console.log('');
} else {
  console.log('✅ Nenhuma função de dispatch encontrada\n');
}

// ============================================
// 3. VERIFICAR POLICIES DE ride_requests
// ============================================
console.log('3️⃣ RLS POLICIES EM ride_requests:\n');

const { data: ridePolicies, error: ridePoliciesError } = await supabase.rpc('exec_sql', {
  query: `
    SELECT 
      policyname,
      cmd,
      roles::text,
      qual,
      with_check
    FROM pg_policies
    WHERE tablename = 'ride_requests'
    ORDER BY policyname;
  `
});

if (ridePoliciesError) {
  console.log('⚠️ Não foi possível buscar policies\n');
} else if (ridePolicies && ridePolicies.length > 0) {
  ridePolicies.forEach(p => {
    console.log(`📌 ${p.policyname}`);
    console.log(`   Comando: ${p.cmd}`);
    console.log(`   Roles: ${p.roles}`);
    console.log(`   USING: ${p.qual || 'N/A'}`);
    console.log(`   WITH CHECK: ${p.with_check || 'N/A'}`);
    console.log('');
  });
} else {
  console.log('✅ Nenhuma policy encontrada\n');
}

// ============================================
// 4. VERIFICAR POLICIES DE driver_availability
// ============================================
console.log('4️⃣ RLS POLICIES EM driver_availability:\n');

const { data: driverPolicies, error: driverPoliciesError } = await supabase.rpc('exec_sql', {
  query: `
    SELECT 
      policyname,
      cmd,
      roles::text,
      qual,
      with_check
    FROM pg_policies
    WHERE tablename = 'driver_availability'
    ORDER BY policyname;
  `
});

if (driverPoliciesError) {
  console.log('⚠️ Não foi possível buscar policies\n');
} else if (driverPolicies && driverPolicies.length > 0) {
  driverPolicies.forEach(p => {
    console.log(`📌 ${p.policyname}`);
    console.log(`   Comando: ${p.cmd}`);
    console.log(`   Roles: ${p.roles}`);
    console.log(`   USING: ${p.qual || 'N/A'}`);
    console.log(`   WITH CHECK: ${p.with_check || 'N/A'}`);
    console.log('');
  });
} else {
  console.log('✅ Nenhuma policy encontrada\n');
}

// ============================================
// 5. TESTE PRÁTICO: CRIAR CORRIDA E VER O QUE ACONTECE
// ============================================
console.log('5️⃣ TESTE PRÁTICO: Criar corrida e observar comportamento\n');

// Buscar um passageiro e endereços de teste
const { data: passenger } = await supabase
  .from('profiles')
  .select('id')
  .eq('profile_type', 'personal')
  .limit(1)
  .maybeSingle();

const { data: address } = await supabase
  .from('addresses')
  .select('id, location_id')
  .limit(1)
  .maybeSingle();

if (passenger && address) {
  console.log(`   Passageiro: ${passenger.id}`);
  console.log(`   Address: ${address.id}`);
  console.log(`   Location: ${address.location_id}\n`);
  
  // Criar corrida
  const { data: ride, error: rideError } = await supabase
    .from('ride_requests')
    .insert({
      passenger_profile_id: passenger.id,
      pickup_address_id: address.id,
      dropoff_address_id: address.id,
      pickup_location_id: address.location_id,
      dropoff_location_id: address.location_id,
      origin_lat: -23.5505,
      origin_lng: -46.6333,
      destination_lat: -23.5600,
      destination_lng: -46.6400,
      status: 'requested',
      suggested_price: 15.00,
    })
    .select()
    .single();
  
  if (rideError) {
    console.log(`   ❌ Erro ao criar corrida: ${rideError.message}\n`);
  } else {
    console.log(`   ✅ Corrida criada: ${ride.id}`);
    console.log(`   Status inicial: ${ride.status}\n`);
    
    // Aguardar 2 segundos para ver se há mudança automática
    console.log('   ⏳ Aguardando 2s para verificar mudança automática...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Buscar novamente
    const { data: rideAfter } = await supabase
      .from('ride_requests')
      .select('status, driver_profile_id')
      .eq('id', ride.id)
      .single();
    
    console.log(`   Status após 2s: ${rideAfter.status}`);
    console.log(`   Driver atribuído: ${rideAfter.driver_profile_id || 'N/A'}\n`);
    
    if (rideAfter.status !== ride.status) {
      console.log('   🚨 DISPATCH AUTOMÁTICO DETECTADO!');
      console.log(`   Status mudou de "${ride.status}" para "${rideAfter.status}"\n`);
    } else {
      console.log('   ✅ Nenhuma mudança automática detectada\n');
    }
    
    // Limpar
    await supabase.from('ride_requests').delete().eq('id', ride.id);
    console.log('   🧹 Corrida de teste removida\n');
  }
} else {
  console.log('   ⚠️ Não foi possível criar corrida de teste (faltam dados)\n');
}

console.log('=' .repeat(80));
console.log('\n✅ Diagnóstico concluído\n');
