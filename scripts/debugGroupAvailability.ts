#!/usr/bin/env tsx
/**
 * Debug: Verificar por que useGroupAvailability retorna array vazio
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function debug() {
  console.log('🔍 Debug: Group Availability\n');

  // 1. Buscar grupo Complexo do Nordeste
  console.log('📝 Passo 1: Buscando grupo...');
  const { data: group } = await supabase
    .from('territorial_groups')
    .select('id, name, slug')
    .eq('slug', 'complexo-do-nordeste-de-amaralina')
    .single();

  if (!group) {
    console.error('❌ Grupo não encontrado!');
    return;
  }

  console.log('✅ Grupo encontrado:');
  console.log(`   ID: ${group.id}`);
  console.log(`   Nome: ${group.name}\n`);

  // 2. Buscar membros do grupo
  console.log('📝 Passo 2: Buscando membros do grupo...');
  const { data: members } = await supabase
    .from('territorial_group_members')
    .select('location_id, status')
    .eq('group_id', group.id);

  console.log(`✅ Membros encontrados: ${members?.length || 0}`);
  console.table(members);
  console.log('');

  const activeMemberIds = members?.filter(m => m.status === 'active').map(m => m.location_id) || [];
  console.log(`✅ Membros ativos: ${activeMemberIds.length}`);
  console.log(activeMemberIds);
  console.log('');

  // 3. Buscar rollouts para gastronomy nos membros
  console.log('📝 Passo 3: Buscando rollouts de gastronomy nos membros...');
  const { data: rollouts } = await supabase
    .from('module_rollouts')
    .select('module_key, location_id, status')
    .eq('module_key', 'gastronomy')
    .in('location_id', activeMemberIds);

  console.log(`✅ Rollouts encontrados: ${rollouts?.length || 0}`);
  console.table(rollouts);
  console.log('');

  // 4. Verificar rollout em Salvador (herança)
  console.log('📝 Passo 4: Verificando rollout em Salvador (herança)...');
  const { data: salvadorRollout } = await supabase
    .from('module_rollouts')
    .select('module_key, location_id, status')
    .eq('module_key', 'gastronomy')
    .eq('location_id', '63c41c29-adce-40f5-a552-e52d176123c3')
    .single();

  if (salvadorRollout) {
    console.log('✅ Rollout em Salvador encontrado:');
    console.table([salvadorRollout]);
  } else {
    console.log('❌ Rollout em Salvador NÃO encontrado!');
  }
  console.log('');

  // 5. Verificar locations dos membros
  console.log('📝 Passo 5: Verificando locations dos membros...');
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, parent_id, geographic_path')
    .in('id', activeMemberIds);

  console.log('✅ Locations dos membros:');
  console.table(locations);
  console.log('');

  // 6. Análise
  console.log('📊 ANÁLISE:');
  console.log('─'.repeat(70));
  
  if (rollouts && rollouts.length > 0) {
    console.log('✅ Rollouts DIRETOS encontrados nos membros');
    console.log(`   Membros com rollout: ${rollouts.length}/${activeMemberIds.length}`);
  } else {
    console.log('⚠️  Nenhum rollout DIRETO nos membros');
    console.log('   Sistema deve usar HERANÇA de Salvador');
    
    if (salvadorRollout) {
      console.log('   ✅ Salvador tem rollout → Membros devem herdar');
      console.log('   ✅ Todos os membros devem estar ativos');
    } else {
      console.log('   ❌ Salvador NÃO tem rollout → Bug!');
    }
  }
  
  console.log('─'.repeat(70));
}

debug();
