#!/usr/bin/env node
// @ts-check
/**
 * Verifica o nível (level) de Salvador no banco de dados
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkSalvadorLevel() {
  console.log('🔍 Verificando Salvador no banco de dados...\n');

  // Buscar Salvador
  const { data: salvador, error } = await supabase
    .from('locations')
    .select('*')
    .eq('geographic_path', '/br/ba/salvador')
    .single();

  if (error) {
    console.error('❌ Erro ao buscar Salvador:', error.message);
    return;
  }

  if (!salvador) {
    console.log('❌ Salvador não encontrado no banco de dados');
    return;
  }

  console.log('✅ Salvador encontrado:');
  console.log('   ID:', salvador.id);
  console.log('   Nome:', salvador.name);
  console.log('   Geographic Path:', salvador.geographic_path);
  console.log('   Level:', salvador.level);
  console.log('   Is Active:', salvador.is_active);
  console.log('   Slug:', salvador.slug);
  console.log('\n');

  if (salvador.level !== 'city') {
    console.log('⚠️  PROBLEMA: Salvador não está marcado como "city"!');
    console.log('   Level atual:', salvador.level);
    console.log('   Deveria ser: city');
    console.log('\n');
    console.log('💡 Para corrigir, execute:');
    console.log(`   UPDATE locations SET level = 'city' WHERE id = '${salvador.id}';`);
  } else {
    console.log('✅ Salvador está corretamente marcado como "city"');
  }
}

checkSalvadorLevel().catch(console.error);
