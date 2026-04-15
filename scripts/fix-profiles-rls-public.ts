import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProfilesRLS() {
  console.log('🚀 Corrigindo políticas RLS de profiles...\n');

  try {
    // Passo 1: Remover políticas antigas
    console.log('📝 Removendo políticas antigas...');
    
    const policiesToDrop = [
      "Users can view profiles where they are members",
      "Profile managers can update profiles",
      "Users can view own profiles",
      "Active profiles viewable",
      "Account owners can update their profiles",
      "Users manage own profiles"
    ];

    for (const policy of policiesToDrop) {
      const { error } = await supabase.rpc('exec', {
        sql: `DROP POLICY IF EXISTS "${policy}" ON profiles;`
      });
      
      if (error && !error.message?.includes('does not exist')) {
        console.log(`⚠️  Aviso ao remover "${policy}":`, error.message);
      }
    }
    
    console.log('✅ Políticas antigas removidas\n');

    // Passo 2: Criar políticas corretas
    console.log('📝 Criando políticas corretas...');
    
    // SELECT: Próprios perfis
    await supabase.rpc('exec', {
      sql: `
        CREATE POLICY "Users can view own profiles"
          ON profiles FOR SELECT
          TO authenticated
          USING (user_id = auth.uid());
      `
    });
    console.log('✅ Política "Users can view own profiles" criada');

    // SELECT: Perfis ativos (leitura pública)
    await supabase.rpc('exec', {
      sql: `
        CREATE POLICY "Active profiles viewable"
          ON profiles FOR SELECT
          TO authenticated, anon
          USING (is_active = true);
      `
    });
    console.log('✅ Política "Active profiles viewable" criada');

    // UPDATE: Apenas dono
    await supabase.rpc('exec', {
      sql: `
        CREATE POLICY "Account owners can update their profiles"
          ON profiles FOR UPDATE
          TO authenticated
          USING (user_id = auth.uid())
          WITH CHECK (user_id = auth.uid());
      `
    });
    console.log('✅ Política "Account owners can update their profiles" criada\n');

    // Passo 3: Verificar
    console.log('📋 Testando acesso...');
    const { data, error } = await supabase
      .from('profiles' as any)
      .select('id, name, is_active')
      .limit(3);
    
    if (error) {
      console.error('❌ Erro ao testar:', error);
    } else {
      console.log(`✅ Acesso OK (${data?.length || 0} registros lidos)`);
    }
    
    console.log('\n✅ Correção concluída!');
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message || error);
    process.exit(1);
  }
}

fixProfilesRLS();
