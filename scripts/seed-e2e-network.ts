#!/usr/bin/env tsx
/**
 * Seed de dados para testes E2E de rede/filiais.
 *
 * Este seeder e mutavel e fail-closed: somente localhost ou um projeto remoto
 * explicitamente aprovado e diferente do project_id de Production pode ser usado.
 */

import fs from 'fs';
import {
  createServiceRoleClient,
  getSupabaseConfig,
  loadSupabaseScriptEnv,
} from './lib/supabase-client';
import { assertApprovedRemoteMutationTarget } from './lib/remote-mutation-safety';

const E2E_ENV_FILES = ['.env.test', '.env.local'];
const RESET = process.argv.includes('--reset');
const FIXTURE_KIND = 'network-e2e';
const TECHNICAL_BUSINESS_METADATA = {
  source: 'e2e',
  source_kind: 'technical_fixture',
};

// IDs/identificadores fixos para determinismo.
const SEED = {
  USER_EMAIL: 'e2e-network@test.local',
  USER_PASSWORD: 'E2eNetwork@2024!',
  STANDALONE_SLUG: 'e2e-standalone-test',
  BRANCH_SLUG: 'e2e-branch-barra-test',
  HUB_SLUG: 'e2e-brand-hub-test',
};

function isTechnicalAuthFixture(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): boolean {
  return (
    user.app_metadata?.acheguese_fixture === FIXTURE_KIND &&
    user.user_metadata?.acheguese_fixture === FIXTURE_KIND
  );
}

function isTechnicalBusinessFixture(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return false;
  const record = metadata as Record<string, unknown>;
  return (
    record.source === TECHNICAL_BUSINESS_METADATA.source &&
    record.source_kind === TECHNICAL_BUSINESS_METADATA.source_kind
  );
}

