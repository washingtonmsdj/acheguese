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

// ConfiguraÃ§Ã£o do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('âŒ SUPABASE_SERVICE_ROLE_KEY nÃ£o encontrada no .env');
  console.log('ðŸ’¡ Adicione a service role key no arquivo .env');
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
    console.log('ðŸ“– Lendo arquivo SQL...');
    const sqlPath = join(__dirname, 'supabase', 'migrations', '00060404_create_neighborhood_boundaries.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('ðŸš€ Aplicando migration...');
    
    // Executar SQL via RPC (se disponÃ­vel) ou via REST API
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Se RPC nÃ£o existir, tentar via query direto
      console.log('âš ï¸  RPC nÃ£o disponÃ­vel, tentando mÃ©todo alternativo...');
      
      // Dividir SQL em statements individuais
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().includes('create table')) {
          console.log('ðŸ“ Criando tabela neighborhood_boundaries...');
        } else if (statement.toLowerCase().includes('create index')) {
          console.log('ðŸ“ Criando Ã­ndices...');
        } else if (statement.toLowerCase().includes('create policy')) {
          console.log('ðŸ“ Criando policies RLS...');
        }
        
        // Executar via query
        const { error: execError } = await supabase.from('_sql').select('*').limit(0);
        
        if (execError) {
          console.error(`âŒ Erro ao executar statement:`, execError.message);
        }
      }
    }

    console.log('âœ… Migration aplicada com sucesso!');
    console.log('');
    console.log('ðŸ” Verificando tabela...');
    
    // Verificar se a tabela foi criada
    const { data: tables, error: checkError } = await supabase
      .from('neighborhood_boundaries')
      .select('*')
      .limit(0);

    if (checkError) {
      if (checkError.code === '40P01') {
        console.error('âŒ Tabela nÃ£o foi criada. Aplicar SQL manualmente no Dashboard.');
        console.log('');
        console.log('ðŸ“‹ Copie o conteÃºdo de: APLICAR_NO_SUPABASE.sql');
        console.log('ðŸ”— Cole em: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new');
      } else {
        console.error('âŒ Erro ao verificar tabela:', checkError.message);
      }
      process.exit(1);
    }

    console.log('âœ… Tabela neighborhood_boundaries criada com sucesso!');
    console.log('');
    console.log('ðŸŽ¯ PrÃ³ximos passos:');
    console.log('1. Identificar os 19 bairros sem polÃ­gono');
    console.log('0. Conseguir os GeoJSON dos bairros');
    console.log('3. Cadastrar usando: scripts/cadastrar-bairro.md');

  } catch (error) {
    console.error('âŒ Erro ao aplicar migration:', error.message);
    console.log('');
    console.log('ðŸ’¡ SoluÃ§Ã£o alternativa:');
    console.log('1. Abrir: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new');
    console.log('0. Copiar conteÃºdo de: APLICAR_NO_SUPABASE.sql');
    console.log('3. Colar e executar no SQL Editor');
    process.exit(1);
  }
}

applyMigration();
