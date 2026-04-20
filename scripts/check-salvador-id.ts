/**
 * Script para verificar ID correto de Salvador
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xhdowzacfujckjelqhtd.supabase.co';
const supabaseKey = 'process.env.VITE_SUPABASE_PUBLISHABLE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSalvadorId() {
  console.log('🔍 Verificando ID de Salvador...\n');

  try {
    // Buscar Salvador
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, type')
      .ilike('name', '%salvador%');

    if (error) {
      console.error('❌ Erro:', error.message);
      process.exit(1);
    }

    if (!locations || locations.length === 0) {
      console.log('⚠️  Salvador não encontrado');
      
      // Listar algumas locations
      const { data: allLocations } = await supabase
        .from('locations')
        .select('id, name, type')
        .limit(10);

      console.log('\n📋 Locations disponíveis:');
      allLocations?.forEach(l => {
        console.log(`   - ${l.name} (${l.type}): ${l.id}`);
      });
      
      process.exit(0);
    }

    console.log('✅ Salvador encontrado:\n');
    locations.forEach(l => {
      console.log(`   ID: ${l.id}`);
      console.log(`   Nome: ${l.name}`);
      console.log(`   Tipo: ${l.type}`);
    });

    // Verificar vagas com esse ID
    const salvadorId = locations[0].id;
    const { data: vagas } = await supabase
      .from('vagas')
      .select('id, titulo')
      .eq('location_id', salvadorId);

    console.log(`\n📊 Vagas em Salvador: ${vagas?.length || 0}`);

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

checkSalvadorId();
