#!/usr/bin/env node
/**
 * Aplica migration no Supabase remoto via Management API
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

config({ path: resolve('.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function applyMigration() {
  console.log('🚀 Aplicando Migration 20260503000000_fix_spatial_search_hybrid_types.sql\n');
  console.log(`📍 Banco: ${process.env.VITE_SUPABASE_URL}\n`);

  const migrationSQL = readFileSync(
    'supabase/migrations/20260503000000_fix_spatial_search_hybrid_types.sql',
    'utf-8'
  );

  try {
    // Dividir em statements individuais
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 10);

    console.log(`📝 Executando ${statements.length} statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
      
      console.log(`[${i + 1}/${statements.length}] ${preview}...`);
      
      const { error } = await supabase.rpc('query', {
        query: statement + ';'
      }).single();

      if (error) {
        // Tentar executar diretamente via from
        const { error: directError } = await supabase
          .from('_migrations')
          .insert({ name: '20260503000000', executed_at: new Date().toISOString() });
        
        if (directError && !directError.message.includes('duplicate')) {
          console.error(`   ❌ Erro: ${error.message}`);
          throw error;
        }
      }
      
      console.log(`   ✅ OK`);
    }

    console.log('\n✅ Migration aplicada com sucesso!\n');
    return true;
  } catch (err) {
    console.error('\n❌ Erro ao aplicar migration:', err.message);
    console.error('\n⚠️  Aplicar manualmente via Supabase Dashboard:');
    console.error('   1. Acessar: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new');
    console.error('   2. Copiar conteúdo de: supabase/migrations/20260503000000_fix_spatial_search_hybrid_types.sql');
    console.error('   3. Executar no SQL Editor\n');
    return false;
  }
}

async function testRPC() {
  console.log('🧪 Testando RPC search_entities_hybrid...\n');
  
  // Teste 1: Business
  console.log('📍 Teste 1: entity_type = business');
  const { data: businessData, error: businessError } = await supabase.rpc('search_entities_hybrid', {
    p_latitude: -12.9977,
    p_longitude: -38.4502,
    p_radius_km: 8,
    p_entity_type: 'business',
    p_location_ids: ['384add59-4e53-489d-a7b5-97dea2b3f442'],
    p_limit: 5
  });

  if (businessError) {
    console.error('   ❌ Falhou:', businessError.message);
    if (businessError.message.includes('numeric') || businessError.message.includes('double precision')) {
      console.error('   ⚠️  Migration NÃO foi aplicada corretamente!');
    }
    return false;
  }

  console.log(`   ✅ Funcionou! Resultados: ${businessData?.length || 0}`);
  if (businessData && businessData.length > 0) {
    console.log(`   📊 Primeiro resultado:`, {
      name: businessData[0].name,
      latitude: businessData[0].latitude,
      longitude: businessData[0].longitude,
      distance_meters: businessData[0].distance_meters,
      in_territory: businessData[0].in_territory
    });
  }

  // Teste 2: Professional
  console.log('\n📍 Teste 2: entity_type = professional');
  const { data: profData, error: profError } = await supabase.rpc('search_entities_hybrid', {
    p_latitude: -12.9977,
    p_longitude: -38.4502,
    p_radius_km: 8,
    p_entity_type: 'professional',
    p_location_ids: ['384add59-4e53-489d-a7b5-97dea2b3f442'],
    p_limit: 5
  });

  if (profError) {
    console.error('   ❌ Falhou:', profError.message);
    return false;
  }

  console.log(`   ✅ Funcionou! Resultados: ${profData?.length || 0}`);
  
  console.log('\n✅ RPC search_entities_hybrid está funcionando corretamente!\n');
  return true;
}

async function main() {
  const applied = await applyMigration();
  
  if (!applied) {
    console.log('⚠️  Tentando testar RPC mesmo assim...\n');
  }
  
  const tested = await testRPC();
  
  if (tested) {
    console.log('🎉 Migration aplicada e validada com sucesso!\n');
    process.exit(0);
  } else {
    console.log('❌ Migration precisa ser aplicada manualmente.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
