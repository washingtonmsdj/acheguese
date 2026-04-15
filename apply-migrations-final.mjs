#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const supabaseUrl = 'https://xhdowzacfujckjelqhtd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZG93emFjZnVqY2tqZWxxaHRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwNDA4OSwiZXhwIjoyMDkwMDgwMDg5fQ.mRgz7fJ_TfHwvUkp91ymY4L1uKTSQIgeAU1XywpiU-c';

// Migrations a aplicar
const migrations = [
  '20260413000010_add_plan_tier_to_gastronomy.sql',
  '20260413000011_create_gastronomy_subscriptions.sql',
  '20260413000012_sync_gastronomy_plan_tier.sql',
  '20260413000013_seed_free_subscriptions.sql'
];

async function executeSqlViaPostgrest(sql) {
  // Usar a API do PostgREST para executar SQL
  // Vamos tentar executar cada statement separadamente
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
  
  const results = [];
  
  for (const statement of statements) {
    if (statement.trim().length === 0) continue;
    
    try {
      // Tentar via query direta
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: statement })
      });
      
      if (response.ok) {
        results.push({ success: true, statement: statement.substring(0, 50) });
      } else {
        const error = await response.text();
        results.push({ success: false, statement: statement.substring(0, 50), error });
      }
    } catch (err) {
      results.push({ success: false, statement: statement.substring(0, 50), error: err.message });
    }
  }
  
  return results;
}

async function applyMigration(filename) {
  console.log(`\n📄 Lendo: ${filename}`);
  
  try {
    const filepath = join(__dirname, 'supabase', 'migrations', filename);
    const sql = readFileSync(filepath, 'utf8');
    
    console.log(`   Tamanho: ${sql.length} caracteres`);
    console.log(`   ⚠️  Nota: Migrations devem ser aplicadas manualmente via Supabase Dashboard`);
    console.log(`   📋 Copie o conteúdo de: ${filepath}`);
    console.log(`   🔗 Cole em: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new`);
    
    return true;
  } catch (error) {
    console.error(`❌ Erro ao ler ${filename}:`, error.message);
    return false;
  }
}

async function verifyMigrations() {
  console.log('\n🔍 Verificando se migrations já foram aplicadas...\n');
  
  try {
    // Verificar gastronomy_profiles.plan_tier
    const profilesResponse = await fetch(
      `${supabaseUrl}/rest/v1/gastronomy_profiles?select=id,plan_tier&limit=1`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    );
    
    if (profilesResponse.ok) {
      const profiles = await profilesResponse.json();
      console.log('✅ Coluna plan_tier JÁ EXISTE em gastronomy_profiles');
      if (profiles && profiles.length > 0) {
        console.log(`   Valor exemplo: ${profiles[0].plan_tier}`);
      }
      return { planTierExists: true };
    } else {
      const error = await profilesResponse.text();
      if (error.includes('does not exist')) {
        console.log('❌ Coluna plan_tier NÃO EXISTE em gastronomy_profiles');
        console.log('   👉 Precisa aplicar migration 20260413000010');
        return { planTierExists: false };
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
  
  try {
    // Verificar gastronomy_subscriptions
    const subscriptionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/gastronomy_subscriptions?select=id&limit=1`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    );
    
    if (subscriptionsResponse.ok) {
      console.log('✅ Tabela gastronomy_subscriptions JÁ EXISTE');
      const subs = await subscriptionsResponse.json();
      console.log(`   Total de registros: ${subs.length}`);
      return { subscriptionsTableExists: true };
    } else {
      console.log('❌ Tabela gastronomy_subscriptions NÃO EXISTE');
      console.log('   👉 Precisa aplicar migration 20260413000011');
      return { subscriptionsTableExists: false };
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
  
  return {};
}

async function generateApplyInstructions() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 INSTRUÇÕES PARA APLICAR AS MIGRATIONS');
  console.log('='.repeat(70));
  console.log('\n1️⃣ Abra o Supabase SQL Editor:');
  console.log(`   ${supabaseUrl.replace('https://xhdowzacfujckjelqhtd.supabase.co', 'https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd')}/sql/new`);
  console.log('\n2️⃣ Copie e cole o conteúdo de cada migration (uma por vez):');
  
  migrations.forEach((migration, index) => {
    console.log(`\n   ${index + 1}. ${migration}`);
    console.log(`      Arquivo: supabase/migrations/${migration}`);
  });
  
  console.log('\n3️⃣ Clique em "Run" para executar cada migration');
  console.log('\n4️⃣ Verifique se não há erros no console');
  console.log('\n' + '='.repeat(70));
}

async function main() {
  console.log('🚀 Verificador de Migrations Gastronomy Billing\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`📦 Total de migrations: ${migrations.length}\n`);
  
  // Verificar estado atual
  const status = await verifyMigrations();
  
  if (status.planTierExists && status.subscriptionsTableExists) {
    console.log('\n🎉 TODAS AS MIGRATIONS JÁ FORAM APLICADAS!');
    console.log('\n📊 Verificando dados...\n');
    
    // Buscar estatísticas
    try {
      const statsResponse = await fetch(
        `${supabaseUrl}/rest/v1/gastronomy_subscriptions?select=plan_tier`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          }
        }
      );
      
      if (statsResponse.ok) {
        const subs = await statsResponse.json();
        const counts = subs.reduce((acc, sub) => {
          acc[sub.plan_tier] = (acc[sub.plan_tier] || 0) + 1;
          return acc;
        }, {});
        
        console.log('📊 Distribuição de planos:');
        Object.entries(counts).forEach(([tier, count]) => {
          const percentage = ((count / subs.length) * 100).toFixed(2);
          console.log(`   ${tier}: ${count} (${percentage}%)`);
        });
        
        console.log(`\n📈 Total de assinaturas: ${subs.length}`);
      }
    } catch (err) {
      console.log('⚠️  Não foi possível buscar estatísticas');
    }
    
  } else {
    console.log('\n⚠️  MIGRATIONS PRECISAM SER APLICADAS');
    await generateApplyInstructions();
  }
  
  console.log('\n✅ Verificação concluída!');
}

main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
