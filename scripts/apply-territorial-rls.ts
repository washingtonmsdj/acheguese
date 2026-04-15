/**
 * Aplicar RLS em territorial_groups no banco remoto
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  APLICAR RLS EM TERRITORIAL_GROUPS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Banco: ${supabaseUrl.replace('https://', '').split('.')[0]}.supabase.co`);
  console.log('');

  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260329000001_add_rls_territorial_groups.sql'
  );

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 Executando migration 20260329000001...');
  
  try {
    // Executar SQL via service role (bypass RLS)
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      // Se exec_sql não existe, tentar executar diretamente
      if (error.message.includes('Could not find the function')) {
        console.log('⚠️  exec_sql não disponível, aplicar via Supabase CLI');
        console.log('');
        console.log('Execute manualmente:');
        console.log('  npx supabase db push --db-url <DATABASE_URL>');
        console.log('');
        console.log('Ou aplique via Dashboard > SQL Editor');
        process.exit(1);
      }
      throw error;
    }

    console.log('✅ RLS aplicado com sucesso');
    console.log('');
    console.log('Policies criadas:');
    console.log('  - Territorial groups viewable by all');
    console.log('  - Admins view all territorial groups');
    console.log('  - Admins manage territorial groups');
    console.log('  - Territorial group members viewable by all');
    console.log('  - Admins view all territorial group members');
    console.log('  - Admins manage territorial group members');

  } catch (error: any) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    process.exit(1);
  }
}

main();
