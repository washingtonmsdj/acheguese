/**
 * Script para atualizar location_id das vagas para Salvador
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xhdowzacfujckjelqhtd.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_WVn4OOnU853X3kGXwi2miA_9HmLO83V';

const supabase = createClient(supabaseUrl, supabaseKey);

const SALVADOR_LOCATION_ID = '63c41c29-adce-40f5-a552-e52d176123c3';

async function fixVagasLocation() {
  console.log('🔧 Atualizando location_id das vagas para Salvador...\n');

  try {
    // Buscar vagas atuais
    const { data: vagas, error: fetchError } = await supabase
      .from('vagas')
      .select('id, titulo, location_id');

    if (fetchError) {
      console.error('❌ Erro ao buscar vagas:', fetchError.message);
      process.exit(1);
    }

    if (!vagas || vagas.length === 0) {
      console.log('⚠️  Nenhuma vaga encontrada');
      process.exit(0);
    }

    console.log(`📋 Encontradas ${vagas.length} vagas\n`);

    // Atualizar cada vaga
    let updated = 0;
    let errors = 0;

    for (const vaga of vagas) {
      if (vaga.location_id === SALVADOR_LOCATION_ID) {
        console.log(`⏭️  ${vaga.titulo} - já está em Salvador`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('vagas')
        .update({ location_id: SALVADOR_LOCATION_ID })
        .eq('id', vaga.id);

      if (updateError) {
        console.error(`❌ ${vaga.titulo} - Erro: ${updateError.message}`);
        errors++;
      } else {
        console.log(`✅ ${vaga.titulo} - Atualizado para Salvador`);
        updated++;
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`   Atualizadas: ${updated}`);
    console.log(`   Erros: ${errors}`);
    console.log(`   Total: ${vagas.length}`);

    if (updated > 0) {
      console.log('\n✅ Vagas atualizadas com sucesso!');
      console.log('💡 Recarregue a página http://localhost:8080/vagas/ba/salvador');
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

fixVagasLocation();
