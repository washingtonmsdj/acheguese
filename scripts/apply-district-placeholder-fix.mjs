/**
 * Script para aplicar fix de placeholder de district nas funções RPC públicas
 * Executa: node scripts/apply-district-placeholder-fix.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('🚀 Aplicando fix de placeholder de district...\n');

  const migrationPath = join(__dirname, '../supabase/migrations/20260425000001_fix_public_snapshots_district_placeholder.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration carregada:', migrationPath);
  console.log('📏 Tamanho:', migrationSQL.length, 'caracteres\n');

  try {
    // Dividir em statements individuais (separados por $$;)
    const statements = migrationSQL
      .split(/\$\$;/g)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s + '$$;'); // Adicionar de volta o delimitador

    console.log(`📦 Executando ${statements.length} statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.trim().startsWith('--') || stmt.trim().length < 10) continue;

      console.log(`   [${i + 1}/${statements.length}] Executando statement...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        console.error(`   ❌ Erro no statement ${i + 1}:`, error);
        throw error;
      }
      
      console.log(`   ✅ Statement ${i + 1} executado com sucesso`);
    }

    console.log('\n✅ Migration aplicada com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Recarregue a aplicação no navegador');
    console.log('   2. O erro 400 não deve mais ocorrer');
    console.log('   3. URLs sem district específico agora funcionam corretamente');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error);
    console.log('\n🔧 Solução alternativa:');
    console.log('1. Acesse: https://xhdowzacfujckjelqhtd.supabase.co/project/xhdowzacfujckjelqhtd/sql');
    console.log('2. Clique em "New Query"');
    console.log('3. Cole o conteúdo de: supabase/migrations/20260425000001_fix_public_snapshots_district_placeholder.sql');
    console.log('4. Clique em "Run"');
    process.exit(1);
  }
}

applyMigration();
