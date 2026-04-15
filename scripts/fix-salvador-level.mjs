#!/usr/bin/env node
// @ts-check
/**
 * Corrige o level de Salvador (e outras cidades) para 'city'
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Usar service role para UPDATE
);

async function fixCityLevels() {
  console.log('🔧 Corrigindo levels de cidades...\n');

  // 1. Verificar Salvador antes
  console.log('📍 Estado atual de Salvador:');
  const { data: salvadorBefore } = await supabase
    .from('locations')
    .select('id, name, geographic_path, level, is_active')
    .eq('geographic_path', '/br/ba/salvador')
    .single();
  
  console.log('   Level:', salvadorBefore?.level || 'undefined');
  console.log('');

  // 2. Atualizar Salvador
  console.log('🔄 Atualizando Salvador...');
  const { error: salvadorError } = await supabase
    .from('locations')
    .update({ level: 'city' })
    .eq('geographic_path', '/br/ba/salvador');

  if (salvadorError) {
    console.error('❌ Erro ao atualizar Salvador:', salvadorError.message);
    return;
  }
  console.log('✅ Salvador atualizado com sucesso!\n');

  // 3. Buscar todas as locations que parecem ser cidades (3 segmentos no path)
  console.log('🔍 Buscando outras cidades sem level definido...');
  const { data: allLocations } = await supabase
    .from('locations')
    .select('id, name, geographic_path, level')
    .is('level', null);

  if (!allLocations || allLocations.length === 0) {
    console.log('✅ Nenhuma outra cidade sem level encontrada\n');
  } else {
    // Filtrar apenas cidades (3 segmentos: /br/ba/salvador)
    const cities = allLocations.filter(loc => {
      const segments = loc.geographic_path.split('/').filter(Boolean);
      return segments.length === 3; // país/estado/cidade
    });

    if (cities.length > 0) {
      console.log(`📋 Encontradas ${cities.length} cidades sem level:`);
      cities.forEach(city => {
        console.log(`   - ${city.name} (${city.geographic_path})`);
      });
      console.log('');

      // Atualizar todas de uma vez
      console.log('🔄 Atualizando todas as cidades...');
      const cityIds = cities.map(c => c.id);
      const { error: bulkError } = await supabase
        .from('locations')
        .update({ level: 'city' })
        .in('id', cityIds);

      if (bulkError) {
        console.error('❌ Erro ao atualizar cidades:', bulkError.message);
      } else {
        console.log(`✅ ${cities.length} cidades atualizadas com sucesso!\n`);
      }
    } else {
      console.log('✅ Nenhuma outra cidade sem level encontrada\n');
    }
  }

  // 4. Verificar Salvador depois
  console.log('📍 Estado final de Salvador:');
  const { data: salvadorAfter } = await supabase
    .from('locations')
    .select('id, name, geographic_path, level, is_active')
    .eq('geographic_path', '/br/ba/salvador')
    .single();
  
  console.log('   Level:', salvadorAfter?.level);
  console.log('');

  if (salvadorAfter?.level === 'city') {
    console.log('✅ Correção concluída! Salvador agora está marcado como "city"');
    console.log('💡 Recarregue a página /ba/salvador para ver a CidadeLandingPage');
  } else {
    console.log('⚠️  Algo deu errado. Salvador ainda não está como "city"');
  }
}

fixCityLevels().catch(console.error);
