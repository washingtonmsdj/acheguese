/**
 * GATE 2: Aplicar Migration via execução direta de SQL
 * Tenta múltiplas abordagens para executar a migration
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql: string): Promise<any> {
  // Tentar via fetch direto à API REST do PostgREST
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

async function applyMigrationDirectly() {
  console.log('🚀 GATE 2: Aplicando Migration via SQL Direto\n');
  console.log('=' .repeat(60));
  console.log('\n');

  try {
    // Verificar colunas atuais
    console.log('🔍 Verificando colunas atuais...');
    
    const { data: currentData, error: selectError } = await supabase
      .from('driver_locations')
      .select('*')
      .limit(1);

    if (selectError) {
      throw selectError;
    }

    const currentColumns = currentData && currentData.length > 0 
      ? Object.keys(currentData[0]) 
      : [];

    console.log('📋 Colunas existentes:', currentColumns.join(', '));

    const requiredColumns = ['accuracy', 'heading', 'speed', 'altitude'];
    const missingColumns = requiredColumns.filter(col => !currentColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log('\n✅ Todas as colunas GPS já existem!');
      console.log('\n📝 Próximos passos:');
      console.log('  npm run test tests/e2e/gate2-tracking-pipeline.test.ts');
      return;
    }

    console.log('⚠️  Colunas faltantes:', missingColumns.join(', '));
    console.log('\n⏳ Tentando aplicar migration...\n');

    // Tentar executar cada comando individualmente
    const commands = [
      {
        name: 'accuracy',
        sql: 'ALTER TABLE driver_locations ADD COLUMN IF NOT EXISTS accuracy DECIMAL(10,2);'
      },
      {
        name: 'heading',
        sql: 'ALTER TABLE driver_locations ADD COLUMN IF NOT EXISTS heading DECIMAL(5,2);'
      },
      {
        name: 'speed',
        sql: 'ALTER TABLE driver_locations ADD COLUMN IF NOT EXISTS speed DECIMAL(6,2);'
      },
      {
        name: 'altitude',
        sql: 'ALTER TABLE driver_locations ADD COLUMN IF NOT EXISTS altitude DECIMAL(8,2);'
      },
      {
        name: 'idx_updated_at',
        sql: 'CREATE INDEX IF NOT EXISTS idx_driver_locations_updated_at ON driver_locations(updated_at DESC);'
      },
      {
        name: 'idx_driver_time',
        sql: 'CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_time ON driver_locations(driver_profile_id, updated_at DESC);'
      }
    ];

    for (const cmd of commands) {
      try {
        console.log(`  ⏳ Executando: ${cmd.name}...`);
        await executeSQL(cmd.sql);
        console.log(`  ✅ ${cmd.name}`);
      } catch (error: any) {
        if (error.message.includes('exec_sql')) {
          throw new Error('FUNÇÃO_NAO_EXISTE');
        }
        console.error(`  ❌ ${cmd.name}: ${error.message}`);
        throw error;
      }
    }

    console.log('\n✅ Migration aplicada com sucesso!\n');

    // Validar
    console.log('🔍 Validando...');
    const { data: newData } = await supabase
      .from('driver_locations')
      .select('*')
      .limit(1);

    const newColumns = newData && newData.length > 0 ? Object.keys(newData[0]) : [];
    
    console.log('\n📋 Colunas após migration:');
    newColumns.forEach(col => {
      const isNew = requiredColumns.includes(col);
      const marker = isNew ? '✨' : '  ';
      console.log(`  ${marker} ${col}`);
    });

    const allCreated = requiredColumns.every(col => newColumns.includes(col));

    if (allCreated) {
      console.log('\n🎉 GATE 2 Migration aplicada e validada!\n');
      console.log('=' .repeat(60));
      console.log('\n📝 Próximos passos:\n');
      console.log('  npm run test tests/e2e/gate2-tracking-pipeline.test.ts\n');
      console.log('=' .repeat(60));
    } else {
      console.error('\n❌ Algumas colunas não foram criadas');
      process.exit(1);
    }

  } catch (error: any) {
    if (error.message === 'FUNÇÃO_NAO_EXISTE') {
      console.error('\n❌ Função exec_sql não existe no banco\n');
      console.error('📋 OPÇÕES DISPONÍVEIS:\n');
      console.error('1️⃣  Aplicação manual via SQL Editor (mais rápido):');
      console.error('   .\abrir-sql-editor-gate2.ps1\n');
      console.error('2️⃣  Aplicação via PostgreSQL CLI (se tiver senha):');
      console.error('   Adicione ao .env: SUPABASE_DB_PASSWORD="sua_senha"');
      console.error('   Execute: npm run apply:gate2:remote\n');
      console.error('3️⃣  Obter senha do banco:');
      console.error('   Supabase Dashboard > Settings > Database > Database password\n');
    } else {
      console.error('\n❌ Erro:', error.message);
    }
    process.exit(1);
  }
}

applyMigrationDirectly();