async function run() {
  loadSupabaseScriptEnv(E2E_ENV_FILES);
  const config = getSupabaseConfig({ envFiles: E2E_ENV_FILES });
  assertApprovedRemoteMutationTarget(config.url);
  const supabase = createServiceRoleClient({
    url: config.url,
    serviceRoleKey: config.serviceRoleKey,
    envFiles: E2E_ENV_FILES,
  });

  console.log('🌱 Seed E2E rede/filiais em alvo isolado\n');

  // 1. Buscar 2 locations do tipo district para usar nos testes.
  const { data: districts, error: locErr } = await supabase
    .from('locations')
    .select('id, name, geographic_path, type')
    .eq('type', 'district')
    .eq('status', 'active')
    .limit(2);

  if (locErr || !districts || districts.length < 2) {
    console.error('❌ Não foi possível encontrar 2 bairros ativos no banco.');
    process.exit(1);
  }

  const [loc1, loc2] = districts;
  console.log(`📍 Bairro 1: ${loc1.name} (${loc1.id})`);
  console.log(`📍 Bairro 2: ${loc2.name} (${loc2.id})\n`);

  const { data: users, error: listUsersError } = await supabase.auth.admin.listUsers();
  if (listUsersError) throw listUsersError;
  let existingUser = users?.users.find((user) => user.email === SEED.USER_EMAIL);

  if (existingUser && !isTechnicalAuthFixture(existingUser)) {
    throw new Error(
      `Refusing to adopt Auth user ${SEED.USER_EMAIL} without the ${FIXTURE_KIND} fixture marker.`,
    );
  }

  // 2. Limpar apenas fixtures tecnicas marcadas se --reset.
  if (RESET) {
    console.log('🗑️  Limpando fixtures técnicas anteriores...');
    const { error: businessDeleteError } = await supabase
      .from('business_data')
      .delete()
      .like('slug', 'e2e-%')
      .eq('metadata->>source', TECHNICAL_BUSINESS_METADATA.source)
      .eq('metadata->>source_kind', TECHNICAL_BUSINESS_METADATA.source_kind);
    if (businessDeleteError) throw businessDeleteError;

    if (existingUser) {
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(existingUser.id);
      if (deleteUserError) throw deleteUserError;
      existingUser = undefined;
    }
    console.log('✅ Fixtures técnicas anteriores removidas\n');
  }

  // 3. Criar/reusar usuário técnico de teste.
  let userId = existingUser?.id;

  if (!userId) {
    const marker = {
      acheguese_fixture: FIXTURE_KIND,
      fixture_version: '1',
    };
    const { data: newUser, error: userErr } = await supabase.auth.admin.createUser({
      email: SEED.USER_EMAIL,
      password: SEED.USER_PASSWORD,
      email_confirm: true,
      app_metadata: marker,
      user_metadata: {
        ...marker,
        full_name: 'E2E Network Test User',
      },
    });
    if (userErr || !newUser.user) {
      console.error('❌ Erro ao criar usuário:', userErr?.message);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log(`✅ Usuário técnico criado: ${SEED.USER_EMAIL} (${userId})`);
  } else {
    console.log(`ℹ️  Usuário técnico já existe: ${SEED.USER_EMAIL} (${userId})`);
  }

  // Garantir que o perfil pessoal existe (idempotente).
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

  // 4. Criar perfil de negócio para a empresa de teste.
  let businessProfileId: string;

  const { data: existingBizProfile, error: existingBizProfileError } = await supabase
    .from('profiles')
    .select('id, user_id, name')
    .eq('username', SEED.STANDALONE_SLUG)
    .eq('profile_type', 'business')
    .maybeSingle();
  if (existingBizProfileError) throw existingBizProfileError;

  if (existingBizProfile) {
    if (
      existingBizProfile.user_id !== userId ||
      existingBizProfile.name !== 'E2E Empresa Standalone'
    ) {
      throw new Error(
        `Refusing to adopt business profile ${SEED.STANDALONE_SLUG} that is not owned by the technical fixture user.`,
      );
    }
    businessProfileId = existingBizProfile.id;
    console.log(`ℹ️  Perfil de negócio técnico já existe (${businessProfileId})`);
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
    console.log(`✅ Perfil de negócio técnico criado (${businessProfileId})`);
  }

  // 5. Criar empresa standalone somente com provenance tecnica.
  const { data: existingStandalone, error: existingStandaloneError } = await supabase
    .from('business_data')
    .select('id, profile_id, metadata')
    .eq('slug', SEED.STANDALONE_SLUG)
    .maybeSingle();
  if (existingStandaloneError) throw existingStandaloneError;

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
        metadata: TECHNICAL_BUSINESS_METADATA,
      })
      .select('id, profile_id')
      .maybeSingle();

    if (sErr || !standalone) {
      console.error('❌ Erro ao criar standalone:', sErr?.message);
      process.exit(1);
    }
    standaloneId = standalone.id;
    standaloneProfileId = standalone.profile_id;
    console.log(`✅ Standalone técnico criado: ${SEED.STANDALONE_SLUG} (${standaloneId})`);
  } else {
    if (
      existingStandalone.profile_id !== businessProfileId ||
      !isTechnicalBusinessFixture(existingStandalone.metadata)
    ) {
      throw new Error(
        `Refusing to adopt business_data ${SEED.STANDALONE_SLUG} without matching technical provenance.`,
      );
    }
    standaloneId = existingStandalone.id;
    standaloneProfileId = existingStandalone.profile_id;
    console.log(`ℹ️  Standalone técnico já existe: ${SEED.STANDALONE_SLUG} (${standaloneId})`);
  }

  // 6. Adicionar profile_members para o usuário ter acesso à empresa.
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

  // 7. Escrever .env.e2e.network com os IDs para os testes consumirem.
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
  console.log(`   Usuário:    ${SEED.USER_EMAIL}`);
  console.log(`   Standalone: ${SEED.STANDALONE_SLUG} → dashboard: /dashboard/business/${standaloneProfileId}`);
  console.log(`   Bairro 1:   ${loc1.name} (${loc1.geographic_path})`);
  console.log(`   Bairro 2:   ${loc2.name} (${loc2.geographic_path})`);
  console.log('\n✨ Seed concluído. Execute: npm run test:e2e:network\n');
}

run().catch((error) => {
  console.error('❌ Erro fatal:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
