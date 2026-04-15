/**
 * Script para aplicar migrations de Reviews e Favoritos
 * 
 * Uso: npx tsx supabase/scripts/apply-gastronomy-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Configuração
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas:');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Cliente com service role (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration(filePath: string, description: string) {
  console.log(`\n📄 Aplicando: ${description}`);
  console.log(`   Arquivo: ${filePath}`);

  try {
    // Ler arquivo SQL
    const sql = readFileSync(filePath, 'utf-8');

    // Executar SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      // Se a função exec_sql não existir, tentar executar diretamente
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('   ⚠️  Função exec_sql não existe, executando via query...');
        
        // Dividir em statements individuais (separados por ;)
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          if (statement) {
            console.log(`   Executando statement ${i + 1}/${statements.length}...`);
            const { error: stmtError } = await supabase.rpc('exec', { 
              sql: statement + ';' 
            });
            
            if (stmtError) {
              console.error(`   ❌ Erro no statement ${i + 1}:`, stmtError.message);
              throw stmtError;
            }
          }
        }
      } else {
        throw error;
      }
    }

    console.log('   ✅ Migração aplicada com sucesso!');
    return true;
  } catch (error: any) {
    console.error('   ❌ Erro ao aplicar migração:', error.message);
    return false;
  }
}

async function checkTableExists(tableName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  return !error || !error.message.includes('does not exist');
}

async function main() {
  console.log('🚀 Iniciando aplicação de migrações de Gastronomia\n');
  console.log('📊 Conectando ao Supabase...');
  console.log(`   URL: ${SUPABASE_URL}`);

  // Verificar conexão
  const { data: healthCheck, error: healthError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (healthError) {
    console.error('❌ Erro ao conectar ao Supabase:', healthError.message);
    process.exit(1);
  }

  console.log('✅ Conexão estabelecida!\n');

  // Verificar se tabelas já existem
  console.log('🔍 Verificando estado atual do banco...');
  
  const reviewReportsExists = await checkTableExists('review_reports');
  const favoritesExists = await checkTableExists('user_favorite_businesses');

  console.log(`   review_reports: ${reviewReportsExists ? '✓ existe' : '✗ não existe'}`);
  console.log(`   user_favorite_businesses: ${favoritesExists ? '✓ existe' : '✗ não existe'}`);

  if (reviewReportsExists && favoritesExists) {
    console.log('\n⚠️  As tabelas já existem. Deseja continuar? (pode causar erros)');
    console.log('   Pressione Ctrl+C para cancelar ou Enter para continuar...');
    // Em produção, adicionar readline para confirmação
  }

  // Aplicar migrações
  const migrations = [
    {
      file: join(process.cwd(), 'supabase/migrations/20260412000001_add_gastronomy_reviews_enhancements.sql'),
      description: 'Reviews Enhancements (fotos, denúncias, helpfulness)',
    },
    {
      file: join(process.cwd(), 'supabase/migrations/20260412000002_add_user_favorites.sql'),
      description: 'User Favorites (favoritos, tags, notificações)',
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await applyMigration(migration.file, migration.description);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA APLICAÇÃO');
  console.log('='.repeat(60));
  console.log(`✅ Migrações aplicadas com sucesso: ${successCount}`);
  console.log(`❌ Migrações com erro: ${failCount}`);
  console.log('='.repeat(60));

  if (failCount > 0) {
    console.log('\n⚠️  Algumas migrações falharam. Verifique os erros acima.');
    process.exit(1);
  }

  // Verificar tabelas criadas
  console.log('\n🔍 Verificando tabelas criadas...');
  
  const tables = [
    'review_reports',
    'review_helpfulness',
    'user_favorite_businesses',
  ];

  for (const table of tables) {
    const exists = await checkTableExists(table);
    console.log(`   ${table}: ${exists ? '✅ criada' : '❌ não encontrada'}`);
  }

  console.log('\n🎉 Migrações aplicadas com sucesso!');
  console.log('\n📝 Próximos passos:');
  console.log('   1. Testar criação de reviews');
  console.log('   2. Testar sistema de favoritos');
  console.log('   3. Verificar RLS policies');
  console.log('   4. Testar no frontend\n');
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
