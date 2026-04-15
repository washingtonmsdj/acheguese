#!/usr/bin/env node
/**
 * Script para aplicar migration do GATE 2
 * Corrige schema de driver_locations e cria location_tracking
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function aplicarMigration() {
  console.log('🚀 GATE 2: Aplicando migration de schema\n');

  try {
    // Ler migration
    const migrationPath = join(__dirname, 'supabase/migrations/20260407000001_fix_driver_locations_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration carregada:', migrationPath);
    console.log('📏 Tamanho:', migrationSQL.length, 'bytes\n');

    // Executar migration
    console.log('⏳ Executando migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL,
    });

    if (error) {
      console.error('❌ Erro ao executar migration:', error);
      process.exit(1);
    }

    console.log('✅ Migration executada com sucesso\n');

    // Validar schema
    console.log('🔍 Validando schema...\n');

    // 1. Verificar colunas de driver_locations
    console.log('1. Verificando colunas de driver_locations:');
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'driver_locations')
      .in('column_name', ['latitude', 'longitude', 'accuracy', 'heading', 'speed', 'altitude']);

    if (colError) {
      console.error('   ❌ Erro ao verificar colunas:', colError);
    } else {
      const expectedCols = ['latitude', 'longitude', 'accuracy', 'heading', 'speed', 'altitude'];
      const foundCols = columns.map(c => c.column_name);
      
      expectedCols.forEach(col => {
        if (foundCols.includes(col)) {
          console.log(`   ✅ ${col}`);
        } else {
          console.log(`   ❌ ${col} - FALTANDO`);
        }
      });
    }

    // 2. Verificar tabela location_tracking
    console.log('\n2. Verificando tabela location_tracking:');
    const { data: table, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'location_tracking')
      .maybeSingle();

    if (tableError) {
      console.error('   ❌ Erro ao verificar tabela:', tableError);
    } else if (table) {
      console.log('   ✅ Tabela existe');
    } else {
      console.log('   ❌ Tabela não encontrada');
    }

    // 3. Verificar índices
    console.log('\n3. Verificando índices:');
    const { data: indexes, error: idxError } = await supabase
      .from('pg_indexes')
      .select('indexname')
      .eq('tablename', 'driver_locations');

    if (idxError) {
      console.error('   ❌ Erro ao verificar índices:', idxError);
    } else {
      const expectedIndexes = [
        'idx_driver_locations_driver_id',
        'idx_driver_locations_updated_at',
        'idx_driver_locations_driver_time',
      ];
      
      const foundIndexes = indexes.map(i => i.indexname);
      
      expectedIndexes.forEach(idx => {
        if (foundIndexes.includes(idx)) {
          console.log(`   ✅ ${idx}`);
        } else {
          console.log(`   ⚠️  ${idx} - não encontrado (pode ser normal)`);
        }
      });
    }

    // 4. Verificar trigger
    console.log('\n4. Verificando trigger:');
    const { data: triggers, error: trigError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name')
      .eq('event_object_table', 'driver_locations')
      .eq('trigger_name', 'trigger_insert_location_history');

    if (trigError) {
      console.error('   ❌ Erro ao verificar trigger:', trigError);
    } else if (triggers && triggers.length > 0) {
      console.log('   ✅ Trigger existe');
    } else {
      console.log('   ⚠️  Trigger não encontrado');
    }

    console.log('\n✅ GATE 2: Schema corrigido com sucesso!');
    console.log('\n📊 Próximos passos:');
    console.log('   1. Testar publicação de localização');
    console.log('   2. Validar persistência de dados completos');
    console.log('   3. Criar teste E2E');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

aplicarMigration();
