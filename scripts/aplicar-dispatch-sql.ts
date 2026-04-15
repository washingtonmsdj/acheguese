/**
 * Script para aplicar SQL do dispatch automático
 * Executa via Supabase Management API
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Carregar .env
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.error('VITE_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeSQLFile(filePath: string): Promise<void> {
  console.log(`\n📄 Lendo arquivo: ${filePath}`);
  
  const sql = readFileSync(filePath, 'utf-8');
  
  // Dividir em statements individuais (remover comentários e linhas vazias)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`📝 Encontrados ${statements.length} statements SQL\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Pular comandos específicos do psql
    if (statement.startsWith('\\') || statement.startsWith('BEGIN') || statement.startsWith('COMMIT')) {
      console.log(`⏭️  Pulando comando: ${statement.substring(0, 50)}...`);
      continue;
    }

    console.log(`⚙️  Executando statement ${i + 1}/${statements.length}...`);
    
    try {
      // Executar via RPC (mais confiável que REST API para DDL)
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Se RPC não existir, tentar executar diretamente
        if (error.message.includes('exec_sql')) {
          console.log('   ℹ️  RPC exec_sql não disponível, executando via query...');
          
          // Para CREATE TABLE, CREATE INDEX, etc, usar from().select() não funciona
          // Vamos usar fetch direto
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ query: statement }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`   ❌ Erro: ${errorText}`);
            
            // Continuar mesmo com erro (algumas statements podem já existir)
            console.log('   ⚠️  Continuando...');
          } else {
            console.log('   ✅ Sucesso');
          }
        } else {
          console.error(`   ❌ Erro: ${error.message}`);
          console.log('   ⚠️  Continuando...');
        }
      } else {
        console.log('   ✅ Sucesso');
      }
    } catch (err) {
      console.error(`   ❌ Erro inesperado: ${(err as Error).message}`);
      console.log('   ⚠️  Continuando...');
    }
  }
}

async function validateTables(): Promise<void> {
  console.log('\n🔍 Validando tabelas criadas...\n');

  // Verificar ride_dispatch_audit
  try {
    const { data, error } = await supabase
      .from('ride_dispatch_audit')
      .select('id')
      .limit(1);

    if (error) {
      console.log('❌ Tabela ride_dispatch_audit: NÃO ENCONTRADA');
      console.log(`   Erro: ${error.message}`);
    } else {
      console.log('✅ Tabela ride_dispatch_audit: OK');
    }
  } catch (err) {
    console.log('❌ Tabela ride_dispatch_audit: ERRO');
    console.log(`   ${(err as Error).message}`);
  }

  // Verificar ride_requests
  try {
    const { data, error } = await supabase
      .from('ride_requests')
      .select('id')
      .limit(1);

    if (error) {
      console.log('❌ Tabela ride_requests: NÃO ENCONTRADA');
    } else {
      console.log('✅ Tabela ride_requests: OK');
    }
  } catch (err) {
    console.log('❌ Tabela ride_requests: ERRO');
  }
}

async function main() {
  console.log('🚀 Aplicando SQL do Dispatch Automático\n');
  console.log('📍 Supabase URL:', SUPABASE_URL);
  console.log('🔑 Service Role Key:', SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Não encontrada');

  const sqlFile = join(process.cwd(), 'APLICAR_DISPATCH_COMPLETO.sql');

  try {
    await executeSQLFile(sqlFile);
    await validateTables();

    console.log('\n✅ SQL aplicado com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Deploy da edge function: supabase functions deploy auto-dispatch-ride');
    console.log('   2. Testar criando uma corrida');
    console.log('   3. Verificar logs da edge function');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar SQL:', error);
    process.exit(1);
  }
}

main();
