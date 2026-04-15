#!/usr/bin/env tsx

/**
 * FIX OLD PROFILES
 * Atualiza perfis antigos (sem handle) para terem handles válidos
 * REQUER: Service role key
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('   Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixOldProfiles() {
  console.log('🔧 CORRIGINDO PERFIS ANTIGOS\n');

  // 1. Buscar perfis sem handle
  console.log('1. Buscando perfis sem handle...');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, user_id, display_name, profile_type')
    .is('handle', null);

  if (error) {
    console.log(`❌ Erro ao buscar perfis: ${error.message}`);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('✅ Nenhum perfil sem handle encontrado\n');
    return;
  }

  console.log(`📊 Encontrados: ${profiles.length} perfis sem handle\n`);

  // 2. Atualizar cada perfil
  console.log('2. Atualizando handles...');
  let updated = 0;
  let failed = 0;

  for (const profile of profiles) {
    // Gerar handle baseado no tipo e ID
    const handle = `${profile.profile_type}-${profile.id.substring(0, 8)}`;
    
    console.log(`   Atualizando perfil ${profile.id.substring(0, 8)}...`);
    console.log(`   Tipo: ${profile.profile_type}`);
    console.log(`   Handle: @${handle}`);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ handle })
      .eq('id', profile.id);

    if (updateError) {
      console.log(`   ❌ Erro: ${updateError.message}\n`);
      failed++;
    } else {
      console.log(`   ✅ Atualizado\n`);
      updated++;
    }
  }

  // 3. Resumo
  console.log('=== RESUMO ===');
  console.log(`✅ Atualizados: ${updated}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log(`📊 Total: ${profiles.length}\n`);

  if (failed === 0) {
    console.log('🎉 TODOS OS PERFIS CORRIGIDOS COM SUCESSO');
  } else {
    console.log('⚠️  ALGUNS PERFIS NÃO FORAM CORRIGIDOS');
  }
}

fixOldProfiles().catch(console.error);

