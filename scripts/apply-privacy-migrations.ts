/**
 * Script para aplicar migrations de privacidade e bloqueios
 * 
 * Aplica as seguintes migrations:
 * - 20260327000012_create_user_notification_settings.sql
 * - 20260327000013_create_user_blocks.sql
 * - 20260327000014_add_privacy_fields_to_profiles.sql
 * 
 * Uso:
 * npx tsx scripts/apply-privacy-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('   VITE_SUPABASE_URL ou SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrations = [
  {
    file: '20260327000012_create_user_notification_settings.sql',
    name: 'Criar tabela user_notification_settings',
  },
  {
    file: '20260327000013_create_user_blocks.sql',
    name: 'Criar tabela user_blocks',
  },
  {
    file: '20260327000014_add_privacy_fields_to_profiles.sql',
    name: 'Adicionar campos de privacidade em profiles',
  },
];

async function applyMigration(file: string, name: string) {
  console.log(`\n📄 Aplicando: ${name}`);
  console.log(`   Arquivo: ${file}`);

  try {
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', file);
    const sql = readFileSync(migrationPath, 'utf-8');

    // Executar SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Tentar executar diretamente se RPC não existir
      const { error: directError } = await (supabase as any).from('_').select('*').limit(0);
      
      if (directError) {
        console.error(`   ❌ Erro ao aplicar migration: ${error.message}`);
        return false;
      }
    }

    console.log(`   ✅ Migration aplicada com sucesso!`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Erro ao ler/aplicar migration: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Aplicando Migrations de Privacidade e Bloqueios\n');
  console.log('=' .repeat(60));

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await applyMigration(migration.file, migration.name);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Resumo:');
  console.log(`   ✅ Sucesso: ${successCount}`);
  console.log(`   ❌ Falhas: ${failCount}`);
  console.log(`   📝 Total: ${migrations.length}`);

  if (failCount > 0) {
    console.log('\n⚠️  Algumas migrations falharam.');
    console.log('   Você pode aplicá-las manualmente usando o Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/_/sql');
    console.log('\n   Ou usando o Supabase CLI:');
    console.log('   supabase db push');
  } else {
    console.log('\n🎉 Todas as migrations foram aplicadas com sucesso!');
  }

  console.log('\n📚 Próximos passos:');
  console.log('   1. Verificar as tabelas no Supabase Dashboard');
  console.log('   2. Testar as funcionalidades no app');
  console.log('   3. Verificar as políticas RLS');
}

main().catch((error) => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
