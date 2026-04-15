#!/usr/bin/env tsx
/**
 * Adiciona membros ao grupo Complexo do Nordeste de Amaralina
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const GROUP_ID = 'fc322564-17cf-4de0-95f1-d78672750e8d';

async function addMembers() {
  console.log('🚀 Adicionando membros ao Complexo do Nordeste...\n');

  // 1. Buscar bairros do Complexo
  console.log('📝 Passo 1: Buscando bairros do Complexo...');
  
  const bairrosNomes = [
    'Nordeste de Amaralina',
    'Santa Cruz',
    'Alto do Coqueirinho',
    'Calabetão'
  ];

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, geographic_path')
    .in('name', bairrosNomes);

  console.log(`✅ Bairros encontrados: ${locations?.length || 0}`);
  console.table(locations);
  console.log('');

  if (!locations || locations.length === 0) {
    console.error('❌ Nenhum bairro encontrado!');
    return;
  }

  // 2. Adicionar membros ao grupo
  console.log('📝 Passo 2: Adicionando membros ao grupo...\n');

  for (const location of locations) {
    const { error } = await supabase
      .from('territorial_group_members')
      .insert({
        group_id: GROUP_ID,
        location_id: location.id
      });

    if (error) {
      if (error.code === '23505') {
        console.log(`⏭️  ${location.name} - já é membro`);
      } else {
        console.error(`❌ ${location.name} - erro:`, error.message);
      }
    } else {
      console.log(`✅ ${location.name} - adicionado`);
    }
  }

  // 3. Verificar resultado
  console.log('\n📝 Passo 3: Verificando membros do grupo...\n');
  
  const { data: members } = await supabase
    .from('territorial_group_members')
    .select('location_id, locations(name)')
    .eq('group_id', GROUP_ID);

  console.log('✅ Membros do grupo:');
  console.table(members);

  if (members && members.length >= 2) {
    console.log(`\n🎉 SUCESSO! Grupo tem ${members.length} membros!`);
  } else {
    console.log(`\n⚠️  Esperado pelo menos 2 membros, encontrado ${members?.length || 0}`);
  }
}

addMembers();
