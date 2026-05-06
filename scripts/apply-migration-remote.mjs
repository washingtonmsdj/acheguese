#!/usr/bin/env node
/**
 * Aplica migration no Supabase remoto
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
  console.log('🚀 Aplicando migration 20260503000000_fix_spatial_search_hybrid_types.sql\n');

  const migrationSQL = readFileSync(
    'supabase/migrations/20260503000000_fix_spatial_search_hybrid_types.sql',
    'utf-8'
  );

  try {
    // Executar migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // Tentar executar diretamente via query
      console.log('⚠️  Tentando executar via query direta...\n');
      
      // Dividir em statements individuais
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        if (!statement) continue;
        
        console.log(`Executando: ${statement.substring(0, 50)}...`);
        
        const { error: stmtError } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (stmtError) {
          console.error(`❌ Erro: ${stmtError.message}`);
          throw stmtError;
        }
      }
    }

    console.log('✅ Migration aplicada com sucesso!\n');

    // Testar RPC
    console.log('🧪 Testando RPC search_entities_hybrid...\n');
    
    const { data: testData, error: testError } = await supabase.rpc('search_entities_hybrid', {
      p_latitude: -12.9977,
      p_longitude: -38.4502,
      p_radius_km: 8,
      p_entity_type: 'business',
      p_location_ids: ['384add59-4e53-489d-a7b5-97dea2b3f442'],
      p_limit: 5
    });

    if (testError) {
      console.error('❌ RPC falhou:', testError.message);
      throw testError;
    }

    console.log('✅ RPC funcionando!');
    console.log(`   Resultados: ${testData?.length || 0}\n`);

    if (testData && testData.length > 0) {
      console.log('   Primeiro resultado:');
      console.log(`   - Nome: ${testData[0].name}`);
      console.log(`   - Latitude: ${testData[0].latitude} (tipo: ${typeof testData[0].latitude})`);
      console.log(`   - Longitude: ${testData[0].longitude} (tipo: ${typeof testData[0].longitude})`);
      console.log(`   - Distância: ${testData[0].distance_meters}m`);
      console.log(`   - In Territory: ${testData[0].in_territory}\n`);
    }

    return true;
  } catch (err) {
    console.error('❌ Erro ao aplicar migration:', err.message);
    return false;
  }
}

applyMigration()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
  });
