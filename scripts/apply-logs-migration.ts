/**
 * Script para aplicar migration de application_logs
 * 
 * Usage: tsx scripts/apply-logs-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  console.error('Configure no .env.local ou via variáveis de ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Aplicando migration: application_logs');
  console.log('');

  try {
    // Ler arquivo de migration
    const migrationPath = join(process.cwd(), 'supabase/migrations/20260419000003_create_application_logs.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration carregada:', migrationPath);
    console.log('📏 Tamanho:', migrationSQL.length, 'caracteres');
    console.log('');

    // Executar migration
    console.log('⏳ Executando migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // Tentar executar diretamente via REST API
      console.log('⚠️  Tentando método alternativo...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql: migrationSQL }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      console.log('✅ Migration aplicada com sucesso (método alternativo)!');
    } else {
      console.log('✅ Migration aplicada com sucesso!');
      if (data) {
        console.log('📊 Resultado:', data);
      }
    }

    console.log('');
    console.log('🎉 Concluído!');
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Verificar tabela no Supabase Dashboard');
    console.log('2. Testar logger em desenvolvimento');
    console.log('3. Verificar logs sendo persistidos');

  } catch (error) {
    console.error('');
    console.error('❌ Erro ao aplicar migration:');
    console.error(error);
    console.error('');
    console.error('💡 Dica: Você pode aplicar manualmente no Supabase Dashboard:');
    console.error('   1. Acesse: https://supabase.com/dashboard');
    console.error('   2. Vá em SQL Editor');
    console.error('   3. Cole o conteúdo de: supabase/migrations/20260419000003_create_application_logs.sql');
    console.error('   4. Execute');
    process.exit(1);
  }
}

applyMigration();
