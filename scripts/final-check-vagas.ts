/**
 * Verificação final das vagas
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xhdowzacfujckjelqhtd.supabase.co',
  'sb_publishable_WVn4OOnU853X3kGXwi2miA_9HmLO83V'
);

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
