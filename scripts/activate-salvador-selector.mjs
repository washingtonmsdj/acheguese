#!/usr/bin/env node
// @ts-check
/**
 * Ativa Salvador no seletor de territórios
 * Define metadata.is_selector_active = true
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function activateSalvadorInSelector() {
  console.log('🔧 Ativando Salvador no seletor de territórios...\n');

  // 1. Buscar Salvador
  const { data: salvador, error: findError } = await supabase
    .from('locations')
    .select('*')
    .eq('geographic_path', '/br/ba/salvador')
    .single();

  if (findError || !salvador) {
    console.error('❌ Salvador não encontrado:', findError?.message);
    return;
  }

  console.log('✅ Salvador encontrado:');
  console.log('   ID:', salvador.id);
  console.log('   Nome:', salvador.name);
  console.log('   Type:', salvador.type);
  console.log('   Metadata atual:', JSON.stringify(salvador.metadata, null, 2));
  console.log('');

  // 2. Atualizar metadata para ativar no seletor
  const newMetadata = {
    ...(salvador.metadata || {}),
    is_selector_active: true,
    is_navigable: true,
  };

  const { error: updateError } = await supabase
    .from('locations')
    .update({ metadata: newMetadata })
    .eq('id', salvador.id);

  if (updateError) {
    console.error('❌ Erro ao atualizar Salvador:', updateError.message);
    return;
  }

  console.log('✅ Salvador ativado no seletor com sucesso!');
  console.log('   Metadata atualizado:', JSON.stringify(newMetadata, null, 2));
  console.log('');
  console.log('💡 Agora Salvador aparecerá como opção no seletor de territórios');
  console.log('   Recarregue a página para ver a mudança');
}

activateSalvadorInSelector().catch(console.error);
