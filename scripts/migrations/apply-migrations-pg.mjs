#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração da conexão
// Nota: A senha precisa ser fornecida via variável de ambiente
const connectionString = process.env.SUPABASE_DB_URL || 
  'postgresql://postgres.xhdowzacfujckjelqhtd:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

// Migrations a aplicar
const migrations = [
  '20260413000010_add_plan_tier_to_gastronomy.sql',
  '20260413000011_create_gastronomy_subscriptions.sql',
  '20260413000012_sync_gastronomy_plan_tier.sql',
  '20260413000013_seed_free_subscriptions.sql'
];

async function applyMigration(client, filename) {
  console.log(`\n📄 Aplicando: ${filename}`);
  
  try {
    const filepath = join(__dirname, 'supabase', 'migrations', filename);
    const sql = readFileSync(filepath, 'utf8');
    
    await client.query(sql);
    
    console.log(`✅ ${filename} aplicada com sucesso!`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao aplicar ${filename}:`);
    console.error(`   ${error.message}`);
    
    // Se o erro for "already exists", considerar sucesso
    if (error.message.includes('already exists') || 
        error.message.includes('duplicate') ||
        error.message.includes('já existe')) {
      console.log(`⚠️  ${filename} já foi aplicada anteriormente`);
      return true;
    }
    
    return false;
  }
}

async function verifyMigrations(client) {
  console.log('\n🔍 Verificando resultado...\n');
  
  try {
    // Verificar coluna plan_tier
    const { rows: profiles } = await client.query(`
      SELECT id, business_id, cuisine_type, plan_tier, created_at
      FROM gastronomy_profiles
      LIMIT 1
    `);
    
    console.log('✅ Coluna plan_tier existe em gastronomy_profiles');
    if (profiles && profiles.length > 0) {
      console.log('   Exemplo:', profiles[0]);
    }
    
    // Verificar tabela gastronomy_subscriptions
    const { rows: subscriptions } = await client.query(`
      SELECT id, business_id, plan_tier, status, current_period_start, current_period_end
      FROM gastronomy_subscriptions
      LIMIT 1
    `);
    
    console.log('✅ Tabela gastronomy_subscriptions existe');
    if (subscriptions && subscriptions.length > 0) {
      console.log('   Exemplo:', subscriptions[0]);
    }
    
    // Contar assinaturas por plano
    const { rows: stats } = await client.query(`
      SELECT 
        plan_tier,
        COUNT(*) AS total,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
      FROM gastronomy_subscriptions
      GROUP BY plan_tier
      ORDER BY total DESC
    `);
    
    if (stats && stats.length > 0) {
      console.log('\n📊 Distribuição de planos:');
      stats.forEach(row => {
        console.log(`   ${row.plan_tier}: ${row.total} (${row.percentage}%)`);
      });
    }
    
    // Testar sincronização
    const { rows: syncTest } = await client.query(`
      SELECT 
        gp.business_id,
        gp.plan_tier AS profile_plan,
        gs.plan_tier AS subscription_plan,
        CASE 
          WHEN gp.plan_tier = gs.plan_tier THEN '✅ Sincronizado'
          ELSE '❌ Dessincronizado'
        END AS status
      FROM gastronomy_profiles gp
      JOIN gastronomy_subscriptions gs ON gs.business_id = gp.business_id
      LIMIT 5
    `);
    
    if (syncTest && syncTest.length > 0) {
      console.log('\n🔄 Teste de sincronização:');
      syncTest.forEach(row => {
        console.log(`   ${row.status} - Business: ${row.business_id.substring(0, 8)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando aplicação de migrations...\n');
  console.log(`📦 Total de migrations: ${migrations.length}\n`);
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');
    
    let successCount = 0;
    for (const migration of migrations) {
      const success = await applyMigration(client, migration);
      if (success) successCount++;
    }
    
    console.log(`\n📊 Resultado: ${successCount}/${migrations.length} migrations aplicadas`);
    
    if (successCount > 0) {
      await verifyMigrations(client);
    }
    
    console.log('\n🎉 Processo concluído!');
    
  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
