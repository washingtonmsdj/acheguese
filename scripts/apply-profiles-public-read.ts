import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function applyMigration() {
  console.log('🚀 Aplicando fix de leitura pública de profiles...\n');

  try {
    // Executar SQL diretamente
    console.log('📝 Aplicando política pública de leitura...');
    
    const sql = `
      -- Remover política antiga
      DROP POLICY IF EXISTS "Public can view active profiles" ON profiles;
      
      -- Criar política pública de leitura
      CREATE POLICY "Public can view active profiles"
        ON profiles FOR SELECT
        TO authenticated, anon
        USING (is_active = true);
    `;
    
    // Usar REST API diretamente para executar SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro ao executar SQL:', error);
      
      // Tentar via SQL Editor (instruções manuais)
      console.log('\n⚠️  Não foi possível aplicar automaticamente.');
      console.log('📋 Execute este SQL manualmente no Supabase SQL Editor:\n');
      console.log(sql);
      process.exit(1);
    }
    
    console.log('✅ Política aplicada com sucesso!');
    
    // Verificar
    console.log('\n📋 Testando acesso a profiles...');
    const { data: testData, error: testError } = await supabase
      .from('profiles' as any)
      .select('id, name')
      .limit(1);
    
    if (testError) {
      console.error('⚠️  Erro ao testar:', testError);
    } else {
      console.log(`✅ Acesso OK (${testData?.length || 0} registros)`);
    }
    
    console.log('\n✅ Migration concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

applyMigration();
