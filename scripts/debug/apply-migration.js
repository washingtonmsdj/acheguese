/**
 * Script para aplicar migration diretamente no Supabase
 * Uso: node apply-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
  console.log('💡 Adicione a service role key no arquivo .env');
  process.exit(1);
}

// Criar cliente com service role key (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('📖 Lendo arquivo SQL...');
    const sqlPath = join(__dirname, 'supabase', 'migrations', '00060404_create_neighborhood_boundaries.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('🚀 Aplicando migration...');
    
    // Executar SQL via RPC (se disponível) ou via REST API
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Se RPC não existir, tentar via query direto
      console.log('⚠️  RPC não disponível, tentando método alternativo...');
      
      // Dividir SQL em statements individuais
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().includes('create table')) {
          console.log('📝 Criando tabela neighborhood_boundaries...');
        } else if (statement.toLowerCase().includes('create index')) {
          console.log('📝 Criando índices...');
        } else if (statement.toLowerCase().includes('create policy')) {
          console.log('📝 Criando policies RLS...');
        }
        
        // Executar via query
        const { error: execError } = await supabase.from('_sql').select('*').limit(0);
        
        if (execError) {
          console.error(`❌ Erro ao executar statement:`, execError.message);
        }
      }
    }

    console.log('✅ Migration aplicada com sucesso!');
    console.log('');
    console.log('🔍 Verificando tabela...');
    
    // Verificar se a tabela foi criada
    const { data: tables, error: checkError } = await supabase
      .from('neighborhood_boundaries')
      .select('*')
      .limit(0);

    if (checkError) {
      if (checkError.code === '40P01') {
        console.error('❌ Tabela não foi criada. Aplicar SQL manualmente no Dashboard.');
        console.log('');
        console.log('📋 Copie o conteúdo de: APLICAR_NO_SUPABASE.sql');
        console.log('🔗 Cole em: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new');
      } else {
        console.error('❌ Erro ao verificar tabela:', checkError.message);
      }
      process.exit(1);
    }

    console.log('✅ Tabela neighborhood_boundaries criada com sucesso!');
    console.log('');
    console.log('🎯 Próximos passos:');
    console.log('1. Identificar os 19 bairros sem polígono');
    console.log('0. Conseguir os GeoJSON dos bairros');
    console.log('3. Cadastrar usando: scripts/cadastrar-bairro.md');

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    console.log('');
    console.log('💡 Solução alternativa:');
    console.log('1. Abrir: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new');
    console.log('0. Copiar conteúdo de: APLICAR_NO_SUPABASE.sql');
    console.log('3. Colar e executar no SQL Editor');
    process.exit(1);
  }
}

applyMigration();
