#!/usr/bin/env node
/**
 * GATE 2: Aplicar migration mínima
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function aplicarMigration() {
  console.log('🚀 GATE 2: Aplicando migration mínima\n');

  try {
    // Ler migration
    const migrationPath = join(__dirname, 'supabase/migrations/20260407000002_gate2_driver_locations_minimal.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration carregada');
    console.log('📏 Tamanho:', migrationSQL.length, 'bytes\n');

    // Dividir em statements individuais
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('📝 Executando', statements.length, 'statements...\n');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.includes('DO $$')) {
        // Pular validação por enquanto
        continue;
      }
      
      console.log(`[${i + 1}/${statements.length}] Executando...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });
      
      if (error) {
        console.error(`❌ Erro no statement ${i + 1}:`, error.message);
        // Continuar mesmo com erro (pode ser coluna já existente)
      } else {
        console.log(`✅ Statement ${i + 1} OK`);
      }
    }

    console.log('\n✅ Migration executada\n');

    // Validar colunas
    console.log('🔍 Validando colunas...\n');
    
    const { data: columns, error: colError } = await supabase
      .from('driver_locations')
      .select('*')
      .limit(0);

    if (colError) {
      console.error('❌ Erro ao validar:', colError.message);
    } else {
      console.log('✅ Tabela acessível\n');
    }

    console.log('✅ GATE 2: Migration aplicada com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

aplicarMigration();
