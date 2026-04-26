/**
 * 🧪 Script de Teste - Migration de Versionamento de Nichos
 *
 * Este script testa a migration de versionamento de nichos
 * para garantir que dados existentes são migrados corretamente.
 *
 * Uso: npx tsx scripts/test-niche-versioning-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SECRET_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMigration() {
  console.log('🧪 Testando Migration de Versionamento de Nichos\n');

  try {
    // 1. Verificar se colunas foram adicionadas
    console.log('1️⃣ Verificando colunas adicionadas...');
    const { data: profiles, error: profilesError } = await supabase
      .from('gastronomy_profiles')
      .select('primary_niche_key, niche_config_version, support_level, operational_mode, enabled_capabilities, missing_capabilities, needs_niche_upgrade')
      .limit(1);

    if (profilesError) {
      console.error('   ❌ Erro ao buscar perfis:', profilesError.message);
      return false;
    }

    console.log('   ✅ Colunas adicionadas com sucesso');

    // 2. Verificar se tabela de histórico foi criada
    console.log('\n2️⃣ Verificando tabela de histórico...');
    const { data: history, error: historyError } = await supabase
      .from('gastronomy_niche_upgrade_history')
      .select('*')
      .limit(1);

    if (historyError) {
      console.error('   ❌ Erro ao buscar histórico:', historyError.message);
      return false;
    }

    console.log('   ✅ Tabela de histórico criada com sucesso');

    // 3. Verificar se view foi criada
    console.log('\n3️⃣ Verificando view...');
    const { data: viewData, error: viewError } = await supabase
      .from('gastronomy_profiles_with_niche_info')
      .select('*')
      .limit(1);

    if (viewError) {
      console.error('   ❌ Erro ao buscar view:', viewError.message);
      return false;
    }

    console.log('   ✅ View criada com sucesso');

    // 4. Verificar funções SQL
    console.log('\n4️⃣ Verificando funções SQL...');

    // Testar has_niche_capability
    const { data: hasCapData, error: hasCapError } = await supabase.rpc(
      'has_niche_capability',
      {
        p_business_id: '00000000-0000-0000-0000-000000000000', // UUID fake
        p_capability: 'basic_menu',
      },
    );

    if (hasCapError) {
      console.error('   ❌ Função has_niche_capability não encontrada:', hasCapError.message);
      return false;
    }

    console.log('   ✅ Função has_niche_capability funcionando');

    // 5. Verificar migração de dados
    console.log('\n5️⃣ Verificando migração de dados...');
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('gastronomy_profiles')
      .select('id, primary_niche_key, niche_config_version, support_level, enabled_capabilities, missing_capabilities');

    if (allProfilesError) {
      console.error('   ❌ Erro ao buscar perfis:', allProfilesError.message);
      return false;
    }

    if (!allProfiles || allProfiles.length === 0) {
      console.log('   ⚠️  Nenhum perfil encontrado para validar migração');
    } else {
      console.log(`   ℹ️  Encontrados ${allProfiles.length} perfis`);

      // Verificar se todos têm primary_niche_key
      const withoutNiche = allProfiles.filter((p: any) => !p.primary_niche_key);
      if (withoutNiche.length > 0) {
        console.error(`   ❌ ${withoutNiche.length} perfis sem primary_niche_key`);
        return false;
      }

      console.log('   ✅ Todos os perfis têm primary_niche_key');

      // Verificar se todos têm versão
      const withoutVersion = allProfiles.filter((p: any) => !p.niche_config_version);
      if (withoutVersion.length > 0) {
        console.error(`   ❌ ${withoutVersion.length} perfis sem niche_config_version`);
        return false;
      }

      console.log('   ✅ Todos os perfis têm niche_config_version');

      // Verificar se todos têm capabilities
      const withoutCapabilities = allProfiles.filter(
        (p: any) => !p.enabled_capabilities || !Array.isArray(p.enabled_capabilities),
      );
      if (withoutCapabilities.length > 0) {
        console.error(`   ❌ ${withoutCapabilities.length} perfis sem enabled_capabilities`);
        return false;
      }

      console.log('   ✅ Todos os perfis têm enabled_capabilities');

      // Mostrar estatísticas
      console.log('\n📊 Estatísticas:');
      const nicheStats: Record<string, number> = {};
      const supportStats: Record<string, number> = {};

      allProfiles.forEach((p: any) => {
        nicheStats[p.primary_niche_key] = (nicheStats[p.primary_niche_key] || 0) + 1;
        supportStats[p.support_level] = (supportStats[p.support_level] || 0) + 1;
      });

      console.log('\n   Perfis por nicho:');
      Object.entries(nicheStats).forEach(([niche, count]) => {
        console.log(`   - ${niche}: ${count}`);
      });

      console.log('\n   Perfis por nível de suporte:');
      Object.entries(supportStats).forEach(([level, count]) => {
        console.log(`   - ${level}: ${count}`);
      });
    }

    console.log('\n✅ Todos os testes passaram!');
    return true;
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
    return false;
  }
}

// Executar testes
testMigration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
