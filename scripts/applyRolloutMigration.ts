#!/usr/bin/env tsx
/**
 * Script para aplicar migration de rollouts no banco remoto
 * Adiciona módulos gastronomy, events, jobs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Iniciando aplicação da migration de rollouts...\n');

  try {
    // PASSO 1: Verificar rollouts existentes
    console.log('📝 Passo 1: Verificando rollouts existentes em Salvador...');
    
    const { data: existing, error: checkError } = await supabase
      .from('module_rollouts')
      .select('module_key, status')
      .eq('location_id', '00000000-0000-0000-0000-000000000010')
      .order('module_key');

    if (checkError) {
      console.error('❌ Erro ao verificar rollouts existentes:', checkError);
      throw checkError;
    }

    console.log('✅ Rollouts existentes:');
    console.table(existing);
    console.log('');

    // PASSO 2: Inserir rollouts para novos módulos
    console.log('📝 Passo 2: Inserindo rollouts para novos módulos...\n');
    
    const rollouts = [
      { module_key: 'gastronomy', location_id: '00000000-0000-0000-0000-000000000010', status: 'active', config: null },
      { module_key: 'events', location_id: '00000000-0000-0000-0000-000000000010', status: 'active', config: null },
      { module_key: 'jobs', location_id: '00000000-0000-0000-0000-000000000010', status: 'active', config: null }
    ];

    for (const rollout of rollouts) {
      // Verificar se já existe
      const exists = existing?.find(r => r.module_key === rollout.module_key);
      
      if (exists) {
        console.log(`⏭️  ${rollout.module_key} já existe (${exists.status})`);
        continue;
      }

      // Inserir novo
      const { error } = await supabase
        .from('module_rollouts')
        .insert(rollout);

      if (error) {
        // Se erro for de constraint, significa que precisa atualizar o schema
        if (error.message.includes('violates check constraint')) {
          console.error(`❌ Erro: O schema não aceita '${rollout.module_key}' ainda.`);
          console.error('   Você precisa atualizar o constraint no Supabase Studio primeiro.');
          console.error('   Execute o SQL em APLICAR_MIGRATION_ROLLOUTS.sql');
        } else {
          console.error(`❌ Erro ao inserir ${rollout.module_key}:`, error.message);
        }
      } else {
        console.log(`✅ Rollout ${rollout.module_key} inserido com sucesso`);
      }
    }

    // PASSO 3: Verificar resultado final
    console.log('\n📝 Passo 3: Verificando resultado final...\n');
    
    const { data, error } = await supabase
      .from('module_rollouts')
      .select('module_key, status, created_at')
      .eq('location_id', '00000000-0000-0000-0000-000000000010')
      .order('module_key');

    if (error) {
      console.error('❌ Erro ao verificar:', error);
    } else {
      console.log('✅ Rollouts ativos em Salvador:');
      console.table(data);
      
      const hasGastronomy = data?.some(r => r.module_key === 'gastronomy');
      const hasEvents = data?.some(r => r.module_key === 'events');
      const hasJobs = data?.some(r => r.module_key === 'jobs');
      
      if (hasGastronomy && hasEvents && hasJobs) {
        console.log('\n🎉 SUCESSO! Todos os novos módulos foram adicionados!');
        console.log('✅ gastronomy, events, jobs agora estão ativos');
        console.log('✅ Bug do seletor corrigido na raiz!');
      } else {
        console.log('\n⚠️  Alguns módulos não foram adicionados:');
        if (!hasGastronomy) console.log('   ❌ gastronomy');
        if (!hasEvents) console.log('   ❌ events');
        if (!hasJobs) console.log('   ❌ jobs');
        console.log('\n💡 Você precisa atualizar o constraint da tabela primeiro.');
        console.log('   Execute o SQL em APLICAR_MIGRATION_ROLLOUTS.sql no Supabase Studio.');
      }
    }

  } catch (error) {
    console.error('\n❌ Erro geral:', error);
    process.exit(1);
  }
}

// Executar
applyMigration()
  .then(() => {
    console.log('\n✅ Migration aplicada com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha ao aplicar migration:', error);
    process.exit(1);
  });
