#!/usr/bin/env tsx
/**
 * Aplica rollouts com o ID correto de Salvador
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const SALVADOR_ID = '63c41c29-adce-40f5-a552-e52d176123c3';

async function applyRollouts() {
  console.log('🚀 Aplicando rollouts em Salvador...\n');
  console.log(`📍 Salvador ID: ${SALVADOR_ID}\n`);

  try {
    // Inserir todos os rollouts
    const modules = [
      'community',
      'business',
      'services',
      'mobility',
      'classifieds',
      'ads',
      'gastronomy',
      'events',
      'jobs'
    ];

    console.log('📝 Inserindo rollouts...\n');

    for (const module_key of modules) {
      const { error } = await supabase
        .from('module_rollouts')
        .insert({
          module_key,
          location_id: SALVADOR_ID,
          status: 'active',
          config: null
        });

      if (error) {
        if (error.code === '23505') {
          console.log(`⏭️  ${module_key} - já existe`);
        } else if (error.message.includes('violates check constraint')) {
          console.log(`❌ ${module_key} - constraint precisa ser atualizado primeiro`);
          console.log('   Execute o SQL em APLICAR_MIGRATION_CORRETO.sql no Supabase Studio');
          return;
        } else {
          console.error(`❌ ${module_key} - erro:`, error.message);
        }
      } else {
        console.log(`✅ ${module_key} - inserido`);
      }
    }

    // Verificar resultado
    console.log('\n📝 Verificando rollouts em Salvador...\n');
    
    const { data, error } = await supabase
      .from('module_rollouts')
      .select('module_key, status, created_at')
      .eq('location_id', SALVADOR_ID)
      .order('module_key');

    if (error) {
      console.error('❌ Erro ao verificar:', error);
    } else {
      console.log('✅ Rollouts ativos em Salvador:');
      console.table(data);
      
      if (data && data.length === 9) {
        console.log('\n🎉 SUCESSO! Todos os 9 módulos estão ativos!');
        console.log('✅ Bug do seletor corrigido na raiz!');
      } else {
        console.log(`\n⚠️  Esperado 9 módulos, encontrado ${data?.length || 0}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

applyRollouts();
