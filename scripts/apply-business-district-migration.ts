/**
 * Script: Aplicar Migration de Business URL com District
 * 
 * Aplica apenas a migration 20260329000012_business_url_with_district.sql
 * diretamente no banco, pulando migrations anteriores que já foram aplicadas.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔧 Aplicando migration: business_url_with_district\n');

  // Ler arquivo SQL
  const migrationPath = resolve(process.cwd(), 'supabase/migrations/20260329000012_business_url_with_district.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration carregada');
  console.log(`📏 Tamanho: ${sql.length} caracteres\n`);

  // Executar SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }) as any;

  if (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    process.exit(1);
  }

  console.log('✅ Migration aplicada com sucesso!\n');
  console.log('📋 Resultado:', data);
}

applyMigration();
