/**
 * Verificação final das vagas
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SALVADOR_CORRETO = '63c41c29-adce-40f5-a552-e52d176123c3';

async function finalCheck() {
  console.log('🎯 Verificação Final\n');

  const { data, error } = await supabase
    .from('vagas')
    .select('titulo, empresa, status, location_id')
    .eq('location_id', SALVADOR_CORRETO)
    .eq('status', 'ativa');

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log(`✅ ${data?.length || 0} vagas ativas em Salvador\n`);
  
  data?.forEach((v, i) => {
    console.log(`${i + 1}. ${v.titulo} (${v.empresa})`);
  });

  if (data && data.length > 0) {
    console.log('\n🎉 SUCESSO! As vagas devem aparecer em:');
    console.log('   http://localhost:8080/vagas/ba/salvador');
  }
}

finalCheck();
