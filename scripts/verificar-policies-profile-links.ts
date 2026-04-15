import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificarPolicies() {
  console.log('🔍 VERIFICANDO POLICIES DE profile_links...\n');
  
  // Verificar policies aplicadas via SQL direto
  const { data: policies, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles::text[],
        cmd,
        qual
      FROM pg_policies 
      WHERE tablename = 'profile_links'
      ORDER BY policyname;
    `
  });
  
  if (error) {
    console.error('❌ Erro ao buscar policies:', error);
    console.log('\n⚠️ Tentando query alternativa...\n');
    
    // Query alternativa usando SQL direto
    const query = `
      SELECT 
        policyname,
        cmd,
        qual
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'profile_links'
      ORDER BY policyname;
    `;
    
    const result = await supabase.rpc('exec_sql', { sql: query });
    console.log('Resultado:', JSON.stringify(result, null, 2));
    return;
  }
  
  console.log('📋 POLICIES APLICADAS:\n');
  policies?.forEach((policy: any) => {
    console.log(`Policy: ${policy.policyname}`);
    console.log(`  Comando: ${policy.cmd}`);
    console.log(`  Roles: ${policy.roles}`);
    console.log(`  Qual: ${policy.qual}`);
    console.log('');
  });
  
  console.log(`\n✅ Total de policies: ${policies?.length || 0}`);
}

verificarPolicies().catch(console.error);
