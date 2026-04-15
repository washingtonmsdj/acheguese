#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testToggle() {
  console.log('🧪 Testando toggle de is_selector_active...\n');

  // Pegar Salvador
  const { data: salvador, error: fetchError } = await supabase
    .from('locations')
    .select('*')
    .eq('slug', 'salvador')
    .single();

  if (fetchError) {
    console.error('❌ Erro ao buscar Salvador:', fetchError);
    return;
  }

  console.log('📍 Salvador atual:');
  console.log('  ID:', salvador.id);
  console.log('  Nome:', salvador.name);
  console.log('  Metadata:', JSON.stringify(salvador.metadata, null, 2));
  console.log('  is_selector_active:', salvador.metadata?.is_selector_active);
  console.log('');

  // Tentar toggle
  const currentValue = salvador.metadata?.is_selector_active === true;
  const newValue = !currentValue;

  console.log(`🔄 Tentando mudar de ${currentValue} para ${newValue}...\n`);

  const updatedMetadata = {
    ...salvador.metadata,
    is_selector_active: newValue,
  };

  const { data: updated, error: updateError } = await supabase
    .from('locations')
    .update({ metadata: updatedMetadata })
    .eq('id', salvador.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Erro ao atualizar:', updateError);
    return;
  }

  console.log('✅ Atualizado com sucesso!');
  console.log('  Novo metadata:', JSON.stringify(updated.metadata, null, 2));
  console.log('  Novo is_selector_active:', updated.metadata?.is_selector_active);
  console.log('');

  // Reverter
  console.log('🔙 Revertendo para o valor original...\n');

  const revertedMetadata = {
    ...updated.metadata,
    is_selector_active: currentValue,
  };

  const { data: reverted, error: revertError } = await supabase
    .from('locations')
    .update({ metadata: revertedMetadata })
    .eq('id', salvador.id)
    .select()
    .single();

  if (revertError) {
    console.error('❌ Erro ao reverter:', revertError);
    return;
  }

  console.log('✅ Revertido com sucesso!');
  console.log('  Metadata final:', JSON.stringify(reverted.metadata, null, 2));
  console.log('  is_selector_active final:', reverted.metadata?.is_selector_active);
}

testToggle().catch(console.error);
