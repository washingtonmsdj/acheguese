#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const supabaseUrl = 'https://xhdowzacfujckjelqhtd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZG93emFjZnVqY2tqZWxxaHRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwNDA4OSwiZXhwIjoyMDkwMDgwMDg5fQ.mRgz7fJ_TfHwvUkp91ymY4L1uKTSQIgeAU1XywpiU-c';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migrations a aplicar
const migrations = [
  '20260413000010_add_plan_tier_to_gastronomy.sql',
  '20260413000011_create_gastronomy_subscriptions.sql',
  '20260413000012_sync_gastronomy_plan_tier.sql',
  '20260413000013_seed_free_subscriptions.sql'
];

async function executeSqlDirect(sql) {
  // Dividir SQL em statements individuais
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    if (statement.trim().length === 0) continue;
    
    try {
      // Tentar executar via RPC
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_string: statement + ';' 
      });
      
      if (error && !error.message.includes('does not exist')) {
        console.log(`   ⚠️  ${error.message.substring(0, 100)}...`);
      }
    } catch (err) {
      // Ignorar erros de função não existente
      if (!err.message.includes('does not exist')) {
        console.log(`   ⚠️  ${err.message.substring(0, 100)}...`);
      }
    }
  }
}

async function applyMigration(filename) {
  console.log(`\n📄 Aplicando: ${filename}`);
  
  try {
    const filepath = join(__dirname, 'supabase', 'migrations', filename);
    const sql = readFileSync(filepath, 'utf8');
    
    await executeSqlDirect(sql);
    
    console.log(`✅ ${filename} processada`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao aplicar ${filename}:`, error.message);
    return false;
  }
}

async function verifyMigrations() {
  console.log('\n🔍 Verificando resultado...\n');
  
  try {
    // Verificar gastronomy_profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('gastronomy_profiles')
      .select('id, business_id, cuisine_type, plan_tier')
      .limit(1);
    
    if (!profilesError) {
      console.log('✅ Coluna plan_tier existe em gastronomy_profiles');
      if (profiles && profiles.length > 0) {
        console.log('   Exemplo:', {
          id: profiles[0].id.substring(0, 8) + '...',
          plan_tier: profiles[0].plan_tier
        });
      }
    } else {
      console.log('⚠️  Erro ao verificar gastronomy_profiles:', profilesError.message);
    }
    
    // Verificar gastronomy_subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('gastronomy_subscriptions')
      .select('id, business_id, plan_tier, status')
      .limit(1);
    
    if (!subscriptionsError) {
      console.log('✅ Tabela gastronomy_subscriptions existe');
      if (subscriptions && subscriptions.length > 0) {
        console.log('   Exemplo:', {
          id: subscriptions[0].id.substring(0, 8) + '...',
          plan_tier: subscriptions[0].plan_tier,
          status: subscriptions[0].status
        });
      }
    } else {
      console.log('⚠️  Erro ao verificar gastronomy_subscriptions:', subscriptionsError.message);
    }
    
    // Contar assinaturas
    const { data: allSubs, error: statsError } = await supabase
      .from('gastronomy_subscriptions')
      .select('plan_tier');
    
    if (!statsError && allSubs) {
      const counts = allSubs.reduce((acc, sub) => {
        acc[sub.plan_tier] = (acc[sub.plan_tier] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Distribuição de planos:');
      Object.entries(counts).forEach(([tier, count]) => {
        const percentage = ((count / allSubs.length) * 100).toFixed(2);
        console.log(`   ${tier}: ${count} (${percentage}%)`);
      });
      
      console.log(`\n📈 Total de assinaturas: ${allSubs.length}`);
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando aplicação de migrations via Supabase API...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`📦 Total de migrations: ${migrations.length}\n`);
  
  let successCount = 0;
  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Resultado: ${successCount}/${migrations.length} migrations processadas`);
  
  await verifyMigrations();
  
  console.log('\n🎉 Processo concluído!');
}

main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
