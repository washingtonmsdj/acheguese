import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function fixDriverView() {
  console.log('🔧 Recriando view driver_complete_profile com created_at...\n');
  
  // Ler o SQL da migration
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260401000003_fix_driver_complete_profile_view.sql');
  const sql = readFileSync(migrationPath, 'utf-8');
  
  // Executar cada statement separadamente
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'));
  
  for (const statement of statements) {
    if (!statement) continue;
    
    console.log(`📝 Executando: ${statement.substring(0, 60)}...`);
    
    try {
      // Usar query raw do supabase
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Tentar método alternativo
        console.log('⚠️  Método RPC falhou, tentando query direta...');
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: statement })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      }
      
      console.log('✅ Sucesso\n');
    } catch (err) {
      console.error('❌ Erro:', err);
      console.log('\n💡 Execute manualmente no Supabase SQL Editor:\n');
      console.log(sql);
      process.exit(1);
    }
  }
  
  // Testar a view
  console.log('🧪 Testando a view...');
  const { data, error } = await supabase
    .from('driver_complete_profile')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error('❌ Erro ao testar view:', error);
    process.exit(1);
  }
  
  console.log('✅ View funcionando corretamente!');
  console.log('Exemplo de dados:', data);
}

fixDriverView().catch(console.error);
