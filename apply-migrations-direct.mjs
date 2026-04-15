#!/usr/bin/env node

/**
 * Script para aplicar migrations diretamente no banco Supabase
 * Usa a connection string do .env
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Carregar .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurar Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migrations para aplicar
const migrations = [
  {
    version: '20260413100000',
    name: 'create_business_subscriptions',
    file: 'supabase/migrations/20260413100000_create_business_subscriptions.sql'
  },
  {
    version: '20260413100001',
    name: 'create_business_premium_links',
    file: 'supabase/migrations/20260413100001_create_business_premium_links.sql'
  },
  {
    version: '20260413100002',
    name: 'migrate_gastronomy_to_business_subscriptions',
    file: 'supabase/migrations/20260413100002_migrate_gastronomy_to_business_subscriptions.sql'
  },
  {
    version: '20260413110000',
    name: 'create_qr_codes_system',
    file: 'supabase/migrations/20260413110000_create_qr_codes_system.sql'
  }
];

async function executeSql(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    // Tentar via REST API diretamente
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql_query: sql })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return await response.json();
  }
  
  return data;
}

async function checkMigrationApplied(version) {
  try {
    const { data, error } = await supabase
      .from('supabase_migrations.schema_migrations')
      .select('version')
      .eq('version', version)
      .single();
    
    return !error && data;
  } catch (e) {
    return false;
  }
}

async function applyMigration(migration) {
  console.log(`\n📦 Aplicando: ${migration.name}...`);
  
  // Verificar se já foi aplicada
  const applied = await checkMigrationApplied(migration.version);
  if (applied) {
    console.log(`   ⏭️  Já aplicada, pulando...`);
    return true;
  }
  
  try {
    // Ler arquivo SQL
    const sqlPath = join(__dirname, migration.file);
    const sql = readFileSync(sqlPath, 'utf-8');
    
    console.log(`   📄 Lendo: ${migration.file}`);
    console.log(`   🔧 Executando SQL...`);
    
    // Executar SQL diretamente via fetch (mais confiável)
    const { data: { session } } = await supabase.auth.getSession();
    
    // Usar postgres REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (!response.ok && response.status !== 201) {
      const errorText = await response.text();
      console.error(`   ❌ Erro HTTP ${response.status}:`, errorText);
      return false;
    }
    
    console.log(`   ✅ SQL executado com sucesso`);
    
    // Registrar migration
    console.log(`   📝 Registrando migration...`);
    const { error: insertError } = await supabase
      .from('supabase_migrations.schema_migrations')
      .insert({
        version: migration.version,
        name: migration.name,
        statements: ['Applied via script']
      });
    
    if (insertError) {
      console.warn(`   ⚠️  Aviso ao registrar: ${insertError.message}`);
    } else {
      console.log(`   ✅ Migration registrada`);
    }
    
    console.log(`   ✅ ${migration.name} aplicada com sucesso!`);
    return true;
    
  } catch (error) {
    console.error(`   ❌ Erro ao aplicar ${migration.name}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Aplicando Migrations: Billing + QR Code\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Service Key: ${supabaseServiceKey.substring(0, 20)}...`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO:');
  console.log(`   ✅ Sucesso: ${successCount}`);
  console.log(`   ❌ Falhas: ${failCount}`);
  console.log('='.repeat(60));
  
  if (failCount === 0) {
    console.log('\n🎉 Todas as migrations foram aplicadas com sucesso!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Algumas migrations falharam. Verifique os erros acima.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
