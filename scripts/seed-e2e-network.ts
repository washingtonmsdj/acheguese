#!/usr/bin/env tsx
/**
 * Seed de dados para testes E2E de rede/filiais
 *
 * Cria dados determinísticos e previsíveis:
 *   - 1 usuário de teste com empresa standalone
 *   - 2 locations (bairros) reais do banco para usar nos testes
 *   - Exporta IDs para os testes consumirem via env
 *
 * Uso:
 *   npx tsx scripts/seed-e2e-network.ts
 *   npx tsx scripts/seed-e2e-network.ts --reset
 */

import fs from 'fs';
import { createServiceRoleClient, loadSupabaseScriptEnv } from './lib/supabase-client';
import {
  assertIsolatedBusinessMutationTarget,
  technicalBusinessMetadata,
} from './lib/e2e-business-safety';

const E2E_ENV_FILES = ['.env.test', '.env.local'];

loadSupabaseScriptEnv(E2E_ENV_FILES);

const RESET = process.argv.includes('--reset');

// IDs fixos para determinismo
const SEED = {
  USER_EMAIL: 'e2e-network@test.local',
  USER_PASSWORD: 'E2eNetwork@2024!',
  STANDALONE_SLUG: 'e2e-standalone-test',
  BRANCH_SLUG: 'e2e-branch-barra-test',
  HUB_SLUG: 'e2e-brand-hub-test',
};

