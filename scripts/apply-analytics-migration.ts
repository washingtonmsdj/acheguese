/**
 * Script para aplicar migration de analytics enhancement
 * 
 * Usage: tsx scripts/apply-analytics-migration.ts
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
  console.log('🚀 Aplicando migration: analytics enhancement');
  console.log('');

  try {
    // Ler arquivo de migration
    const migrationPath = join(process.cwd(), 'supabase/migrations/20260419000004_enhance_analytics_events.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration carregada:', migrationPath);
    console.log('📏 Tamanho:', migrationSQL.length, 'caracteres');
    console.log('');

    console.log('⏳ Executando migration...');
    console.log('');
    console.log('💡 Nota: Esta migration pode ser aplicada manualmente no Supabase Dashboard');
    console.log('   se houver problemas com a execução automática.');
    console.log('');

    // Tentar executar via REST API
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
      const errorText = await response.text();
      console.log('⚠️  Método automático falhou, mas você pode aplicar manualmente:');
      console.log('');
      console.log('1. Acesse: https://supabase.com/dashboard');
      console.log('2. Vá em SQL Editor');
      console.log('3. Cole o conteúdo de: supabase/migrations/20260419000004_enhance_analytics_events.sql');
      console.log('4. Execute');
      console.log('');
      console.log('Erro:', errorText);
    } else {
      console.log('✅ Migration aplicada com sucesso!');
    }

    console.log('');
    console.log('🎉 Concluído!');
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Verificar colunas adicionadas no Supabase Dashboard');
    console.log('2. Testar AnalyticsService em desenvolvimento');
    console.log('3. Verificar eventos sendo rastreados');
    console.log('4. Testar funções SQL (get_event_statistics, get_conversion_funnel, etc)');

  } catch (error) {
    console.error('');
    console.error('❌ Erro ao aplicar migration:');
    console.error(error);
    console.error('');
    console.error('💡 Dica: Você pode aplicar manualmente no Supabase Dashboard:');
    console.error('   1. Acesse: https://supabase.com/dashboard');
    console.error('   2. Vá em SQL Editor');
    console.error('   3. Cole o conteúdo de: supabase/migrations/20260419000004_enhance_analytics_events.sql');
    console.error('   4. Execute');
    process.exit(1);
  }
}

applyMigration();
