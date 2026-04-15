import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local');
  console.log('💡 Adicione a service role key ao arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeUserAdmin() {
  const userId = 'a3ea040f-6f7a-44dd-b778-10eff4295303';
  
  console.log(`🔧 Tornando usuário ${userId} admin...`);
  
  // Inserir ou atualizar role de admin
  const { data, error } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role: 'admin',
      is_active: true,
      granted_at: new Date().toISOString(),
      expires_at: null
    }, {
      onConflict: 'user_id,role'
    })
    .select();

  if (error) {
    console.error('❌ Erro ao adicionar role de admin:', error);
    process.exit(1);
  }

  console.log('✅ Role de admin adicionada com sucesso!');
  
  // Verificar o resultado
  const { data: roles, error: checkError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId);

  if (checkError) {
    console.error('❌ Erro ao verificar roles:', checkError);
    process.exit(1);
  }

  console.log('\n📋 Roles do usuário:');
  console.table(roles);
}

makeUserAdmin().catch(console.error);