async function run() {
  assertIsolatedBusinessMutationTarget('seed-e2e-network');
  const supabase = createServiceRoleClient({ envFiles: E2E_ENV_FILES });
  console.log('🌱 Seed E2E rede/filiais\n');

  // 1. Buscar 2 locations do tipo district para usar nos testes
  const { data: districts, error: locErr } = await supabase
    .from('locations')
    .select('id, name, geographic_path, type')
    .eq('type', 'district')
    .eq('status', 'active')
    .limit(2);

  if (locErr || !districts || districts.length < 2) {
    console.error('❌ Não foi possível encontrar 2 bairros ativos no banco.');
    console.error('   Verifique se a tabela locations tem registros do tipo district.');
    process.exit(1);
  }

  const [loc1, loc2] = districts;
  console.log(`📍 Bairro 1: ${loc1.name} (${loc1.id})`);
  console.log(`📍 Bairro 2: ${loc2.name} (${loc2.id})\n`);

  // 2. Limpar dados anteriores se --reset
  if (RESET) {
    console.log('🗑️  Limpando dados anteriores...');
    await supabase.from('business_data').delete().like('slug', 'e2e-%');
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users?.users.find(u => u.email === SEED.USER_EMAIL);
    if (existing) {
      await supabase.from('profiles').delete().eq('id', existing.id);
      await supabase.auth.admin.deleteUser(existing.id);
    }
    console.log('✅ Dados anteriores removidos\n');
  }

  // 3. Criar/reusar usuário de teste
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  let userId = existingUsers?.users.find(u => u.email === SEED.USER_EMAIL)?.id;

  if (!userId) {
    const { data: newUser, error: userErr } = await supabase.auth.admin.createUser({
      email: SEED.USER_EMAIL,
      password: SEED.USER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'E2E Network Test User' },
    });
    if (userErr || !newUser.user) {
      console.error('❌ Erro ao criar usuário:', userErr?.message);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log(`✅ Usuário criado: ${SEED.USER_EMAIL} (${userId})`);
  } else {
    console.log(`ℹ️  Usuário já existe: ${SEED.USER_EMAIL} (${userId})`);
  }

  // Garantir que o perfil pessoal existe (idempotente)
  const { data: existingPersonalProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('profile_type', 'personal')
    .maybeSingle();

  if (!existingPersonalProfile) {
    const { error: profileErr } = await supabase.from('profiles').insert({
      id: userId,
      user_id: userId,
      name: 'E2E Network Test User',
      profile_type: 'personal',
    });
    if (profileErr) {
      console.error('❌ Erro ao criar perfil pessoal:', profileErr.message);
      process.exit(1);
    }
    console.log(`✅ Perfil pessoal criado (${userId})`);
  } else {
    console.log(`ℹ️  Perfil pessoal já existe (${existingPersonalProfile.id})`);
  }

  // 4. Criar perfil de negócio para a empresa de teste
  let businessProfileId: string | null = null;

  // Verificar se já existe um perfil de negócio para este usuário com o slug de teste
  const { data: existingBizProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', SEED.STANDALONE_SLUG)
    .eq('profile_type', 'business')
    .maybeSingle();

  if (existingBizProfile) {
    businessProfileId = existingBizProfile.id;
    console.log(`ℹ️  Perfil de negócio já existe (${businessProfileId})`);
  } else {
    const { data: bizProfile, error: bizProfileErr } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        profile_type: 'business',
        name: 'E2E Empresa Standalone',
        username: SEED.STANDALONE_SLUG,
        bio: 'Empresa de teste E2E',
      })
      .select('id')
      .maybeSingle();

    if (bizProfileErr || !bizProfile) {
      console.error('❌ Erro ao criar perfil de negócio:', bizProfileErr?.message);
      process.exit(1);
    }
    businessProfileId = bizProfile.id;
    console.log(`✅ Perfil de negócio criado (${businessProfileId})`);
  }

  // 5. Criar empresa standalone (se não existir)
  const { data: existingStandalone } = await supabase
    .from('business_data')
    .select('id, profile_id')
    .eq('slug', SEED.STANDALONE_SLUG)
    .maybeSingle();

  let standaloneId: string;
  let standaloneProfileId: string;

  if (!existingStandalone) {
    const { data: standalone, error: sErr } = await supabase
      .from('business_data')
      .insert({
        profile_id: businessProfileId,
        business_name: 'E2E Empresa Standalone',
        slug: SEED.STANDALONE_SLUG,
        business_role: 'standalone',
        location_id: loc1.id,
        category: 'restaurante',
        subcategory: 'Culinária Teste',
        description: 'Empresa de teste E2E para fluxo de rede/filiais',
        status: 'active',
        payment_methods: ['pix'],
        specialties: [],
        facilities: [],
        email: 'e2e@test.local',
        metadata: technicalBusinessMetadata(),
      })
      .select('id, profile_id')
      .maybeSingle();

    if (sErr || !standalone) {
      console.error('❌ Erro ao criar standalone:', sErr?.message);
      process.exit(1);
    }
    standaloneId = standalone.id;
    standaloneProfileId = standalone.profile_id;
    console.log(`✅ Standalone criado: ${SEED.STANDALONE_SLUG} (${standaloneId})`);
  } else {
    standaloneId = existingStandalone.id;
    standaloneProfileId = existingStandalone.profile_id;
    console.log(`ℹ️  Standalone já existe: ${SEED.STANDALONE_SLUG} (${standaloneId})`);
  }

  // 6. Adicionar profile_members para o usuário ter acesso à empresa
  const { error: memberErr } = await supabase.from('profile_members').upsert({
    profile_id: standaloneProfileId,
    user_id: userId,
    role: 'owner',
  }, { onConflict: 'profile_id,user_id' });

  if (memberErr) {
    console.error('❌ Erro ao criar vínculo profile_members:', memberErr.message);
    process.exit(1);
  }
  console.log(`✅ Vínculo profile_members criado (user: ${userId}, profile: ${standaloneProfileId}, role: owner)`);

  // 7. Escrever .env.e2e.network com os IDs para os testes consumirem
  const envContent = [
    `# Auto-gerado por seed-e2e-network.ts — NÃO editar manualmente`,
    `E2E_NETWORK_USER_EMAIL=${SEED.USER_EMAIL}`,
    `E2E_NETWORK_USER_PASSWORD=${SEED.USER_PASSWORD}`,
    `E2E_NETWORK_STANDALONE_ID=${standaloneId}`,
    `E2E_NETWORK_STANDALONE_PROFILE_ID=${standaloneProfileId}`,
    `E2E_NETWORK_STANDALONE_SLUG=${SEED.STANDALONE_SLUG}`,
    `E2E_NETWORK_LOC1_ID=${loc1.id}`,
    `E2E_NETWORK_LOC1_NAME=${loc1.name}`,
    `E2E_NETWORK_LOC1_PATH=${loc1.geographic_path}`,
    `E2E_NETWORK_LOC2_ID=${loc2.id}`,
    `E2E_NETWORK_LOC2_NAME=${loc2.name}`,
    `E2E_NETWORK_LOC2_PATH=${loc2.geographic_path}`,
    `E2E_NETWORK_HUB_SLUG=${SEED.HUB_SLUG}`,
    `E2E_NETWORK_BRANCH_SLUG=${SEED.BRANCH_SLUG}`,
  ].join('\n');

  fs.writeFileSync('.env.e2e.network', envContent);
  console.log('\n✅ .env.e2e.network gerado com IDs de teste\n');

  console.log('📋 Resumo:');
  console.log(`   Usuário:    ${SEED.USER_EMAIL} / ${SEED.USER_PASSWORD}`);
  console.log(`   Standalone: ${SEED.STANDALONE_SLUG} → dashboard: /dashboard/business/${standaloneProfileId}`);
  console.log(`   Bairro 1:   ${loc1.name} (${loc1.geographic_path})`);
  console.log(`   Bairro 2:   ${loc2.name} (${loc2.geographic_path})`);
  console.log('\n✨ Seed concluído. Execute: npm run test:e2e:network\n');
}

run().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
