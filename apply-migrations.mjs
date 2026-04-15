#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidas');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migrations a aplicar
const migrations = [
  '20260413000010_add_plan_tier_to_gastronomy.sql',
  '20260413000011_create_gastronomy_subscriptions.sql',
  '20260413000012_sync_gastronomy_plan_tier.sql',
  '20260413000013_seed_free_subscriptions.sql'
];

async function applyMigration(filename) {
  console.log(`\n📄 Aplicando: ${filename}`);
  
  try {
    const filepath = join(__dirname, 'supabase', 'migrations', filename);
    const sql = readFileSync(filepath, 'utf8');
    
    // Remover comentários e linhas vazias
    const cleanSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: cleanSql });
    
    if (error) {
      // Tentar executar diretamente via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_query: cleanSql })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      console.log(`✅ ${filename} aplicada com sucesso!`);
    } else {
      console.log(`✅ ${filename} aplicada com sucesso!`);
    }
  } catch (error) {
    console.error(`❌ Erro ao aplicar ${filename}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Iniciando aplicação de migrations...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`📦 Total de migrations: ${migrations.length}\n`);
  
  for (const migration of migrations) {
    await applyMigration(migration);
  }
  
  console.log('\n✅ Todas as migrations foram aplicadas com sucesso!');
  console.log('\n🔍 Verificando resultado...\n');
  
  // Verificar se a coluna plan_tier existe
  const { data: profiles, error: profilesError } = await supabase
    .from('gastronomy_profiles')
    .select('id, business_id, cuisine_type, plan_tier')
    .limit(1);
  
  if (profilesError) {
    console.error('❌ Erro ao verificar gastronomy_profiles:', profilesError.message);
  } else {
    console.log('✅ Coluna plan_tier existe em gastronomy_profiles');
    if (profiles && profiles.length > 0) {
      console.log('   Exemplo:', profiles[0]);
    }
  }
  
  // Verificar se a tabela gastronomy_subscriptions existe
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('gastronomy_subscriptions')
    .select('id, business_id, plan_tier, status')
    .limit(1);
  
  if (subscriptionsError) {
    console.error('❌ Erro ao verificar gastronomy_subscriptions:', subscriptionsError.message);
  } else {
    console.log('✅ Tabela gastronomy_subscriptions existe');
    if (subscriptions && subscriptions.length > 0) {
      console.log('   Exemplo:', subscriptions[0]);
    }
  }
  
  // Contar assinaturas por plano
  const { data: stats, error: statsError } = await supabase
    .from('gastronomy_subscriptions')
    .select('plan_tier');
  
  if (!statsError && stats) {
    const counts = stats.reduce((acc, sub) => {
      acc[sub.plan_tier] = (acc[sub.plan_tier] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Distribuição de planos:');
    Object.entries(counts).forEach(([tier, count]) => {
      console.log(`   ${tier}: ${count}`);
    });
  }
  
  console.log('\n🎉 Processo concluído!');
}

main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
