#!/usr/bin/env node

/**
 * VERIFICAR E CRIAR PROFILE
 * Verifica se o usuário autenticado tem profile e cria se necessário
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL?.trim(),
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
);

async function verificarECriarProfile() {
  console.log('🔍 VERIFICAR E CRIAR PROFILE\n');

  const userId = 'a3ea040f-6f7a-44dd-b778-10eff4295303';

  // 1. Verificar se profile existe
  console.log('1️⃣ Verificando se profile existe...');
  const { data: existingProfiles, error: checkError } = await supabaseAdmin
    .from('profiles')
    .select('id, user_id, display_name')
    .eq('user_id', userId);

  if (checkError) {
    console.error('❌ Erro ao verificar profile:', checkError.message);
    return;
  }

  if (existingProfiles && existingProfiles.length > 0) {
    console.log(`✅ ${existingProfiles.length} profile(s) encontrado(s):`);
    existingProfiles.forEach((p, i) => {
      console.log(`\n   Profile ${i + 1}:`);
      console.log(`   ID: ${p.id}`);
      console.log(`   User ID: ${p.user_id}`);
      console.log(`   Nome: ${p.display_name || '(não definido)'}`);
    });
    return;
  }

  console.log('⚠️  Profile não existe, criando...');

  // 2. Buscar dados do usuário
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (userError || !userData) {
    console.error('❌ Erro ao buscar usuário:', userError?.message);
    return;
  }

  console.log('✅ Usuário encontrado:', userData.user.email);

  // 3. Criar profile
  const { data: newProfile, error: createError } = await supabaseAdmin
    .from('profiles')
    .insert({
      user_id: userId,
      display_name: userData.user.email?.split('@')[0] || 'Usuário',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Erro ao criar profile:', createError.message);
    console.log('\n📋 Detalhes do erro:');
    console.log(JSON.stringify(createError, null, 2));
    return;
  }

  console.log('✅ Profile criado com sucesso!');
  console.log(`   ID: ${newProfile.id}`);
  console.log(`   User ID: ${newProfile.user_id}`);
  console.log(`   Nome: ${newProfile.display_name}`);
}

verificarECriarProfile().catch(console.error);
