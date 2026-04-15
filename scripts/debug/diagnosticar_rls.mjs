#!/usr/bin/env node

/**
 * DIAGNÓSTICO RLS - Verificar por que INSERT está sendo bloqueado
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL?.trim(),
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
);

async function diagnosticar() {
  console.log('🔍 DIAGNÓSTICO RLS - ride_requests\n');

  // 1. Verificar usuário autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('❌ Usuário não autenticado:', authError?.message);
    return;
  }

  console.log('✅ Usuário autenticado:', user.id);

  // 2. Buscar profiles do usuário
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id, display_name')
    .eq('user_id', user.id);

  if (profileError) {
    console.error('❌ Erro ao buscar profiles:', profileError.message);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.error('❌ PROBLEMA: Usuário não tem profile!');
    console.log('   Solução: Criar profile para o usuário');
    return;
  }

  console.log('✅ Profiles encontrados:', profiles.length);
  profiles.forEach(p => {
    console.log(`   - ${p.id} (${p.display_name || 'sem nome'})`);
  });

  const profileId = profiles[0].id;

  // 3. Testar INSERT mínimo
  console.log('\n🧪 Testando INSERT mínimo...');
  
  const { data: testRide, error: insertError } = await supabase
    .from('ride_requests')
    .insert({
      passenger_profile_id: profileId,
      status: 'requested',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ INSERT bloqueado:', insertError.message);
    console.log('\n📋 Detalhes do erro:');
    console.log(JSON.stringify(insertError, null, 2));

    // 4. Verificar políticas RLS
    console.log('\n🔐 Verificando políticas RLS...');
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies', { table_name: 'ride_requests' })
      .catch(() => ({ data: null, error: { message: 'RPC não disponível' } }));

    if (policyError) {
      console.log('⚠️  Não foi possível verificar políticas via RPC');
      console.log('   Execute no SQL Editor:');
      console.log('   SELECT * FROM pg_policies WHERE tablename = \'ride_requests\';');
    } else if (policies) {
      console.log('✅ Políticas encontradas:');
      console.log(JSON.stringify(policies, null, 2));
    }

    return;
  }

  console.log('✅ INSERT funcionou!');
  console.log('   Ride ID:', testRide.id);

  // 5. Limpar teste
  await supabase
    .from('ride_requests')
    .delete()
    .eq('id', testRide.id);

  console.log('✅ Teste limpo');

  console.log('\n✅ RLS está funcionando corretamente!');
  console.log('   O problema pode estar no código da aplicação.');
}

diagnosticar().catch(console.error);
