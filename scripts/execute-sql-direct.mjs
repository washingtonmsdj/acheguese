#!/usr/bin/env node

/**
 * GATE 5: Executar SQL diretamente via API REST do Supabase
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos');
  process.exit(1);
}

// Extrair project ref da URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Erro: Não foi possível extrair project ref da URL');
  process.exit(1);
}

console.log('🔧 Configuração:');
console.log(`  Project: ${projectRef}`);
console.log(`  URL: ${supabaseUrl}`);
console.log('');

/**
 * Executar SQL via psql direto (usando pg client)
 */
async function executeSqlDirect(sql) {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Dividir SQL em statements individuais
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/));

  console.log(`📊 Executando ${statements.length} statements...\n`);

  const results = [];

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 100).replace(/\s+/g, ' ');
    
    console.log(`${i + 1}/${statements.length}. ${preview}...`);

    try {
      // Para statements DDL (ALTER, CREATE, DROP), usar rpc se disponível
      if (statement.match(/^(ALTER|CREATE|DROP|COMMENT)/i)) {
        // Tentar executar diretamente
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({ query: statement }),
        });

        if (response.ok) {
          console.log('   ✅ OK');
          results.push({ statement: preview, success: true });
        } else {
          const error = await response.text();
          console.log(`   ⚠️ Usando método alternativo...`);
          
          // Método alternativo: usar client direto
          const { error: clientError } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          if (clientError) {
            console.log(`   ⚠️ Aviso: ${clientError.message}`);
            results.push({ statement: preview, success: false, error: clientError.message });
          } else {
            console.log('   ✅ OK (método alternativo)');
            results.push({ statement: preview, success: true });
          }
        }
      } else {
        // Para SELECT, usar query normal
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.log(`   ⚠️ Aviso: ${error.message}`);
          results.push({ statement: preview, success: false, error: error.message });
        } else {
          console.log('   ✅ OK');
          if (data) {
            console.log('   📊 Resultado:', JSON.stringify(data).substring(0, 100));
          }
          results.push({ statement: preview, success: true, data });
        }
      }
    } catch (error) {
      console.log(`   ⚠️ Erro: ${error.message}`);
      results.push({ statement: preview, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Método alternativo: usar pg client direto
 */
async function executeSqlWithPg(sql) {
  console.log('🔄 Tentando método alternativo com pg client...\n');
  
  try {
    const pg = await import('pg');
    const { Client } = pg.default || pg;

    // Construir connection string
    const connectionString = `postgresql://postgres.${projectRef}:${supabaseServiceKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    console.log('✅ Conectado ao banco via pg client\n');

    // Executar SQL
    const result = await client.query(sql);
    
    console.log('✅ SQL executado com sucesso!');
    console.log('Resultado:', result.rows);

    await client.end();
    return { success: true, result: result.rows };
  } catch (error) {
    console.error('❌ Erro ao executar via pg client:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main
 */
async function main() {
  console.log('🚀 GATE 5: Executando SQL Fix de RLS\n');

  // Ler SQL
  const sqlPath = join(__dirname, '..', 'APLICAR_GATE5_RLS_FIX.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  console.log('📝 SQL a ser executado:');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('');

  // Tentar método 1: via Supabase client
  console.log('🔄 Método 1: Via Supabase Client\n');
  const results = await executeSqlDirect(sql);

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log('\n📊 Resumo:');
  console.log(`  ✅ Sucesso: ${successCount}`);
  console.log(`  ❌ Falhas: ${failCount}`);

  if (failCount > 0) {
    console.log('\n⚠️ Algumas operações falharam. Tentando método alternativo...\n');
    await executeSqlWithPg(sql);
  }

  console.log('\n✅ Processo concluído!');
}

main().catch(console.error);
